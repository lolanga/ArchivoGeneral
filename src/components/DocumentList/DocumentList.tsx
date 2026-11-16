import styles from './DocumentList.module.css';
import type { Documento } from '../../types/document.types';

interface Props { docs: Documento[]; onConsult: (d: Documento) => void; }
export function DocumentList({ docs, onConsult }: Props) {
  if (docs.length === 0) return <p className={styles.empty}>Sin documentos.</p>;
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead><tr><th>N°</th><th>Tipo</th><th>Fecha</th><th></th></tr></thead>
        <tbody>
          {docs.map(d => (
            <tr key={d.id}>
              <td>{d.numero_documento}</td><td>{d.tipo_documento}</td><td>{d.fecha_documento}</td>
              <td><button onClick={() => onConsult(d)}>Consultar Archivo</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.cards}>
        {docs.map(d => (
          <div key={d.id} className={styles.card}>
            <strong>{d.numero_documento}</strong> - {d.tipo_documento}
            <button onClick={() => onConsult(d)}>Consultar Archivo</button>
          </div>
        ))}
      </div>
    </div>
  );
}