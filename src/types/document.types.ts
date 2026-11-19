export type TipoDocumento = 'EXPEDIENTE' | 'NOTA';

export interface Documento {
  id: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  fecha_documento: string;
  dependencia: string;
  archivo_url: string;
  nombre_archivo_original: string;
  mime_type: string;
  hash_sha256: string;
  /** Tamaño del original en bytes (lo informa la API al dar de alta). */
  tamano_bytes?: number;
  usuario_carga_id: string;
  timestamp_carga: string;
}

/**
 * Permisos ya resueltos: siempre booleanos para que la UI y la API puedan
 * consultarlos sin comprobaciones adicionales.
 *
 * Línea 1 -> `subir`      (digitalizar / subir y gestionar metadatos)
 * Línea 2 -> `revisar`    (consultar el archivo archivado)
 *            `descargar`  (obtener el original; puede estar denegado)
 * Auditoría -> `auditoria` (historial detallado) y `admin` (log global)
 */
export interface PermisosUsuario {
  read: boolean;
  write: boolean;
  admin: boolean;
  subir: boolean;
  revisar: boolean;
  descargar: boolean;
  auditoria: boolean;
}

/** Forma flexible en que llegan los permisos desde el token institucional. */
export interface PermisosToken {
  read?: boolean;
  write?: boolean;
  admin?: boolean;
  subir?: boolean;
  revisar?: boolean;
  descargar?: boolean;
  auditoria?: boolean;
}

export interface UsuarioSesion {
  user_id: string;
  nombre_completo: string;
  dependencia_id: string;
  permisos: PermisosUsuario;
  token: string;
}
