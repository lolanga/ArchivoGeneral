import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import styles from './UploadModal.module.css';
import { Icon } from '../Icon/Icon';
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
  'Mesa de Entradas',
  'Secretaría Académica',
  'Dirección',
  'Archivo General',
];
const FECHA_HOY = new Date().toISOString().slice(0, 10);

export function UploadModal({ onClose, onSubido, usuario }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [hash, setHash] = useState('');
  const [tipo, setTipo] = useState<TipoDocumento>('EXPEDIENTE');
  const [numero, setNumero] = useState('');
  const [fecha, setFecha] = useState(FECHA_HOY);
  const [dependencia, setDependencia] = useState(DEPENDENCIAS[0]);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  const usarArchivo = async (archivoElegido: File | undefined | null) => {
    setError('');
    if (!archivoElegido) return;
    const extension = archivoElegido.name.split('.').pop()?.toLowerCase() ?? '';
    if (!EXTENSIONES.includes(extension)) {
      setError('Formato no permitido. Use PDF, JPG, PNG, WEBP o TIFF.');
      return;
    }
    if (archivoElegido.size > MAX_BYTES) {
      setError('El archivo supera el tamaño máximo de 15 MB.');
      return;
    }
    setArchivo(archivoElegido);
    setHash(await calcularSha256(archivoElegido));
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    await usarArchivo(e.target.files?.[0]);
  };

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setArrastrando(false);
    await usarArchivo(e.dataTransfer.files?.[0]);
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
    <div className={`${styles.overlay} modal-overlay`} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className={styles.modal} onSubmit={onSubmit} role="dialog" aria-modal="true" aria-labelledby="titulo-carga">
        <header className={styles.header}>
          <h2 id="titulo-carga">Subir Nuevo Documento Digitalizado</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar ventana">
            <Icon nombre="close" size={20} />
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.banner}>
            <Icon nombre="info" size={22} />
            <p><strong>Recomendación archivística:</strong> use PDF/A para expedientes largos o WebP/JPG optimizado para notas simples y ahorrar espacio.</p>
          </div>

          <div
            className={`${styles.dropzone} ${arrastrando ? styles.arrastrando : ''}`}
            onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => void onDrop(e)}
          >
            <Icon nombre="upload" size={36} className={styles.dropIcon} />
            <p>{archivo ? `Archivo seleccionado: ${archivo.name}` : 'Arrastre el archivo aquí o utilice el botón inferior'}</p>
            <button type="button" className={styles.selectBtn} onClick={() => inputRef.current?.click()}>
              <Icon nombre="camera" size={20} />
              Seleccionar archivo o usar cámara
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.tiff"
              capture="environment"
              onChange={(e) => void onFile(e)}
              className={styles.fileInput}
            />
            <span className={styles.formats}>Formatos aceptados: PDF, JPG, PNG, WebP, TIFF · máx. 15 MB</span>
          </div>

          {hash && <p className={styles.hash}>SHA-256 calculado: {hash}</p>}

          <fieldset className={styles.fieldset}>
            <legend>Tipo de documento</legend>
            <div className={styles.typeCards}>
              <label className={`${styles.typeCard} ${tipo === 'EXPEDIENTE' ? styles.typeActiva : ''}`}>
                <input type="radio" name="tipo" value="EXPEDIENTE" checked={tipo === 'EXPEDIENTE'} onChange={() => setTipo('EXPEDIENTE')} />
                Expediente
              </label>
              <label className={`${styles.typeCard} ${tipo === 'NOTA' ? styles.typeActiva : ''}`}>
                <input type="radio" name="tipo" value="NOTA" checked={tipo === 'NOTA'} onChange={() => setTipo('NOTA')} />
                Nota
              </label>
            </div>
          </fieldset>

          <div className={styles.fila}>
            <label className={styles.field}>
              <span>Número Oficial</span>
              <input className={styles.mono} placeholder="Ej. 00201-0012345-6" value={numero} onChange={(e) => setNumero(e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>Fecha del Documento</span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </label>
          </div>

          <label className={styles.field}>
            <span>Dependencia</span>
            <select value={dependencia} onChange={(e) => setDependencia(e.target.value)}>
              {DEPENDENCIAS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <footer className={styles.footer}>
            <p className={styles.legal}>Registro auditado bajo Ley Provincial N.º 14.256 y Ley N.º 25.326.</p>
            <button type="submit" className={styles.saveBtn} disabled={subiendo}>
              <Icon nombre="check" size={20} />
              {subiendo ? 'Guardando…' : 'Guardar Documento'}
            </button>
          </footer>
        </div>
      </form>
    </div>
  );
}
