import styles from './Header.module.css';
import { Icon } from '../Icon/Icon';
import { PERFILES_MOCK } from '../../services/permisos';
import { esModoMock } from '../../services/authService';
import type { UsuarioSesion } from '../../types/document.types';

export type Vista = 'dashboard' | 'revision';

interface Props {
  usuario: UsuarioSesion;
  vista: Vista;
  perfilMock: string;
  onIrDashboard: () => void;
  onIrRevision: () => void;
  onUpload: () => void;
  onAudit: () => void;
  onCambiarPerfil: (id: string) => void;
}

export function Header({
  usuario,
  vista,
  perfilMock,
  onIrDashboard,
  onIrRevision,
  onUpload,
  onAudit,
  onCambiarPerfil,
}: Props) {
  const puedeRevisar = usuario.permisos.revisar;
  const puedeSubir = usuario.permisos.subir;

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}><Icon nombre="folder" size={24} /></span>
          <span className={styles.brandText}>
            <span className={styles.brandTitle}>ISeP - Archivo Digital</span>
            <span className={styles.brandSub}>Instituto de Seguridad Pública de Santa Fe</span>
          </span>
        </div>

        <nav className={styles.nav} aria-label="Líneas de trabajo principales">
          <button
            type="button"
            className={`${styles.navItem} ${vista === 'dashboard' ? styles.navActive : ''}`}
            onClick={onIrDashboard}
          >
            <Icon nombre="upload" size={18} />
            <span>1. Subir o Digitalizar</span>
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${vista === 'revision' ? styles.navActive : ''} ${!puedeRevisar ? styles.navBlocked : ''}`}
            onClick={onIrRevision}
            aria-disabled={!puedeRevisar}
            title={puedeRevisar ? 'Línea 2: Revisar Documento' : 'Acceso no permitido para este perfil'}
          >
            <Icon nombre={puedeRevisar ? 'find' : 'lock'} size={18} />
            <span>2. Revisar Documento</span>
          </button>
        </nav>

        <div className={styles.actions}>
          <div className={styles.pill}>
            <Icon nombre="manage" size={18} />
            <span className={styles.pillText}>
              <span className={styles.pillLabel}>{esModoMock() ? 'Perfil asignado:' : 'Usuario:'}</span>
              {esModoMock() ? (
                <select
                  className={styles.roleSelect}
                  aria-label="Perfil de acceso (prueba)"
                  value={perfilMock}
                  onChange={(e) => onCambiarPerfil(e.target.value)}
                >
                  {PERFILES_MOCK.map((perfil) => (
                    <option key={perfil.id} value={perfil.id}>{perfil.etiqueta}</option>
                  ))}
                </select>
              ) : (
                <span className={styles.pillValue}>{usuario.nombre_completo}</span>
              )}
              <span className={styles.pillDep}>{usuario.dependencia_id}</span>
            </span>
          </div>

          {usuario.permisos.admin && (
            <button type="button" className={styles.auditBtn} onClick={onAudit}>
              <Icon nombre="security" size={18} />
              Auditoría
            </button>
          )}

          <button
            type="button"
            className={`${styles.uploadBtn} ${!puedeSubir ? styles.actionBlocked : ''}`}
            onClick={onUpload}
            aria-disabled={!puedeSubir}
            title={puedeSubir ? 'Línea 1: digitalizar un documento' : 'Acceso no permitido para este perfil'}
          >
            <Icon nombre={puedeSubir ? 'upload' : 'lock'} size={20} />
            <span>+ Digitalizar / Subir Documento</span>
          </button>
        </div>
      </div>
    </header>
  );
}
