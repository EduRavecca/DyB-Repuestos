export interface Servicio {
  id: string;
  nombre: string;
  precios: Record<string, number>;
  descripcion: string;
  categoria: string;
  activo: boolean;
}

export function getPrice(servicio: Servicio, listaId: string = '11111111-1111-1111-1111-111111111111'): number {
  return servicio.precios?.[listaId] || 0;
}

export const IVA_RATE = 0.22;
