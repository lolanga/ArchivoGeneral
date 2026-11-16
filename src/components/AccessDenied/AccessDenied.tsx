import styles from './AccessDenied.module.css';
export function AccessDenied() {
  return (
    <div className={styles.wrap}>
      <h1>403 - Acceso denegado</h1>
      <p>Su token institucional es inválido, ha expirado o no cuenta con los permisos necesarios.</p>
    </div>
  );
}