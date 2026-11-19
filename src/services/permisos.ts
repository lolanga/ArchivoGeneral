import type { PermisosToken, PermisosUsuario, UsuarioSesion } from '../types/document.types';

/**
 * Convierte los permisos del token (o del perfil de prueba) a la forma concreta
 * que consume la app. Los campos ausentes se infieren de los esquemas anteriores
 * (`read`/`write`/`admin`) para no romper tokens ya emitidos.
 */
export function normalizarPermisos(
  permisos: PermisosToken | null | undefined,
  adminPorEntorno = false,
): PermisosUsuario {
  const admin = Boolean(permisos?.admin ?? adminPorEntorno);
  const read = Boolean(permisos?.read ?? true);
  const write = Boolean(permisos?.write ?? permisos?.subir ?? read);

  return {
    read,
    write,
    admin,
    subir: Boolean(permisos?.subir ?? write),
    revisar: Boolean(permisos?.revisar ?? read),
    descargar: Boolean(permisos?.descargar ?? admin ?? write),
    auditoria: Boolean(permisos?.auditoria ?? admin),
  };
}

export interface PerfilMock {
  id: string;
  etiqueta: string;
  descripcion: string;
  permisos: PermisosToken;
}

/** Perfiles de prueba que simulan los permisos a asignar en producción. */
export const PERFILES_MOCK: PerfilMock[] = [
  {
    id: 'completo',
    etiqueta: 'Agente Completo (Subir + Revisar)',
    descripcion: 'Acceso a las dos líneas de trabajo y descarga de originales.',
    permisos: { read: true, write: true, admin: false, subir: true, revisar: true, descargar: true, auditoria: false },
  },
  {
    id: 'solo-subir',
    etiqueta: 'Operador (Solo Subir/Digitalizar)',
    descripcion: 'Solo línea 1: carga documentos y gestiona metadatos.',
    permisos: { read: true, write: true, admin: false, subir: true, revisar: false, descargar: false, auditoria: false },
  },
  {
    id: 'solo-revisar',
    etiqueta: 'Revisor (Solo Consulta)',
    descripcion: 'Solo línea 2 en modo consulta: ve documentos, sin descargar.',
    permisos: { read: true, write: false, admin: false, subir: false, revisar: true, descargar: false, auditoria: false },
  },
  {
    id: 'oficial',
    etiqueta: 'Oficial (Revisar + Descargar)',
    descripcion: 'Línea 2 con descarga autorizada de copias oficiales.',
    permisos: { read: true, write: false, admin: false, subir: false, revisar: true, descargar: true, auditoria: false },
  },
  {
    id: 'auditor',
    etiqueta: 'Auditor de Seguridad',
    descripcion: 'Historial completo, auditoría global y descarga de auditoría.',
    permisos: { read: true, write: false, admin: true, subir: false, revisar: true, descargar: true, auditoria: true },
  },
];

export const PERFIL_DENEGADO: PerfilMock = {
  id: 'denegado',
  etiqueta: 'Sin acceso',
  descripcion: 'Token inválido o sin permiso de lectura.',
  permisos: { read: false, write: false, admin: false, subir: false, revisar: false, descargar: false, auditoria: false },
};

export function perfilPorId(id: string | null | undefined): PerfilMock {
  return PERFILES_MOCK.find((perfil) => perfil.id === id) ?? (id === PERFIL_DENEGADO.id ? PERFIL_DENEGADO : PERFILES_MOCK[0]);
}

export function puedeSubir(usuario: UsuarioSesion): boolean {
  return usuario.permisos.subir;
}

export function puedeRevisar(usuario: UsuarioSesion): boolean {
  return usuario.permisos.revisar;
}

export function puedeDescargar(usuario: UsuarioSesion): boolean {
  return usuario.permisos.descargar;
}

export function puedeVerAuditoria(usuario: UsuarioSesion): boolean {
  return usuario.permisos.auditoria || usuario.permisos.admin;
}
