import type { PermisosToken, UsuarioSesion } from '../types/document.types';
import { normalizarPermisos, perfilPorId } from './permisos';

/** Auth simulada para desarrollo. En producción se usa el token institucional. */
export const MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
const CLAVE_PERFIL = 'isep_mock_perfil';

type Payload = PermisosToken & {
  user_id?: string;
  nombre_completo?: string;
  dependencia_id?: string;
  permisos?: PermisosToken;
  exp?: number;
};

function parseJwt(token: string): Payload | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as Payload;
  } catch {
    return null;
  }
}

function perfilInicial(): string {
  const guardado = localStorage.getItem(CLAVE_PERFIL);
  if (guardado) return guardado;
  if (import.meta.env.VITE_MOCK_DENY === 'true') return 'denegado';
  if (import.meta.env.VITE_MOCK_ADMIN === 'true') return 'auditor';
  return 'completo';
}

function sesionMock(id: string): UsuarioSesion {
  const perfil = perfilPorId(id);
  const nombres: Record<string, string> = {
    completo: 'Agente de Mesa de Entradas',
    'solo-subir': 'Operador Digitalizador',
    'solo-revisar': 'Agente (Solo Consulta)',
    oficial: 'Oficial Mesa de Entradas',
    auditor: 'Auditor de Seguridad',
    denegado: 'Usuario sin acceso',
  };

  return {
    user_id: `mock-${perfil.id}`,
    nombre_completo: nombres[perfil.id] ?? perfil.etiqueta,
    dependencia_id: 'MESA DE ENTRADAS',
    permisos: normalizarPermisos(perfil.permisos),
    token: 'mock-token',
  };
}

export async function obtenerSesion(): Promise<UsuarioSesion | null> {
  if (MOCK_AUTH) return sesionMock(perfilInicial());

  const token = localStorage.getItem('isep_token') || new URLSearchParams(window.location.search).get('token');
  if (!token) return null;
  const payload = parseJwt(token);
  if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) return null;

  return {
    user_id: payload.user_id ?? '',
    nombre_completo: payload.nombre_completo ?? 'Usuario',
    dependencia_id: payload.dependencia_id ?? '',
    permisos: normalizarPermisos({
      read: payload.read ?? payload.permisos?.read,
      write: payload.write ?? payload.permisos?.write,
      admin: payload.admin ?? payload.permisos?.admin,
      subir: payload.subir ?? payload.permisos?.subir,
      revisar: payload.revisar ?? payload.permisos?.revisar,
      descargar: payload.descargar ?? payload.permisos?.descargar,
      auditoria: payload.auditoria ?? payload.permisos?.auditoria,
    }),
    token,
  };
}

export function esModoMock(): boolean {
  return MOCK_AUTH;
}

export function perfilMockActual(): string {
  return perfilInicial();
}

/** Cambia el perfil de prueba y devuelve la nueva sesión. */
export function cambiarPerfilMock(id: string): UsuarioSesion {
  localStorage.setItem(CLAVE_PERFIL, id);
  return sesionMock(id);
}
