import type { UsuarioSesion } from '../types/document.types';

export const API = '/api';

/**
 * Todas las peticiones llevan la identidad y los permisos del usuario.
 * La auditoría se genera en el servidor con estos datos; en producción deben
 * sustituirse por la verificación del JWT institucional.
 */
export function cabeceras(sesion: UsuarioSesion, extra: Record<string, string> = {}): HeadersInit {
  return {
    Authorization: `Bearer ${sesion.token}`,
    'X-Usuario-Id': encodeURIComponent(sesion.user_id),
    'X-Nombre-Completo': encodeURIComponent(sesion.nombre_completo),
    'X-Usuario-Dependencia': encodeURIComponent(sesion.dependencia_id),
    'X-Es-Admin': sesion.permisos.admin ? 'true' : 'false',
    'X-Puede-Subir': sesion.permisos.subir ? 'true' : 'false',
    'X-Puede-Revisar': sesion.permisos.revisar ? 'true' : 'false',
    'X-Puede-Descargar': sesion.permisos.descargar ? 'true' : 'false',
    'X-Puede-Auditoria': sesion.permisos.auditoria ? 'true' : 'false',
    ...extra,
  };
}

export async function verificar(res: Response, accion: string): Promise<void> {
  if (res.ok) return;
  const cuerpo = await res.json().catch(() => ({}));
  throw new Error(cuerpo.error ?? `No se pudo ${accion} (HTTP ${res.status})`);
}
