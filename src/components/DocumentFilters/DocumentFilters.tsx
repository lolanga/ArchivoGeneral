import styles from './DocumentFilters.module.css';
export function DocumentFilters() {
  return (
    <div className={styles.bar}>
      <input placeholder="Buscar por N° Expediente o N° Nota" />
      <select><option>Dependencia</option></select>
      <select><option>Tipo</option><option>EXPEDIENTE</option><option>NOTA</option></select>
      <input type="date" />
      <input type="date" />
    </div>
  );
}