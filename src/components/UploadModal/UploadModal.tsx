import { useState } from 'react';
import styles from './UploadModal.module.css';
import { calcularSha256 } from '../../services/cryptoService';

interface Props { onClose: () => void; }
export function UploadModal({ onClose }: Props) {
  const [hash, setHash] = useState('');
  const [tipo, setTipo] = useState('EXPEDIENTE');
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setHash(await calcularSha256(f));
  };
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Digitalizar / Subir Documento</h2>
        <div className={styles.banner}>Recomendado: PDF/A para expedientes; WebP/JPEG optimizado para notas.</div>
        <div className={styles.dropzone}>
          <button className={styles.selectBtn}>Seleccionar archivo o usar cámara</button>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.tiff" capture="environment" onChange={onFile} className={styles.fileInput} />
        </div>
        {hash && <p>SHA-256: {hash}</p>}
        <div className={styles.typeCards}>
          <label className={styles.typeCard}><input type="radio" name="tipo" value="EXPEDIENTE" checked={tipo==='EXPEDIENTE'} onChange={()=>setTipo('EXPEDIENTE')} /> Expediente</label>
          <label className={styles.typeCard}><input type="radio" name="tipo" value="NOTA" checked={tipo==='NOTA'} onChange={()=>setTipo('NOTA')} /> Nota</label>
        </div>
        <input placeholder="Número Oficial" />
        <input type="date" placeholder="Fecha del Documento" />
        <select><option>Dependencia</option></select>
        <p className={styles.legal}>Ley Provincial N.º 14.256 y Ley N.º 25.326.</p>
        <button className={styles.saveBtn}>Guardar Documento</button>
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}