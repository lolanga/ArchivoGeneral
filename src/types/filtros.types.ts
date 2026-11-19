export interface FiltrosDocumento {
  busqueda: string;
  tipo: string;
  dependencia: string;
  fecha: string;
}

export const FILTROS_VACIOS: FiltrosDocumento = {
  busqueda: '',
  tipo: 'Todos',
  dependencia: 'Todas',
  fecha: '',
};
