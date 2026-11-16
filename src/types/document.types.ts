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
  usuario_carga_id: string;
  timestamp_carga: string;
}

export interface PermisosUsuario {
  read: boolean;
  write: boolean;
}

export interface UsuarioSesion {
  user_id: string;
  nombre_completo: string;
  dependencia_id: string;
  permisos: PermisosUsuario;
  token: string;
}