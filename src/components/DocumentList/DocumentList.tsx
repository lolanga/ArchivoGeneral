import styles from './DocumentList.module.css';
import { Icon } from '../Icon/Icon';
import { formatearFecha, formatoArchivo } from '../../utils/format';
import type { Documento } from '../../types/document.types';

interface Props {
  docs: Documento[];
  puedeRevisar: boolean;
  puedeSubir: boolean;
  onRevisar: (doc: Documento) => void;
  onSubir: () => void;
  onDenegado: (mensaje: string) => void;
}

export function DocumentList({ docs, puedeRevisar, puedeSubir, onRevisar, onSubir, onDenegado }: Props) {
  if (docs.length === 0) {
    return (
      <section className={styles.empty}>
        <Icon nombre="description" size={36} />
        <p>No se encontraron documentos con los filtros seleccionados.</p>
      </section>
    );
  }

  const revisar = (doc: Documento) => {
    if (puedeRevisar) {
      onRevisar(doc);
    } else {
      onDenegado('Su perfil no tiene permiso para revisar documentos (línea 2).');
    }
  };

  return (
    <section className={styles.wrap} aria-label="Listado de documentos digitalizados">
      {puedeSubir && (
        <button type="button" className={styles.mobileScan} onClick={onSubir}>
          <Icon nombre="camera" size={28} />
          <span>Escanear con Cámara / Subir Archivo</span>
        </button>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>N° Identificación</th>
              <th>Dependencia</th>
              <th>Fecha del Documento</th>
              <th>Formato</th>
              <th className={styles.accion}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <span className={doc.tipo_documento === 'EXPEDIENTE' ? styles.badgeBlue : styles.badgeGray}>
                    {doc.tipo_documento === 'EXPEDIENTE' ? 'Expediente' : 'Nota'}
                  </span>
                </td>
                <td className={styles.numero}>{doc.numero_documento}</td>
                <td>{doc.dependencia}</td>
                <td className={styles.fecha}>{formatearFecha(doc.fecha_documento)}</td>
                <td className={styles.fecha}>{formatoArchivo(doc.mime_type, doc.nombre_archivo_original)}</td>
                <td className={styles.accion}>
                  <button
                    type="button"
                    className={`${styles.revisarBtn} ${!puedeRevisar ? styles.bloqueado : ''}`}
                    onClick={() => revisar(doc)}
                    title={puedeRevisar ? 'Abrir línea 2: revisión del documento' : 'Acceso no permitido para este perfil'}
                  >
                    <Icon nombre={puedeRevisar ? 'find' : 'lock'} size={18} />
                    <span>Revisar Archivo</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.cards}>
        {docs.map((doc) => (
          <article key={doc.id} className={styles.card}>
            <div className={styles.cardInfo}>
              <strong>{doc.numero_documento}</strong>
              <span>{formatearFecha(doc.fecha_documento)} · {doc.tipo_documento === 'EXPEDIENTE' ? 'Expediente' : 'Nota'}</span>
            </div>
            <button
              type="button"
              className={`${styles.revisarBtn} ${!puedeRevisar ? styles.bloqueado : ''}`}
              onClick={() => revisar(doc)}
            >
              <Icon nombre={puedeRevisar ? 'eye' : 'lock'} size={18} />
              <span>{puedeRevisar ? 'Revisar' : 'Sin acceso'}</span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
