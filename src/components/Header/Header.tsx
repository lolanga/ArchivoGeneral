import styles from './Header.module.css';
import type { UsuarioSesion } from '../../types/document.types';

interface Props { usuario: UsuarioSesion; onUpload: () => void; }
export function Header({ usuario, onUpload }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>ISeP</div>
      <div className={styles.info}>
        <span className={styles.name}>{usuario.nombre_completo}</span>
        <span className={styles.dep}>{usuario.dependencia_id}</span>
      </div>
      <button className={styles.uploadBtn} onClick={onUpload}>+ Digitalizar / Subir Documento</button>
    </header>
  );
}