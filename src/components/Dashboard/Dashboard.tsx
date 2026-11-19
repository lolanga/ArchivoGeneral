import { useMemo, useState } from 'react';
import styles from './Dashboard.module.css';
import { DocumentFilters } from '../DocumentFilters/DocumentFilters';
import { DocumentList } from '../DocumentList/DocumentList';
import type { Documento } from '../../types/document.types';
import type { FiltrosDocumento } from '../../types/filtros.types';
import { FILTROS_VACIOS } from '../../types/filtros.types';

interface Props {
  docs: Documento[];
  cargando: boolean;
  error: string;
  puedeRevisar: boolean;
  puedeSubir: boolean;
  onRevisar: (doc: Documento) => void;
  onSubir: () => void;
  onDenegado: (mensaje: string) => void;
}

export function Dashboard({
  docs,
  cargando,
  error,
  puedeRevisar,
  puedeSubir,
  onRevisar,
  onSubir,
  onDenegado,
}: Props) {
  const [filtros, setFiltros] = useState<FiltrosDocumento>(FILTROS_VACIOS);

  const dependencias = useMemo(
    () => [...new Set(docs.map((doc) => doc.dependencia))].sort((a, b) => a.localeCompare(b, 'es')),
    [docs],
  );

  const visibles = useMemo(() => docs.filter((doc) => {
    const busqueda = filtros.busqueda.trim().toLowerCase();
    return (!busqueda || doc.numero_documento.toLowerCase().includes(busqueda))
      && (filtros.tipo === 'Todos' || doc.tipo_documento === filtros.tipo)
      && (filtros.dependencia === 'Todas' || doc.dependencia === filtros.dependencia)
      && (!filtros.fecha || doc.fecha_documento === filtros.fecha);
  }), [docs, filtros]);

  return (
    <section className={styles.page}>
      <div className={styles.intro}>
        <div>
          <span className={styles.eyebrow}>Línea 1 · Subir o Digitalizar</span>
          <h1>Dashboard de Despacho</h1>
          <p>Consulte expedientes y notas digitalizadas o incorpore nueva documentación al archivo oficial.</p>
        </div>
        <span className={styles.contador}>{visibles.length} {visibles.length === 1 ? 'documento' : 'documentos'}</span>
      </div>

      <DocumentFilters filtros={filtros} dependencias={dependencias} onChange={setFiltros} />

      {error && <p className={styles.error} role="alert">{error}</p>}

      {cargando ? (
        <p className={styles.cargando}>Cargando documentos…</p>
      ) : (
        <DocumentList
          docs={visibles}
          puedeRevisar={puedeRevisar}
          puedeSubir={puedeSubir}
          onRevisar={onRevisar}
          onSubir={onSubir}
          onDenegado={onDenegado}
        />
      )}
    </section>
  );
}
