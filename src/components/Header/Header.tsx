import styles from './Header.module.css';
import type { UsuarioSesion } from '../../types/document.types';

interface Props { usuario: UsuarioSesion; onUpload: () => void; onAudit: () => void; }
export function Header({ usuario, onUpload, onAudit }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoTitle}>ISeP - Archivo Digital</span>
        <span className={styles.logoSub}>Instituto de Seguridad Pública de Santa Fe</span>
      </div>
      <div className={styles.right}>
        <div className={styles.pill}>
          <span className={styles.agent}>{usuario.nombre_completo}</span>
          <span className={styles.dep}>{usuario.dependencia_id}</span>
        </div>
        {usuario.permisos.admin && (
          <button type="button" className={styles.auditBtn} onClick={onAudit}>Auditoría</button>
        )}
        <button type="button" className={styles.uploadBtn} onClick={onUpload}>+ Digitalizar / Subir Documento</button>
      </div>
    </header>
  );
}