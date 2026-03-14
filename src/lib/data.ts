export interface Item {
  id: string;
  nombre: string;
  precios: Record<string, number>;
  descripcion: string;
  categoria: string;
  activo: boolean;
}

export interface QuoteItem extends Item {
  cantidad: number;
}

export function getPrice(item: Item, listaId: string = '11111111-1111-1111-1111-111111111111'): number {
  return item.precios?.[listaId] || 0;
}

export const IVA_RATE = 0.22;
