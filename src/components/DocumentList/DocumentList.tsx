import styles from './DocumentList.module.css';
import type { Documento } from '../../types/document.types';

interface Props {
  docs: Documento[];
  onConsult: (d: Documento) => void;
  onDownload: (d: Documento) => void;
  onUpload: () => void;
  onEdit: (d: Documento) => void;
  onDelete: (d: Documento) => void;
  puedeEditar: boolean;
}

export function DocumentList({ docs, onConsult, onDownload, onUpload, onEdit, onDelete, puedeEditar }: Props) {
  if (docs.length === 0) return <p className={styles.empty}>Sin documentos.</p>;
  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.mobileScan} onClick={onUpload}>
        📷 Escanear con Cámara / Subir Archivo
      </button>
      <div className={styles.mobileSearch}><input placeholder="Búsqueda rápida" /></div>
      <table className={styles.table}>
        <thead><tr><th>N°</th><th>Tipo</th><th>Fecha</th><th>Acciones</th></tr></thead>
        <tbody>
          {docs.map(d => (
            <tr key={d.id}>
              <td>{d.numero_documento}</td>
              <td><span className={d.tipo_documento === 'EXPEDIENTE' ? styles.badgeBlue : styles.badgeGray}>{d.tipo_documento}</span></td>
              <td>{d.fecha_documento}</td>
              <td className={styles.actions}>
                <button type="button" className={styles.consultBtn} onClick={() => onConsult(d)}>Consultar Archivo</button>
                <button type="button" className={styles.downloadBtn} onClick={() => onDownload(d)}>Descargar</button>
                {puedeEditar && (
                  <>
                    <button type="button" className={styles.editBtn} onClick={() => onEdit(d)}>Editar</button>
                    <button type="button" className={styles.deleteBtn} onClick={() => onDelete(d)}>Eliminar</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.cards}>
        {docs.map(d => (
          <div key={d.id} className={styles.card}>
            <div>
              <strong>{d.numero_documento}</strong>
              <div className={styles.cardMeta}>{d.fecha_documento} · {d.tipo_documento}</div>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.viewBtn} onClick={() => onConsult(d)}>Ver</button>
              <button type="button" className={styles.downloadBtn} onClick={() => onDownload(d)}>↓</button>
              {puedeEditar && (
                <>
                  <button type="button" className={styles.editBtn} onClick={() => onEdit(d)}>✎</button>
                  <button type="button" className={styles.deleteBtn} onClick={() => onDelete(d)}>✕</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
