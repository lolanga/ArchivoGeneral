import { useEffect, useState } from 'react';
import styles from './DocumentViewer.module.css';
import { obtenerUrlFirmada } from '../../services/documentService';
import type { Documento, UsuarioSesion } from '../../types/document.types';

interface Props {
  doc: Documento;
  usuario: UsuarioSesion;
  onClose: () => void;
  onDownload: (doc: Documento) => void;
}

export function DocumentViewer({ doc, usuario, onClose, onDownload }: Props) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    obtenerUrlFirmada(doc.id, usuario)
      .then((firmada) => { if (activo) setUrl(firmada); })
      .catch((err: unknown) => {
        if (activo) setError(err instanceof Error ? err.message : 'No se pudo abrir el archivo.');
      });
    return () => { activo = false; };
  }, [doc.id, usuario]);

  const esImagen = doc.mime_type.startsWith('image/');
  const esPdf = doc.mime_type === 'application/pdf';

  return (
    <div className={`${styles.overlay} modal-overlay`} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3>{doc.numero_documento}</h3>
          <button type="button" onClick={onClose}>Cerrar</button>
        </div>
        <dl className={styles.meta}>
          <dt>Tipo</dt><dd>{doc.tipo_documento}</dd>
          <dt>Fecha</dt><dd>{doc.fecha_documento}</dd>
          <dt>Dependencia</dt><dd>{doc.dependencia}</dd>
          <dt>Archivo</dt><dd>{doc.nombre_archivo_original}</dd>
          <dt>SHA-256</dt><dd className={styles.hash}>{doc.hash_sha256}</dd>
        </dl>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {!error && !url && <p className={styles.loading}>Solicitando URL firmada…</p>}
        {url && esPdf && (
          <iframe className={styles.preview} src={url} title={`Vista previa de ${doc.nombre_archivo_original}`} />
        )}
        {url && esImagen && (
          <img className={styles.preview} src={url} alt={`Vista previa de ${doc.nombre_archivo_original}`} />
        )}
        {url && !esPdf && !esImagen && (
          <p className={styles.loading}>Sin vista previa para este formato.</p>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.downloadBtn} onClick={() => onDownload(doc)}>
            Descargar original
          </button>
        </div>
        <p className={styles.legal}>La URL firmada expira en 15 minutos. Cada apertura queda registrada.</p>
      </div>
    </div>
  );
}
