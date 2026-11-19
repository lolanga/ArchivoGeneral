export type EventoAuditoria =
  | 'ALTA_DOCUMENTO'
  | 'MODIFICACION_DOCUMENTO'
  | 'ELIMINACION_DOCUMENTO'
  | 'CONSULTA_LISTADO'
  | 'CONSULTA_DOCUMENTO'
  | 'DESCARGA_DOCUMENTO'
  | 'CONSULTA_AUDITORIA'
  | 'CONSULTA_AUDITORIA_DOCUMENTO'
  | 'IMPRESION_CONSTANCIA'
  | 'EXPORTACION_AUDITORIA'
  | 'CAMBIO_PERFIL'
  | 'ACCESO_DENEGADO'
  | (string & {});

/** Eventos que el frontend puede notificar explícitamente a la API. */
export type EventoCliente =
  | 'ACCESO_DENEGADO'
  | 'IMPRESION_CONSTANCIA'
  | 'EXPORTACION_AUDITORIA'
  | 'CAMBIO_PERFIL';

export interface RegistroAuditoria {
  id?: string;
  evento: EventoAuditoria;
  fecha?: string;
  hora?: string;
  fecha_hora: string;
  usuario_id: string;
  nombre_usuario?: string;
  dependencia?: string;
  origen_ip?: string;
  documento_id?: string;
  numero_documento?: string;
  detalles?: unknown;
}

export interface FiltrosAuditoria {
  evento?: string;
  usuario?: string;
  documento?: string;
  desde?: string;
  hasta?: string;
}
