export interface Servicio {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  categoria: string;
  activo: boolean;
}

export const IVA_RATE = 0.22;

const CATEGORIAS_DEFAULT = ["Neumáticos", "Mecánica", "Aceites"];

export function loadCategorias(): string[] {
  const saved = localStorage.getItem("cp-categorias");
  if (saved) {
    try { return JSON.parse(saved); } catch { /* fall through */ }
  }
  localStorage.setItem("cp-categorias", JSON.stringify(CATEGORIAS_DEFAULT));
  return CATEGORIAS_DEFAULT;
}

export function saveCategorias(cats: string[]) {
  localStorage.setItem("cp-categorias", JSON.stringify(cats));
}

export const serviciosIniciales: Servicio[] = [
  { id: "1", nombre: "Alineación", precio: 1500, descripcion: "4 ruedas, incluye chequeo", categoria: "Mecánica", activo: true },
  { id: "2", nombre: "Balanceo", precio: 1200, descripcion: "Por eje", categoria: "Mecánica", activo: true },
  { id: "3", nombre: "Cambio de neumático", precio: 800, descripcion: "Por rueda", categoria: "Neumáticos", activo: true },
  { id: "4", nombre: "Neumático 195/65R15 Pirelli", precio: 4500, descripcion: "Pirelli Cinturato P1", categoria: "Neumáticos", activo: true },
  { id: "5", nombre: "Neumático 195/65R15 Michelin", precio: 5200, descripcion: "Michelin Energy XM2", categoria: "Neumáticos", activo: true },
  { id: "6", nombre: "Neumático 175/70R13 Firestone", precio: 3200, descripcion: "Firestone F-600", categoria: "Neumáticos", activo: true },
  { id: "7", nombre: "Neumático 205/55R16 Pirelli", precio: 6100, descripcion: "Pirelli P7", categoria: "Neumáticos", activo: true },
  { id: "8", nombre: "Cambio de aceite sintético", precio: 2000, descripcion: "Sintético 5W30, hasta 4L", categoria: "Aceites", activo: true },
  { id: "9", nombre: "Cambio de aceite semi-sintético", precio: 1500, descripcion: "Semi-sintético 10W40", categoria: "Aceites", activo: true },
  { id: "10", nombre: "Filtro de aceite", precio: 600, descripcion: "Incluye instalación", categoria: "Aceites", activo: true },
  { id: "11", nombre: "Rotación de neumáticos", precio: 600, descripcion: "4 ruedas", categoria: "Neumáticos", activo: true },
  { id: "12", nombre: "Parche de neumático", precio: 400, descripcion: "Reparación de pinchazo", categoria: "Neumáticos", activo: true },
];

export function loadServicios(): Servicio[] {
  const saved = localStorage.getItem("cp-servicios");
  if (saved) {
    try { return JSON.parse(saved); } catch { /* fall through */ }
  }
  localStorage.setItem("cp-servicios", JSON.stringify(serviciosIniciales));
  return serviciosIniciales;
}

export function saveServicios(servicios: Servicio[]) {
  localStorage.setItem("cp-servicios", JSON.stringify(servicios));
}
