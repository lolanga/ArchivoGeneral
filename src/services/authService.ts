import type { UsuarioSesion, PermisosUsuario } from '../types/document.types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

function parseJwt(token: string): any {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export async function obtenerSesion(): Promise<UsuarioSesion | null> {
  if (USE_MOCK) {
    // mock administrativo
    const denied = import.meta.env.VITE_MOCK_DENY === 'true';
    const admin = import.meta.env.VITE_MOCK_ADMIN === 'true';
    const permisos: PermisosUsuario = denied
      ? { read: false, write: false, admin }
      : { read: true, write: true, admin };
    return {
      user_id: 'mock-mesa-001',
      nombre_completo: 'Agente de Mesa de Entradas',
      dependencia_id: 'MESA DE ENTRADAS',
      permisos,
      token: 'mock-token',
    };
  }
  const token = localStorage.getItem('isep_token') || new URLSearchParams(window.location.search).get('token');
  if (!token) return null;
  const payload = parseJwt(token);
  if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) return null;
  return {
    user_id: payload.user_id,
    nombre_completo: payload.nombre_completo,
    dependencia_id: payload.dependencia_id,
    permisos: {
      read: Boolean(payload.permisos?.read),
      write: Boolean(payload.permisos?.write),
      admin: Boolean(payload.permisos?.admin ?? payload.admin),
    },
    token,
  };
}