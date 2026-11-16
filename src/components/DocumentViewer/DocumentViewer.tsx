import styles from './DocumentViewer.module.css';
import type { Documento } from '../../types/document.types';
interface Props { doc: Documento; onClose: () => void; }
export function DocumentViewer({ doc, onClose }: Props) {
  console.log('AUDITORIA LECTURA', { usuario_id: 'mock', documento_id: doc.id, fecha_hora: new Date().toISOString() });
  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <h3>{doc.numero_documento}</h3>
        <p>Visor (sin descarga por defecto). URL firmada temporal.</p>
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}