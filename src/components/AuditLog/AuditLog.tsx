import { useCallback, useEffect, useState, type FormEvent } from 'react';
import styles from './AuditLog.module.css';
import { detalleComoTexto, ETIQUETAS_EVENTO, listarAuditoria } from '../../services/auditService';
import type { FiltrosAuditoria, RegistroAuditoria } from '../../types/audit.types';
import type { UsuarioSesion } from '../../types/document.types';

interface Props {
  usuario: UsuarioSesion;
  onClose: () => void;
}

function exportarCsv(registros: RegistroAuditoria[]): void {
  const columnas = ['fecha', 'hora', 'usuario_id', 'nombre_usuario', 'evento', 'numero_documento', 'detalles'];
  const escapar = (valor: unknown) => `"${String(valor ?? '').replace(/"/g, '""')}"`;
  const filas = [
    columnas.join(','),
    ...registros.map((r) => columnas.map((c) => escapar(c === 'evento' ? ETIQUETAS_EVENTO[r.evento] ?? r.evento : r[c as keyof RegistroAuditoria])).join(',')),
  ];
  const url = URL.createObjectURL(new Blob([`\uFEFF${filas.join('\r\n')}`], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);
}

export function AuditLog({ usuario, onClose }: Props) {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [filtros, setFiltros] = useState<FiltrosAuditoria>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async (f: FiltrosAuditoria) => {
    setCargando(true);
    setError('');
    try {
      setRegistros(await listarAuditoria(f, usuario));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la auditoría.');
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  useEffect(() => {
    let activo = true;
    listarAuditoria({}, usuario)
      .then((datos) => { if (activo) setRegistros(datos); })
      .catch((err: unknown) => {
        if (activo) setError(err instanceof Error ? err.message : 'No se pudo cargar la auditoría.');
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [usuario]);

  const aplicarFiltros = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void cargar(filtros);
  };

  return (
    <div className={`${styles.overlay} modal-overlay`} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className={styles.panel} aria-label="Registro de auditoría">
        <div className={styles.header}>
          <div>
            <h2>Registro de auditoría</h2>
            <p className={styles.subtitle}>Acceso restringido a administradores. Registro inmutable de todas las acciones.</p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" onClick={() => void cargar(filtros)}>Actualizar</button>
            <button type="button" className={styles.csvBtn} onClick={() => exportarCsv(registros)} disabled={!registros.length}>
              Exportar CSV
            </button>
            <button type="button" onClick={onClose}>Cerrar</button>
          </div>
        </div>

        <form className={styles.filters} onSubmit={aplicarFiltros}>
          <select
            aria-label="Filtrar por acción"
            value={filtros.evento ?? ''}
            onChange={(e) => setFiltros({ ...filtros, evento: e.target.value })}
          >
            <option value="">Todas las acciones</option>
            {Object.entries(ETIQUETAS_EVENTO).map(([clave, etiqueta]) => (
              <option key={clave} value={clave}>{etiqueta}</option>
            ))}
          </select>
          <input
            placeholder="Usuario"
            aria-label="Filtrar por usuario"
            value={filtros.usuario ?? ''}
            onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value })}
          />
          <input
            type="date"
            aria-label="Desde"
            value={filtros.desde ?? ''}
            onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
          />
          <input
            type="date"
            aria-label="Hasta"
            value={filtros.hasta ?? ''}
            onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
          />
          <button type="submit">Filtrar</button>
        </form>

        {error && <p className={styles.error} role="alert">{error}</p>}
        {cargando ? (
          <p className={styles.loading}>Cargando registros…</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th><th>Hora</th><th>Usuario</th><th>Acción</th><th>Documento</th><th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r, i) => (
                  <tr key={r.id ?? `${r.fecha_hora}-${i}`} className={r.evento === 'ACCESO_DENEGADO' ? styles.denegado : undefined}>
                    <td>{r.fecha ?? r.fecha_hora.slice(0, 10)}</td>
                    <td>{r.hora ?? r.fecha_hora.slice(11, 19)}</td>
                    <td>
                      <strong>{r.nombre_usuario || 'Desconocido'}</strong>
                      <span className={styles.userId}>{r.usuario_id}</span>
                    </td>
                    <td><span className={styles.badge}>{ETIQUETAS_EVENTO[r.evento] ?? r.evento}</span></td>
                    <td>{r.numero_documento ?? r.documento_id ?? '—'}</td>
                    <td className={styles.detalle}>{detalleComoTexto(r.detalles) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!registros.length && <p className={styles.loading}>No hay registros para los filtros seleccionados.</p>}
          </div>
        )}
        <p className={styles.legal}>Los registros se conservan para auditoría e integridad archivística (Ley N.º 25.326 y Ley Provincial N.º 14.256).</p>
      </section>
    </div>
  );
}
