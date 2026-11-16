import styles from './DocumentFilters.module.css';
export function DocumentFilters() {
  return (
    <div className={styles.card}>
      <input className={styles.search} placeholder="Buscar por N° de Expediente/Nota" />
      <select><option>Tipo</option><option>EXPEDIENTE</option><option>NOTA</option></select>
      <select><option>Dependencia</option></select>
      <input type="date" placeholder="Desde" />
      <input type="date" placeholder="Hasta" />
    </div>
  );
}