import { useState, type FormEvent } from 'react';
import styles from './EditModal.module.css';
import { actualizarDocumento } from '../../services/documentService';
import type { Documento, TipoDocumento, UsuarioSesion } from '../../types/document.types';

interface Props {
  doc: Documento;
  usuario: UsuarioSesion;
  onClose: () => void;
  onGuardado: () => void;
}

const DEPENDENCIAS = [
  'ARCHIVO GENERAL',
  'MESA DE ENTRADAS',
  'DIRECCIÓN DE SEGURIDAD PÚBLICA',
  'DIRECCIÓN DE PERSONAL',
  'ASESORÍA LETRADA',
];

export function EditModal({ doc, usuario, onClose, onGuardado }: Props) {
  const [tipo, setTipo] = useState<TipoDocumento>(doc.tipo_documento);
  const [numero, setNumero] = useState(doc.numero_documento);
  const [fecha, setFecha] = useState(doc.fecha_documento);
  const [dependencia, setDependencia] = useState(doc.dependencia);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await actualizarDocumento(doc.id, {
        tipo_documento: tipo,
        numero_documento: numero.trim(),
        fecha_documento: fecha,
        dependencia,
      }, usuario);
      onGuardado();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo modificar el documento.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <form className={styles.modal} onSubmit={onSubmit}>
        <h2>Modificar metadatos</h2>
        <p className={styles.doc}>{doc.nombre_archivo_original}</p>
        <div className={styles.typeCards}>
          <label className={styles.typeCard}>
            <input type="radio" name="tipoEdicion" value="EXPEDIENTE" checked={tipo === 'EXPEDIENTE'} onChange={() => setTipo('EXPEDIENTE')} /> Expediente
          </label>
          <label className={styles.typeCard}>
            <input type="radio" name="tipoEdicion" value="NOTA" checked={tipo === 'NOTA'} onChange={() => setTipo('NOTA')} /> Nota
          </label>
        </div>
        <input aria-label="Número Oficial" value={numero} onChange={(e) => setNumero(e.target.value)} />
        <input type="date" aria-label="Fecha del Documento" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <select aria-label="Dependencia" value={dependencia} onChange={(e) => setDependencia(e.target.value)}>
          {DEPENDENCIAS.map((d) => <option key={d}>{d}</option>)}
        </select>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" className={styles.saveBtn} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button type="button" onClick={onClose}>Cancelar</button>
      </form>
    </div>
  );
}
