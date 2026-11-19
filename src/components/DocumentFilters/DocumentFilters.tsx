import styles from './DocumentFilters.module.css';
import { Icon } from '../Icon/Icon';
import type { FiltrosDocumento } from '../../types/filtros.types';

interface Props {
  filtros: FiltrosDocumento;
  dependencias: string[];
  onChange: (filtros: FiltrosDocumento) => void;
}

export function DocumentFilters({ filtros, dependencias, onChange }: Props) {
  return (
    <section className={styles.card} aria-label="Búsqueda y filtros">
      <div className={styles.grid}>
        <div className={`${styles.field} ${styles.busqueda}`}>
          <label htmlFor="filtro-busqueda">Buscar documento</label>
          <div className={styles.inputWrap}>
            <Icon nombre="search" size={20} className={styles.inputIcon} />
            <input
              id="filtro-busqueda"
              type="text"
              placeholder="Buscar por N° de Expediente o N° de Nota..."
              value={filtros.busqueda}
              onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="filtro-tipo">Tipo</label>
          <select
            id="filtro-tipo"
            value={filtros.tipo}
            onChange={(e) => onChange({ ...filtros, tipo: e.target.value })}
          >
            <option value="Todos">Todos</option>
            <option value="EXPEDIENTE">Expediente</option>
            <option value="NOTA">Nota</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filtro-dependencia">Dependencia</label>
          <select
            id="filtro-dependencia"
            value={filtros.dependencia}
            onChange={(e) => onChange({ ...filtros, dependencia: e.target.value })}
          >
            <option value="Todas">Todas</option>
            {dependencias.map((dependencia) => (
              <option key={dependencia} value={dependencia}>{dependencia}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filtro-fecha">Fecha</label>
          <input
            id="filtro-fecha"
            type="date"
            value={filtros.fecha}
            onChange={(e) => onChange({ ...filtros, fecha: e.target.value })}
          />
        </div>
      </div>
    </section>
  );
}
