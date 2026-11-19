/**
 * Servidor de DESARROLLO para ISeP - Archivo General.
 * Sin dependencias externas: guarda archivos en disco, metadatos en JSON,
 * emite URLs firmadas de corta duración y registra TODA acción en un log
 * append-only (auditoría) con fecha, hora y usuario.
 *
 * NO es apto para producción: la validación de sesión y el rol de administrador
 * son stubs basados en cabeceras. Reemplazar por verificación JWT real.
 */
import { createServer } from 'node:http';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { appendFile, mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = path.dirname(fileURLToPath(import.meta.url));
const STORAGE = path.join(BASE, 'storage');
const FILES_DIR = path.join(STORAGE, 'files');
const META_FILE = path.join(STORAGE, 'metadata.json');
const AUDIT_FILE = path.join(STORAGE, 'auditoria.jsonl');

const PORT = Number(process.env.API_PORT ?? 3001);
const SECRET = process.env.ISEP_DEV_SECRET ?? 'isep-dev-secret-cambiar-en-produccion';
const MAX_BYTES = 15 * 1024 * 1024;
const TTL_MS = 15 * 60 * 1000;
const EXTENSIONES = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.tiff']);
const MIME_POR_EXT = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.tiff': 'image/tiff',
};
const EVENTOS = new Set([
  'ALTA_DOCUMENTO',
  'MODIFICACION_DOCUMENTO',
  'ELIMINACION_DOCUMENTO',
  'CONSULTA_LISTADO',
  'CONSULTA_DOCUMENTO',
  'DESCARGA_DOCUMENTO',
  'CONSULTA_AUDITORIA',
  'CONSULTA_AUDITORIA_DOCUMENTO',
  'IMPRESION_CONSTANCIA',
  'EXPORTACION_AUDITORIA',
  'CAMBIO_PERFIL',
  'ACCESO_DENEGADO',
]);

/** Eventos que el cliente puede comunicar; el resto solo los emite el servidor. */
const EVENTOS_CLIENTE = new Set([
  'ACCESO_DENEGADO',
  'IMPRESION_CONSTANCIA',
  'EXPORTACION_AUDITORIA',
  'CAMBIO_PERFIL',
]);

const dec = (valor) => {
  try {
    return decodeURIComponent(valor ?? '');
  } catch {
    return '';
  }
};

