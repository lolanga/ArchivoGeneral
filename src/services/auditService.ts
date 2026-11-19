import type { EventoCliente } from '../types/audit.types';
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
  CONSULTA_AUDITORIA_DOCUMENTO: 'Historial del documento',
  IMPRESION_CONSTANCIA: 'Impresión de constancia',
  EXPORTACION_AUDITORIA: 'Exportación de auditoría',
  CAMBIO_PERFIL: 'Cambio de perfil',
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

/** Historial acotado a un documento; disponible para quien puede revisarlo. */
export async function listarAuditoriaDocumento(
  documentoId: string,
  sesion: UsuarioSesion,
): Promise<RegistroAuditoria[]> {
  const res = await fetch(`${API}/documentos/${encodeURIComponent(documentoId)}/auditoria`, {
    headers: cabeceras(sesion),
  });
  await verificar(res, 'consultar el historial del documento');
  return res.json();
}

/** Registra acciones de la UI que no pasan por una llamada de datos (impresión, etc.). */
export async function registrarEvento(
  evento: EventoCliente,
  detalles: string,
  sesion: UsuarioSesion,
  documentoId?: string,
): Promise<void> {
  const res = await fetch(`${API}/eventos`, {
    method: 'POST',
    headers: cabeceras(sesion, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ evento, detalles, documento_id: documentoId }),
  });
  await verificar(res, 'registrar la acción en la auditoría');
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
