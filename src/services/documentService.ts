import type { Documento, TipoDocumento, UsuarioSesion } from '../types/document.types';
import { API, cabeceras, verificar } from './api';

export async function listarDocumentos(sesion: UsuarioSesion): Promise<Documento[]> {
  const res = await fetch(`${API}/documentos`, { headers: cabeceras(sesion) });
  await verificar(res, 'listar los documentos');
  return res.json();
}

export interface DatosDocumento {
  tipo: TipoDocumento;
  numero: string;
  fecha: string;
  dependencia: string;
  hashSha256: string;
}

export async function subirDocumento(
  archivo: File,
  datos: DatosDocumento,
  sesion: UsuarioSesion,
): Promise<Documento> {
  const res = await fetch(`${API}/documentos`, {
    method: 'POST',
    headers: cabeceras(sesion, {
      'Content-Type': archivo.type || 'application/octet-stream',
      'X-Nombre-Original': encodeURIComponent(archivo.name),
      'X-Mime-Type': encodeURIComponent(archivo.type || 'application/octet-stream'),
      'X-Hash-Sha256': datos.hashSha256,
      'X-Tipo-Documento': datos.tipo,
      'X-Numero-Documento': encodeURIComponent(datos.numero),
      'X-Fecha-Documento': datos.fecha,
      'X-Dependencia': encodeURIComponent(datos.dependencia),
    }),
    body: await archivo.arrayBuffer(),
  });
  await verificar(res, 'guardar el documento');
  return res.json();
}

export type CambiosDocumento = Partial<Pick<Documento, 'tipo_documento' | 'numero_documento' | 'fecha_documento' | 'dependencia'>>;

export async function actualizarDocumento(
  id: string,
  cambios: CambiosDocumento,
  sesion: UsuarioSesion,
): Promise<Documento> {
  const res = await fetch(`${API}/documentos/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: cabeceras(sesion, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(cambios),
  });
  await verificar(res, 'modificar el documento');
  return res.json();
}

export async function eliminarDocumento(id: string, sesion: UsuarioSesion): Promise<void> {
  const res = await fetch(`${API}/documentos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: cabeceras(sesion),
  });
  await verificar(res, 'eliminar el documento');
}

export async function obtenerUrlFirmada(
  id: string,
  sesion: UsuarioSesion,
  descarga = false,
): Promise<string> {
  const res = await fetch(`${API}/documentos/${encodeURIComponent(id)}/acceso`, {
    method: 'POST',
    headers: cabeceras(sesion, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ download: descarga }),
  });
  await verificar(res, 'obtener la URL firmada');
  const datos: { url: string } = await res.json();
  return datos.url;
}

export async function descargarDocumento(doc: Documento, sesion: UsuarioSesion): Promise<void> {
  const url = await obtenerUrlFirmada(doc.id, sesion, true);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = doc.nombre_archivo_original;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
}
