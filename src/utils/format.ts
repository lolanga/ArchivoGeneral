/** Devuelve dd/mm/aaaa a partir de un ISO `aaaa-mm-dd` (o ISO completo). */
export function formatearFecha(fecha: string): string {
  const soloFecha = fecha.slice(0, 10);
  const [anio, mes, dia] = soloFecha.split('-');
  if (!anio || !mes || !dia) return fecha;
  return `${dia}/${mes}/${anio}`;
}

export function formatearFechaHora(iso: string): string {
  return `${formatearFecha(iso)} ${iso.slice(11, 16)} hs`;
}

export function formatoArchivo(mime: string, nombre: string): string {
  if (mime === 'application/pdf') return 'PDF';
  const extension = nombre.split('.').pop()?.toUpperCase() ?? '';
  return extension || 'ARCHIVO';
}

export function tamanoLegible(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
