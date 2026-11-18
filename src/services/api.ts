import type { UsuarioSesion } from '../types/document.types';

export const API = '/api';

/** Todas las peticiones llevan la identidad del usuario para la auditoría. */
export function cabeceras(sesion: UsuarioSesion, extra: Record<string, string> = {}): HeadersInit {
  return {
    Authorization: `Bearer ${sesion.token}`,
    'X-Usuario-Id': encodeURIComponent(sesion.user_id),
    'X-Nombre-Completo': encodeURIComponent(sesion.nombre_completo),
    'X-Usuario-Dependencia': encodeURIComponent(sesion.dependencia_id),
    'X-Es-Admin': sesion.permisos.admin ? 'true' : 'false',
    ...extra,
  };
}

export async function verificar(res: Response, accion: string): Promise<void> {
  if (res.ok) return;
  const cuerpo = await res.json().catch(() => ({}));
  throw new Error(cuerpo.error ?? `No se pudo ${accion} (HTTP ${res.status})`);
}
