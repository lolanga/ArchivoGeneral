import type { UsuarioSesion } from '../types/document.types';
import type { FiltrosAuditoria, RegistroAuditoria } from '../types/audit.types';
import { API, cabeceras, verificar } from './api';

export const ETIQUETAS_EVENTO: Record<string, string> = {
  ALTA_DOCUMENTO: 'Alta de documento',
  MODIFICACION_DOCUMENTO: 'Modificación de metadatos',
  ELIMINACION_DOCUMENTO: 'Eliminación de documento',
  CONSULTA_LISTADO: 'Consulta de listado',
  CONSULTA_DOCUMENTO: 'Vista de documento',
  DESCARGA_DOCUMENTO: 'Descarga de original',
  CONSULTA_AUDITORIA: 'Consulta de auditoría',
  ACCESO_DENEGADO: 'Acceso denegado',
  lectura: 'Vista de documento (legado)',
  descarga: 'Descarga de original (legado)',
};

export async function listarAuditoria(
  filtros: FiltrosAuditoria,
  sesion: UsuarioSesion,
): Promise<RegistroAuditoria[]> {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor) params.set(clave, valor);
  });
  params.set('limite', '500');
  const res = await fetch(`${API}/auditoria?${params.toString()}`, { headers: cabeceras(sesion) });
  await verificar(res, 'consultar la auditoría');
  return res.json();
}

export function detalleComoTexto(detalles: unknown): string {
  if (detalles === null || detalles === undefined) return '';
  if (typeof detalles === 'string') return detalles;
  if (typeof detalles === 'object') {
    const cambio = detalles as Record<string, { antes?: unknown; despues?: unknown } | boolean>;
    return Object.entries(cambio)
      .map(([campo, valor]) => {
        if (typeof valor === 'boolean') return `${campo}: ${valor ? 'sí' : 'no'}`;
        return `${campo}: ${String(valor?.antes ?? '')} → ${String(valor?.despues ?? '')}`;
      })
      .join(' · ');
  }
  return String(detalles);
}
