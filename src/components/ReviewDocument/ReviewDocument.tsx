import { useCallback, useEffect, useState } from 'react';
import styles from './ReviewDocument.module.css';
import { Icon, type NombreIcono } from '../Icon/Icon';
import { EditModal } from '../EditModal/EditModal';
import { detalleComoTexto, ETIQUETAS_EVENTO, listarAuditoriaDocumento, registrarEvento } from '../../services/auditService';
import { descargarDocumento, obtenerUrlFirmada } from '../../services/documentService';
import { puedeDescargar, puedeSubir, puedeVerAuditoria } from '../../services/permisos';
import { formatearFecha, formatoArchivo, tamanoLegible } from '../../utils/format';
import type { RegistroAuditoria } from '../../types/audit.types';
import type { Documento, UsuarioSesion } from '../../types/document.types';

interface Props {
  doc: Documento;
  usuario: UsuarioSesion;
  onVolver: () => void;
  onNotificar: (mensaje: string) => void;
  onDenegado: (mensaje: string) => void;
  onCambios: () => void;
  onEliminar: (doc: Documento) => void;
}

const ICONO_EVENTO: Record<string, NombreIcono> = {
  ALTA_DOCUMENTO: 'upload',
  MODIFICACION_DOCUMENTO: 'edit',
  ELIMINACION_DOCUMENTO: 'delete',
  CONSULTA_LISTADO: 'description',
  CONSULTA_DOCUMENTO: 'eye',
  DESCARGA_DOCUMENTO: 'download',
  CONSULTA_AUDITORIA_DOCUMENTO: 'history',
  CONSULTA_AUDITORIA: 'history',
  IMPRESION_CONSTANCIA: 'print',
  EXPORTACION_AUDITORIA: 'file',
  CAMBIO_PERFIL: 'manage',
  ACCESO_DENEGADO: 'lock',
};

function colorEvento(evento: string): string {
  if (evento === 'DESCARGA_DOCUMENTO' || evento === 'EXPORTACION_AUDITORIA') return styles.puntoAccion;
  if (evento === 'ACCESO_DENEGADO') return styles.puntoDenegado;
  if (evento === 'ALTA_DOCUMENTO' || evento === 'ELIMINACION_DOCUMENTO') return styles.puntoNeutro;
  if (evento.includes('CONSULTA')) return styles.puntoConsulta;
  return styles.puntoVerde;
}

