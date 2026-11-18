import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import styles from './UploadModal.module.css';
import { calcularSha256 } from '../../services/cryptoService';
import { subirDocumento } from '../../services/documentService';
import type { TipoDocumento, UsuarioSesion } from '../../types/document.types';

interface Props {
  onClose: () => void;
  onSubido: () => void;
  usuario: UsuarioSesion;
}

const EXTENSIONES = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'tiff'];
const MAX_BYTES = 15 * 1024 * 1024;
const DEPENDENCIAS = [
  'ARCHIVO GENERAL',
  'MESA DE ENTRADAS',
  'DIRECCIÓN DE SEGURIDAD PÚBLICA',
  'DIRECCIÓN DE PERSONAL',
  'ASESORÍA LETRADA',
];

export function UploadModal({ onClose, onSubido, usuario }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [tipo, setTipo] = useState<TipoDocumento>('EXPEDIENTE');
  const [numero, setNumero] = useState('');
  const [fecha, setFecha] = useState('');
  const [dependencia, setDependencia] = useState(DEPENDENCIAS[0]);
  const [error, setError] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setError('');
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!EXTENSIONES.includes(ext)) {
      setError('Formato no permitido. Use PDF, JPG, PNG, WEBP o TIFF.');
      e.target.value = '';
      return;
    }
    if (f.size > MAX_BYTES) {
      setError('El archivo supera el tamaño máximo de 15 MB.');
      e.target.value = '';
      return;
    }
    setArchivo(f);
    setHash(await calcularSha256(f));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!archivo || !hash) {
      setError('Seleccione un archivo antes de guardar.');
      return;
    }
    if (!numero.trim() || !fecha) {
      setError('Complete el número oficial y la fecha del documento.');
      return;
    }
    setSubiendo(true);
    setError('');
    try {
      await subirDocumento(
        archivo,
        { tipo, numero: numero.trim(), fecha, dependencia, hashSha256: hash },
        usuario,
      );
      onSubido();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el documento.');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <form className={styles.modal} onSubmit={onSubmit}>
        <h2>Digitalizar / Subir Documento</h2>
        <div className={styles.banner}>Recomendado: PDF/A para expedientes; WebP/JPEG optimizado para notas.</div>
        <div className={styles.dropzone}>
          <button type="button" className={styles.selectBtn} onClick={() => inputRef.current?.click()}>
            Seleccionar archivo o usar cámara
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.tiff"
            capture="environment"
            onChange={onFile}
            className={styles.fileInput}
          />
          {archivo && (
            <p className={styles.selectedFile}>
              {archivo.name} · {(archivo.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>
        {hash && <p className={styles.hash}>SHA-256: {hash}</p>}
        <div className={styles.typeCards}>
          <label className={styles.typeCard}>
            <input
              type="radio"
              name="tipo"
              value="EXPEDIENTE"
              checked={tipo === 'EXPEDIENTE'}
              onChange={() => setTipo('EXPEDIENTE')}
            />{' '}
            Expediente
          </label>
          <label className={styles.typeCard}>
            <input
              type="radio"
              name="tipo"
              value="NOTA"
              checked={tipo === 'NOTA'}
              onChange={() => setTipo('NOTA')}
            />{' '}
            Nota
          </label>
        </div>
        <input
          placeholder="Número Oficial"
          aria-label="Número Oficial"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
        />
        <input
          type="date"
          aria-label="Fecha del Documento"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
        <select aria-label="Dependencia" value={dependencia} onChange={(e) => setDependencia(e.target.value)}>
          {DEPENDENCIAS.map((d) => <option key={d}>{d}</option>)}
        </select>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <p className={styles.legal}>Ley Provincial N.º 14.256 y Ley N.º 25.326.</p>
        <button type="submit" className={styles.saveBtn} disabled={subiendo}>
          {subiendo ? 'Guardando…' : 'Guardar Documento'}
        </button>
        <button type="button" onClick={onClose}>Cerrar</button>
      </form>
    </div>
  );
}