function responder(res, status, cuerpo, headers = {}) {
  const buffer = Buffer.from(JSON.stringify(cuerpo));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': buffer.length,
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(buffer);
}

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > MAX_BYTES) {
        reject(Object.assign(new Error('Archivo mayor a 15 MB'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function cuerpoJson(req) {
  const bytes = await leerCuerpo(req);
  if (!bytes.length) return {};
  return JSON.parse(bytes.toString('utf8'));
}

function tokenSesion(req) {
  const cabecera = req.headers.authorization ?? '';
  return cabecera.startsWith('Bearer ') ? cabecera.slice(7).trim() : '';
}

function usuario(req) {
  return dec(req.headers['x-usuario-id']) || 'anónimo';
}

function esAdmin(req) {
  return req.headers['x-es-admin'] === 'true';
}

/** Permisos por línea de trabajo, enviados por el cliente en este servidor de pruebas. */
function tienePermiso(req, nombre) {
  if (nombre === 'auditoria' && esAdmin(req)) return true;
  return req.headers[`x-puede-${nombre}`] === 'true';
}

function denegar(req, res, accion, permiso) {
  void auditar(req, 'ACCESO_DENEGADO', {
    detalles: `Sin permiso ${permiso} para ${accion}`,
  });
  return responder(res, 403, { error: `No tiene permiso para ${accion}` });
}

function firmar(id, exp, descarga) {
  return createHmac('sha256', SECRET)
    .update(`${id}:${exp}:${descarga ? 1 : 0}`)
    .digest('hex');
}

function firmaValida(id, exp, descarga, token) {
  if (!/^\d+$/.test(String(exp)) || typeof token !== 'string') return false;
  const esperada = Buffer.from(firmar(id, exp, descarga), 'hex');
  const recibida = Buffer.from(token, 'hex');
  return recibida.length === esperada.length && timingSafeEqual(recibida, esperada);
}

async function leerMetadatos() {
  try {
    return JSON.parse(await readFile(META_FILE, 'utf8'));
  } catch {
    return [];
  }
}

async function guardarMetadatos(docs) {
  await writeFile(META_FILE, JSON.stringify(docs, null, 2), 'utf8');
}

/** Escritura append-only: el log nunca se modifica ni se elimina desde la API. */
async function auditar(req, evento, extra = {}) {
  const ahora = new Date().toISOString();
  const registro = {
    id: randomUUID(),
    evento: EVENTOS.has(evento) ? evento : evento,
    fecha: ahora.slice(0, 10),
    hora: ahora.slice(11, 19),
    fecha_hora: ahora,
    usuario_id: usuario(req),
    nombre_usuario: dec(req.headers['x-nombre-completo']) || 'Desconocido',
    dependencia: dec(req.headers['x-usuario-dependencia']) || '',
    origen_ip: req.socket?.remoteAddress ?? '',
    ...extra,
  };
  await appendFile(AUDIT_FILE, `${JSON.stringify(registro)}\n`, 'utf8');
}

async function leerAuditoria(filtros = {}) {
  let lineas = [];
  try {
    lineas = (await readFile(AUDIT_FILE, 'utf8')).split('\n').filter(Boolean);
  } catch {
    return [];
  }
  const {
    evento,
    usuario: usuarioFiltro,
    documento,
    desde,
    hasta,
    limite: limiteSolicitado = 200,
  } = filtros;
  const limite = Math.min(Number(limiteSolicitado) || 200, 1000);

  const registros = lineas
    .map((linea) => {
      try { return JSON.parse(linea); } catch { return null; }
    })
    .filter(Boolean)
    .filter((r) => !evento || r.evento === evento)
    .filter((r) => !usuarioFiltro || String(r.usuario_id).includes(usuarioFiltro))
    .filter((r) => !documento || r.documento_id === documento)
    .filter((r) => !desde || r.fecha_hora >= desde)
    .filter((r) => !hasta || r.fecha_hora <= `${hasta}T23:59:59.999Z`)
    .sort((a, b) => String(b.fecha_hora).localeCompare(String(a.fecha_hora)));

  return registros.slice(0, limite);
}

function sinToken(req, res, accion) {
  void auditar(req, 'ACCESO_DENEGADO', { detalles: `Falta token de sesión para ${accion}` });
  return responder(res, 401, { error: 'Falta token de sesión' });
}

async function rutaDocumento(id) {
  const docs = await leerMetadatos();
  return { docs, doc: docs.find((d) => d.id === id) ?? null };
}

async function subirDocumento(req, res) {
  if (!tokenSesion(req)) return sinToken(req, res, 'subir documento');
  if (!tienePermiso(req, 'subir')) return denegar(req, res, 'subir documentos (línea 1)', 'subir');

  const nombre = dec(req.headers['x-nombre-original']);
  const mime = dec(req.headers['x-mime-type']) || req.headers['content-type'] || 'application/octet-stream';
  const hashDeclarado = String(req.headers['x-hash-sha256'] ?? '').toLowerCase();
  const tipo = dec(req.headers['x-tipo-documento']);
  const numero = dec(req.headers['x-numero-documento']);
  const fecha = dec(req.headers['x-fecha-documento']);
  const dependencia = dec(req.headers['x-dependencia']);

  if (!nombre || !numero || !fecha || !dependencia) {
    return responder(res, 400, { error: 'Faltan metadatos obligatorios' });
  }
  if (!['EXPEDIENTE', 'NOTA'].includes(tipo)) {
    return responder(res, 400, { error: 'tipo_documento inválido' });
  }
  const ext = path.extname(nombre).toLowerCase();
  if (!EXTENSIONES.has(ext)) {
    return responder(res, 400, { error: `Formato no permitido: ${ext || 'sin extensión'}` });
  }

  const bytes = await leerCuerpo(req);
  if (bytes.length === 0) return responder(res, 400, { error: 'Archivo vacío' });

  const hashReal = createHash('sha256').update(bytes).digest('hex');
  if (!/^[a-f0-9]{64}$/.test(hashDeclarado) || hashDeclarado !== hashReal) {
    void auditar(req, 'ACCESO_DENEGADO', { detalles: 'Hash SHA-256 rechazado en alta' });
    return responder(res, 400, { error: 'El SHA-256 no coincide con el archivo recibido' });
  }

  const id = randomUUID();
  await writeFile(path.join(FILES_DIR, `${id}${ext}`), bytes);

  const doc = {
    id,
    tipo_documento: tipo,
    numero_documento: numero,
    fecha_documento: fecha,
    dependencia,
    archivo_url: '',
    nombre_archivo_original: nombre,
    mime_type: MIME_POR_EXT[ext] ?? mime,
    hash_sha256: hashReal,
    tamano_bytes: bytes.length,
    usuario_carga_id: usuario(req),
    timestamp_carga: new Date().toISOString(),
  };
  const docs = await leerMetadatos();
  docs.push(doc);
  await guardarMetadatos(docs);
  await auditar(req, 'ALTA_DOCUMENTO', {
    documento_id: id,
    numero_documento: numero,
    detalles: `Alta de ${nombre} (${bytes.length} bytes) · SHA-256 ${hashReal}`,
  });
  return responder(res, 201, doc);
}

async function actualizarDocumento(req, res, id) {
  if (!tokenSesion(req)) return sinToken(req, res, 'modificar documento');
  if (!tienePermiso(req, 'subir')) return denegar(req, res, 'modificar metadatos (línea 1)', 'subir');
  const { docs, doc } = await rutaDocumento(id);
  if (!doc) return responder(res, 404, { error: 'Documento no encontrado' });

  let cambiosSolicitados;
  try {
    cambiosSolicitados = await cuerpoJson(req);
  } catch {
    return responder(res, 400, { error: 'Cuerpo inválido' });
  }

  const campos = ['tipo_documento', 'numero_documento', 'fecha_documento', 'dependencia'];
  const cambios = {};
  for (const campo of campos) {
    const valor = cambiosSolicitados[campo];
    if (valor === undefined) continue;
    const nuevo = String(valor).trim();
    if (!nuevo) return responder(res, 400, { error: `${campo} no puede estar vacío` });
    if (campo === 'tipo_documento' && !['EXPEDIENTE', 'NOTA'].includes(nuevo)) {
      return responder(res, 400, { error: 'tipo_documento inválido' });
    }
    if (doc[campo] !== nuevo) cambios[campo] = { antes: doc[campo], despues: nuevo };
    doc[campo] = nuevo;
  }

  await guardarMetadatos(docs);
  await auditar(req, 'MODIFICACION_DOCUMENTO', {
    documento_id: id,
    numero_documento: doc.numero_documento,
    detalles: Object.keys(cambios).length ? cambios : { sin_cambios: true },
  });
  return responder(res, 200, doc);
}

async function eliminarDocumento(req, res, id) {
  if (!tokenSesion(req)) return sinToken(req, res, 'eliminar documento');
  if (!tienePermiso(req, 'subir')) return denegar(req, res, 'eliminar documentos (línea 1)', 'subir');
  const { docs, doc } = await rutaDocumento(id);
  if (!doc) return responder(res, 404, { error: 'Documento no encontrado' });

  await guardarMetadatos(docs.filter((d) => d.id !== id));
  const ext = path.extname(doc.nombre_archivo_original).toLowerCase();
  await unlink(path.join(FILES_DIR, `${id}${ext}`)).catch(() => {});
  await auditar(req, 'ELIMINACION_DOCUMENTO', {
    documento_id: id,
    numero_documento: doc.numero_documento,
    detalles: `Eliminado ${doc.nombre_archivo_original} · SHA-256 ${doc.hash_sha256}`,
  });
  return responder(res, 200, { ok: true });
}

async function crearUrlFirmada(req, res, id) {
  if (!tokenSesion(req)) return sinToken(req, res, 'obtener URL firmada');
  const { doc } = await rutaDocumento(id);
  if (!doc) return responder(res, 404, { error: 'Documento no encontrado' });

  let descarga = false;
  try {
    const cuerpo = await cuerpoJson(req);
    descarga = Boolean(cuerpo.download);
  } catch {
    return responder(res, 400, { error: 'Cuerpo inválido' });
  }

  const permisoNecesario = descarga ? 'descargar' : 'revisar';
  if (!tienePermiso(req, permisoNecesario)) {
    return denegar(
      req,
      res,
      descarga ? 'descargar el original (línea 2)' : 'revisar documentos (línea 2)',
      permisoNecesario,
    );
  }

  const exp = Date.now() + TTL_MS;
  const firma = firmar(id, exp, descarga);
  await auditar(req, descarga ? 'DESCARGA_DOCUMENTO' : 'CONSULTA_DOCUMENTO', {
    documento_id: id,
    numero_documento: doc.numero_documento,
    detalles: descarga ? `Descarga de ${doc.nombre_archivo_original}` : `Apertura de ${doc.nombre_archivo_original}`,
  });
  responder(res, 200, {
    url: `/api/documentos/${id}/contenido?token=${firma}&exp=${exp}&download=${descarga ? 1 : 0}`,
    expira_en: new Date(exp).toISOString(),
  });
}

async function servirContenido(req, res, id, url) {
  const exp = Number(url.searchParams.get('exp'));
  const firma = url.searchParams.get('token') ?? '';
  const descarga = url.searchParams.get('download') === '1';

  if (!firmaValida(id, exp, descarga, firma) || exp < Date.now()) {
    void auditar(req, 'ACCESO_DENEGADO', {
      documento_id: id,
      detalles: 'URL firmada inválida o expirada',
    });
    return responder(res, 403, { error: 'URL firmada inválida o expirada' });
  }
  const { doc } = await rutaDocumento(id);
  if (!doc) return responder(res, 404, { error: 'Documento no encontrado' });

  const ext = path.extname(doc.nombre_archivo_original).toLowerCase();
  const filePath = path.join(FILES_DIR, `${id}${ext}`);
  const info = await stat(filePath);
  const nombreCodificado = encodeURIComponent(doc.nombre_archivo_original);

  res.writeHead(200, {
    'Content-Type': doc.mime_type,
    'Content-Length': info.size,
    'Content-Disposition': `${descarga ? 'attachment' : 'inline'}; filename*=UTF-8''${nombreCodificado}`,
    'Cache-Control': 'no-store, private',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
  });
  createReadStream(filePath).pipe(res);
}

const servidor = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const ruta = url.pathname;

  try {
    if (req.method === 'GET' && ruta === '/api/health') {
      return responder(res, 200, { ok: true });
    }

    if (req.method === 'GET' && ruta === '/api/auditoria') {
      if (!tokenSesion(req)) return sinToken(req, res, 'consultar auditoría');
      if (!esAdmin(req)) {
        void auditar(req, 'ACCESO_DENEGADO', { detalles: 'Consulta de auditoría sin rol de administrador' });
        return responder(res, 403, { error: 'Acceso restringido a administradores' });
      }
      const registros = await leerAuditoria({
        evento: url.searchParams.get('evento'),
        usuario: url.searchParams.get('usuario'),
        documento: url.searchParams.get('documento'),
        desde: url.searchParams.get('desde'),
        hasta: url.searchParams.get('hasta'),
        limite: url.searchParams.get('limite'),
      });
      await auditar(req, 'CONSULTA_AUDITORIA', {
        detalles: `Consulta de auditoría · ${registros.length} registros`,
      });
      return responder(res, 200, registros);
    }

    if (req.method === 'POST' && ruta === '/api/eventos') {
      if (!tokenSesion(req)) return sinToken(req, res, 'registrar evento');
      const cuerpo = await cuerpoJson(req);
      const evento = String(cuerpo.evento ?? '');
      if (!EVENTOS_CLIENTE.has(evento)) {
        return responder(res, 400, { error: 'Evento de auditoría no permitido' });
      }
      await auditar(req, evento, {
        documento_id: cuerpo.documento_id || undefined,
        detalles: String(cuerpo.detalles ?? '').slice(0, 500),
      });
      return responder(res, 200, { ok: true });
    }

    if (req.method === 'GET' && ruta === '/api/documentos') {
      if (!tokenSesion(req)) return sinToken(req, res, 'listar documentos');
      if (!tienePermiso(req, 'revisar') && !tienePermiso(req, 'subir')) {
        return denegar(req, res, 'consultar el listado', 'revisar o subir');
      }
      const docs = await leerMetadatos();
      void auditar(req, 'CONSULTA_LISTADO', { detalles: `${docs.length} documentos en el listado` });
      return responder(res, 200, docs.sort((a, b) => b.timestamp_carga.localeCompare(a.timestamp_carga)));
    }

    if (req.method === 'POST' && ruta === '/api/documentos') {
      return await subirDocumento(req, res);
    }

    let coincidencia = /^\/api\/documentos\/([^/]+)\/auditoria$/.exec(ruta);
    if (req.method === 'GET' && coincidencia) {
      if (!tokenSesion(req)) return sinToken(req, res, 'consultar el historial');
      if (!tienePermiso(req, 'revisar')) {
        return denegar(req, res, 'consultar el historial del documento (línea 2)', 'revisar');
      }
      const idDocumento = coincidencia[1];
      const { doc } = await rutaDocumento(idDocumento);
      if (!doc) return responder(res, 404, { error: 'Documento no encontrado' });
      const registros = await leerAuditoria({ documento: idDocumento, limite: 200 });
      void auditar(req, 'CONSULTA_AUDITORIA_DOCUMENTO', {
        documento_id: idDocumento,
        numero_documento: doc.numero_documento,
        detalles: `Historial del documento · ${registros.length} registros`,
      });
      return responder(res, 200, registros);
    }

    coincidencia = /^\/api\/documentos\/([^/]+)\/acceso$/.exec(ruta);
    if (req.method === 'POST' && coincidencia) {
      return await crearUrlFirmada(req, res, coincidencia[1]);
    }

    coincidencia = /^\/api\/documentos\/([^/]+)\/contenido$/.exec(ruta);
    if (req.method === 'GET' && coincidencia) {
      return await servirContenido(req, res, coincidencia[1], url);
    }

    coincidencia = /^\/api\/documentos\/([^/]+)$/.exec(ruta);
    if (coincidencia && (req.method === 'PATCH' || req.method === 'PUT')) {
      return await actualizarDocumento(req, res, coincidencia[1]);
    }
    if (coincidencia && req.method === 'DELETE') {
      return await eliminarDocumento(req, res, coincidencia[1]);
    }

    return responder(res, 404, { error: 'Ruta no encontrada' });
  } catch (error) {
    const status = error.status ?? 500;
    if (status === 500) console.error('[api]', error);
    return responder(res, status, { error: error.message ?? 'Error interno' });
  }
});

await mkdir(FILES_DIR, { recursive: true });
await writeFile(META_FILE, await readFile(META_FILE, 'utf8').catch(() => '[]'), 'utf8');
await writeFile(AUDIT_FILE, '', { flag: 'a' }).catch(() => {});
servidor.listen(PORT, '127.0.0.1', () => {
  console.log(`[api] ISeP dev API en http://127.0.0.1:${PORT}`);
  console.log(`[api] almacenamiento: ${STORAGE}`);
});