export function ReviewDocument({ doc, usuario, onVolver, onNotificar, onDenegado, onCambios, onEliminar }: Props) {
  const [url, setUrl] = useState('');
  const [errorPreview, setErrorPreview] = useState('');
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [errorLogs, setErrorLogs] = useState('');
  const [zoom, setZoom] = useState(100);
  const [editando, setEditando] = useState(false);

  const conDescarga = puedeDescargar(usuario);
  const conAuditoria = puedeVerAuditoria(usuario);
  const conEdicion = puedeSubir(usuario);

  const cargarLogs = useCallback(async () => {
    try {
      setRegistros(await listarAuditoriaDocumento(doc.id, usuario));
      setErrorLogs('');
    } catch (err) {
      setErrorLogs(err instanceof Error ? err.message : 'No se pudo cargar el historial.');
    }
  }, [doc.id, usuario]);

  useEffect(() => {
    let activo = true;
    obtenerUrlFirmada(doc.id, usuario)
      .then((firmada) => { if (activo) setUrl(firmada); })
      .catch((err: unknown) => {
        if (activo) setErrorPreview(err instanceof Error ? err.message : 'No se pudo abrir el archivo.');
      });
    return () => { activo = false; };
  }, [doc.id, usuario]);

  useEffect(() => {
    let activo = true;
    listarAuditoriaDocumento(doc.id, usuario)
      .then((datos) => {
        if (!activo) return;
        setRegistros(datos);
        setErrorLogs('');
      })
      .catch((err: unknown) => {
        if (activo) setErrorLogs(err instanceof Error ? err.message : 'No se pudo cargar el historial.');
      });
    return () => { activo = false; };
  }, [doc.id, usuario]);

  const descargar = async () => {
    if (!conDescarga) {
      onDenegado('Su perfil no tiene permiso para descargar originales. Cada intento queda registrado.');
      return;
    }
    try {
      await descargarDocumento(doc, usuario);
      onNotificar(`Descarga de ${doc.numero_documento} autorizada y registrada en auditoría.`);
      void cargarLogs();
    } catch (err) {
      onNotificar(err instanceof Error ? err.message : 'No se pudo descargar el archivo.');
    }
  };

  const imprimir = () => {
    void registrarEvento('IMPRESION_CONSTANCIA', `Constancia de ${doc.numero_documento} enviada a impresión`, usuario, doc.id)
      .catch(() => {});
    window.print();
    onNotificar('Constancia de vista preliminar enviada a impresión y registrada.');
    void cargarLogs();
  };

  const exportarLog = () => {
    void registrarEvento('EXPORTACION_AUDITORIA', `Historial de ${doc.numero_documento} exportado`, usuario, doc.id)
      .catch(() => {});
    const columnas = ['fecha', 'hora', 'evento', 'nombre_usuario', 'origen_ip', 'detalles'];
    const escapar = (valor: unknown) => `"${String(valor ?? '').replace(/"/g, '""')}"`;
    const filas = [
      columnas.join(','),
      ...registros.map((registro) => columnas.map((columna) => {
        if (columna === 'evento') return escapar(ETIQUETAS_EVENTO[registro.evento] ?? registro.evento);
        if (columna === 'detalles') return escapar(detalleComoTexto(registro.detalles));
        return escapar(registro[columna as keyof RegistroAuditoria]);
      }).join(',')),
    ];
    const enlace = document.createElement('a');
    const objetoUrl = URL.createObjectURL(new Blob([`\uFEFF${filas.join('\r\n')}`], { type: 'text/csv;charset=utf-8' }));
    enlace.href = objetoUrl;
    enlace.download = `historial-${doc.numero_documento}-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(objetoUrl);
    onNotificar('Historial de auditoría exportado correctamente.');
  };

  const esImagen = doc.mime_type.startsWith('image/');
  const esPdf = doc.mime_type === 'application/pdf';
  const formato = formatoArchivo(doc.mime_type, doc.nombre_archivo_original);

  const banner = !conDescarga
    ? {
        clase: styles.bannerRestringido,
        icono: 'security' as NombreIcono,
        titulo: 'Modo Consulta (Sin permiso de descarga):',
        texto: 'Su usuario tiene habilitada la lectura visual del documento. La descarga y extracción de copias requiere autorización de la Dirección o perfil Oficial.',
      }
    : conAuditoria
      ? {
          clase: styles.bannerAuditoria,
          icono: 'verified' as NombreIcono,
          titulo: 'Sesión de Auditoría Activa:',
          texto: 'Acceso total con visualización del rastro de auditoría, registros de IP y control de legalidad según Ley Provincial N.º 14.256.',
        }
      : {
          clase: styles.bannerAutorizado,
          icono: 'security' as NombreIcono,
          titulo: 'Acceso autorizado para consulta y descarga:',
          texto: 'Usted posee permisos asignados para visualizar y generar copias. Cada apertura y descarga genera un registro de auditoría con sello de tiempo.',
        };

  return (
    <section className={styles.page}>
      <div className={styles.statusBar}>
        <div className={styles.statusInfo}>
          <button type="button" className={styles.backBtn} onClick={onVolver} title="Volver al dashboard">
            <Icon nombre="arrowBack" size={22} />
          </button>
          <span className={styles.docIcon}><Icon nombre="description" size={28} /></span>
          <div>
            <div className={styles.statusHead}>
              <span className={styles.numero}>{doc.numero_documento}</span>
              <span className={styles.chip}>{doc.tipo_documento === 'EXPEDIENTE' ? 'Expediente Digitalizado' : 'Nota Digitalizada'}</span>
              <span className={styles.chipVerde}><Icon nombre="verified" size={14} /> SHA-256 verificado</span>
            </div>
            <p className={styles.statusMeta}>
              Dependencia: <strong>{doc.dependencia}</strong> · Fecha del documento: <strong>{formatearFecha(doc.fecha_documento)}</strong> · Formato: <strong>{formato}</strong>
            </p>
          </div>
        </div>

        <div className={styles.statusActions}>
          <button
            type="button"
            className={`${styles.downloadBtn} ${!conDescarga ? styles.downloadLocked : ''} ${conAuditoria ? styles.downloadForensic : ''}`}
            onClick={() => void descargar()}
            aria-disabled={!conDescarga}
          >
            <Icon nombre={!conDescarga ? 'lock' : conAuditoria ? 'security' : 'download'} size={20} />
            <span>
              {!conDescarga
                ? 'Descarga restringida por permisos'
                : conAuditoria
                  ? 'Descarga de Auditoría'
                  : 'Descargar Documento Oficial'}
            </span>
          </button>
          <button type="button" className={styles.printBtn} onClick={imprimir}>
            <Icon nombre="print" size={20} />
            <span>Imprimir Constancia</span>
          </button>
        </div>
      </div>

      <div className={`${styles.banner} ${banner.clase}`} role="status">
        <Icon nombre={banner.icono} size={22} />
        <p><strong>{banner.titulo}</strong> {banner.texto}</p>
      </div>

      <div className={styles.grid}>
        <section className={styles.viewerColumn}>
          <div className={styles.viewerCard}>
            <div className={styles.viewerToolbar}>
              <span className={styles.viewerTitle}>Vista preliminar del archivo archivado</span>
              <div className={styles.viewerTools}>
                <button type="button" title="Página anterior" className={styles.toolBtn}><Icon nombre="chevronLeft" size={20} /></button>
                <span className={styles.pagina}>1 / 1</span>
                <button type="button" title="Página siguiente" className={styles.toolBtn}><Icon nombre="chevronRight" size={20} /></button>
                <span className={styles.separador} />
                <button type="button" title="Alejar" className={styles.toolBtn} onClick={() => setZoom((z) => Math.max(60, z - 20))}><Icon nombre="zoomOut" size={20} /></button>
                <span className={styles.pagina}>{zoom}%</span>
                <button type="button" title="Acercar" className={styles.toolBtn} onClick={() => setZoom((z) => Math.min(160, z + 20))}><Icon nombre="zoomIn" size={20} /></button>
              </div>
            </div>

            <div className={styles.viewerBody}>
              <div className={styles.marcaAgua}>ISEP SANTA FE<br />ARCHIVO AUDITADO</div>
              {errorPreview && <p className={styles.error} role="alert">{errorPreview}</p>}
              {!errorPreview && !url && <p className={styles.cargando}>Solicitando URL firmada…</p>}
              {url && esPdf && (
                <iframe
                  className={styles.preview}
                  src={url}
                  title={`Vista previa de ${doc.nombre_archivo_original}`}
                  style={{ width: `${zoom}%`, height: `${zoom}%` }}
                />
              )}
              {url && esImagen && (
                <img
                  className={styles.previewImagen}
                  src={url}
                  alt={`Vista previa de ${doc.nombre_archivo_original}`}
                  style={{ width: `${zoom}%` }}
                />
              )}
              {url && !esPdf && !esImagen && (
                <p className={styles.cargando}>Sin vista previa para este formato. Puede descargar el original si tiene permiso.</p>
              )}
            </div>
            <p className={styles.viewerFoot}>La URL firmada expira en 15 minutos. Cada apertura queda registrada en la auditoría.</p>
          </div>
        </section>

        <aside className={styles.sideColumn}>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}><Icon nombre="info" size={20} /> Metadatos Archivísticos</h2>
            <dl className={styles.meta}>
              <dt>Tipo Documental</dt><dd>{doc.tipo_documento === 'EXPEDIENTE' ? 'Expediente' : 'Nota'}</dd>
              <dt>Dependencia Emisora</dt><dd>{doc.dependencia}</dd>
              <dt>Número Oficial</dt><dd className={styles.mono}>{doc.numero_documento}</dd>
              <dt>Fecha del Documento</dt><dd>{formatearFecha(doc.fecha_documento)}</dd>
              <dt>Formato</dt><dd>{formato}</dd>
              <dt>Tamaño del archivo</dt><dd>{tamanoLegible(doc.tamano_bytes)}</dd>
              <dt>Usuario de carga</dt><dd>{doc.usuario_carga_id}</dd>
              <dt>Clasificación</dt><dd><span className={styles.clasificacion}>Reservado ISeP</span></dd>
            </dl>
            <details className={styles.hashDetalle}>
              <summary>Huella SHA-256</summary>
              <code>{doc.hash_sha256}</code>
            </details>
            {conEdicion && (
              <div className={styles.metaActions}>
                <button type="button" onClick={() => setEditando(true)}><Icon nombre="edit" size={16} /> Editar metadatos</button>
                <button type="button" className={styles.eliminarBtn} onClick={() => onEliminar(doc)}><Icon nombre="delete" size={16} /> Eliminar</button>
              </div>
            )}
          </article>

          <article className={styles.card}>
            <div className={styles.logHeader}>
              <h2 className={styles.cardTitle}><Icon nombre="history" size={20} /> Historial de Auditoría</h2>
              <span className={styles.contadorLogs}>{registros.length} registros</span>
            </div>
            <p className={styles.logLegal}>Trazabilidad bajo Ley Provincial N.º 14.256 y Ley N.º 25.326.</p>

            {errorLogs && <p className={styles.error} role="alert">{errorLogs}</p>}
            {!errorLogs && registros.length === 0 && <p className={styles.cargando}>Sin movimientos registrados.</p>}

            <ol className={styles.timeline}>
              {registros.map((registro, indice) => (
                <li key={registro.id ?? `${registro.fecha_hora}-${indice}`} className={styles.logItem}>
                  <span className={`${styles.punto} ${colorEvento(registro.evento)}`}>
                    <Icon nombre={ICONO_EVENTO[registro.evento] ?? 'history'} size={14} />
                  </span>
                  <div className={styles.logContenido}>
                    <div className={styles.logCabecera}>
                      <strong>{ETIQUETAS_EVENTO[registro.evento] ?? registro.evento}</strong>
                      <time>{registro.hora ?? registro.fecha_hora.slice(11, 16)}</time>
                    </div>
                    <p>{registro.nombre_usuario || registro.usuario_id} · {registro.fecha ?? registro.fecha_hora.slice(0, 10)}</p>
                    {detalleComoTexto(registro.detalles) && <p className={styles.logDetalle}>{detalleComoTexto(registro.detalles)}</p>}
                    {conAuditoria && registro.origen_ip && <p className={styles.logIp}>IP {registro.origen_ip} · {registro.evento}</p>}
                  </div>
                </li>
              ))}
            </ol>

            <div className={styles.logFoot}>
              <span>Registro inalterable</span>
              {conAuditoria && (
                <button type="button" onClick={exportarLog}>
                  <Icon nombre="file" size={16} /> Exportar log
                </button>
              )}
            </div>
          </article>
        </aside>
      </div>

      {editando && (
        <EditModal
          doc={doc}
          usuario={usuario}
          onClose={() => setEditando(false)}
          onGuardado={() => { onCambios(); void cargarLogs(); }}
        />
      )}
    </section>
  );
}
