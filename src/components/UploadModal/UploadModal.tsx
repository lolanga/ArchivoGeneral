import { useState } from 'react';
import styles from './UploadModal.module.css';
import { calcularSha256 } from '../../services/cryptoService';

interface Props { onClose: () => void; }
export function UploadModal({ onClose }: Props) {
  const [hash, setHash] = useState('');
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setHash(await calcularSha256(f));
  };
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Digitalizar / Subir Documento</h2>
        <div className={styles.banner}>Recomendado: PDF/A para expedientes; WebP/JPEG optimizado para notas.</div>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.tiff" capture="environment" onChange={onFile} />
        {hash && <p>SHA-256: {hash}</p>}
        <p className={styles.legal}>Ley Provincial N.º 14.256 y Ley Nacional N.º 25.326.</p>
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}