import { supabase } from "./supabase";
import { Servicio, getPrice } from "./data";

export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const DEFAULT_LISTA_PRECIO_ID = '11111111-1111-1111-1111-111111111111';

// -------- Mapeo de Tipos para compatibilidad con la UI actual --------
export interface CategoriaDB {
  id: string;
  nombre: string;
}

export interface ProductoDB {
  id: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  categoria_id: string;
}

export interface ListaPrecioDB {
  id: string;
  tenant_id: string;
  nombre: string;
  moneda: string;
  es_default: boolean;
}

// -------- LISTAS DE PRECIO --------
export async function getListasPrecio(): Promise<ListaPrecioDB[]> {
  const { data, error } = await supabase
    .from("listas_precio")
    .select("*")
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .order("es_default", { ascending: false });

  if (error) throw error;
  return data;
}

export async function addListaPrecioAPI(nombre: string, moneda: string = "UYU", es_default: boolean = false): Promise<ListaPrecioDB> {
  const { data, error } = await supabase
    .from("listas_precio")
    .insert([{ tenant_id: DEFAULT_TENANT_ID, nombre, moneda, es_default }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateListaPrecioAPI(id: string, updates: Partial<ListaPrecioDB>): Promise<void> {
  const { error } = await supabase
    .from("listas_precio")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteListaPrecioAPI(id: string): Promise<void> {
  const { error } = await supabase
    .from("listas_precio")
    .delete()
    .eq("id", id);
    
  if (error) throw error;
}

// -------- CATEGORIAS --------
export async function getCategorias(): Promise<string[]> {
  const { data, error } = await supabase
    .from("categorias")
    .select("nombre")
    .eq("tenant_id", DEFAULT_TENANT_ID);
    
  if (error) throw error;
  return data.map(c => c.nombre);
}

export async function addCategoriaAPI(nombre: string): Promise<CategoriaDB> {
  const { data, error } = await supabase
    .from("categorias")
    .insert([{ nombre, tenant_id: DEFAULT_TENANT_ID }])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function updateCategoriaAPI(oldName: string, newName: string): Promise<void> {
  const { error } = await supabase
    .from("categorias")
    .update({ nombre: newName })
    .match({ nombre: oldName, tenant_id: DEFAULT_TENANT_ID });
    
  if (error) throw error;
}

export async function deleteCategoriaAPI(nombre: string): Promise<void> {
  const { error } = await supabase
    .from("categorias")
    .delete()
    .match({ nombre, tenant_id: DEFAULT_TENANT_ID });
    
  if (error) throw error;
}

// -------- SERVICIOS (PRODUCTOS + PRECIOS) --------
export async function getServicios(): Promise<Servicio[]> {
  const { data, error } = await supabase
    .from("productos")
    .select(`
      id,
      nombre,
      descripcion,
      activo,
      categorias(nombre),
      precios_productos(precio, lista_precio_id)
    `)
    .eq("tenant_id", DEFAULT_TENANT_ID);

  if (error) throw error;

  return data.map((d: any) => {
    const preciosMap: Record<string, number> = {};
    if (d.precios_productos) {
      d.precios_productos.forEach((p: any) => {
        preciosMap[p.lista_precio_id] = Number(p.precio);
      });
    }

    return {
      id: d.id,
      nombre: d.nombre,
      descripcion: d.descripcion || "",
      activo: d.activo,
      categoria: d.categorias?.nombre || "General",
      precios: preciosMap,
    };
  });
}

export async function addServicioAPI(s: Omit<Servicio, "id">): Promise<void> {
  // 1. Obtener ID de la categoría
  let categoria_id = null;
  if (s.categoria) {
    let { data: cat } = await supabase.from("categorias").select("id").eq("nombre", s.categoria).eq("tenant_id", DEFAULT_TENANT_ID).single();
    if (!cat) { // Si no existe, crearla
        cat = await addCategoriaAPI(s.categoria);
    }
    categoria_id = cat.id;
  }

  // 2. Insertar producto
  const { data: prod, error: prodErr } = await supabase
    .from("productos")
    .insert([{
      tenant_id: DEFAULT_TENANT_ID,
      categoria_id,
      nombre: s.nombre,
      descripcion: s.descripcion,
      activo: s.activo
    }])
    .select()
    .single();

  if (prodErr) throw prodErr;

  // 3. Insertar precios
  if (s.precios && Object.keys(s.precios).length > 0) {
    const preciosToInsert = Object.entries(s.precios).map(([lista_precio_id, precio]) => ({
      producto_id: prod.id,
      lista_precio_id,
      precio
    }));
    
    const { error: priceErr } = await supabase
      .from("precios_productos")
      .insert(preciosToInsert);

    if (priceErr) throw priceErr;
  }
}

export async function updateServicioAPI(id: string, updates: Partial<Servicio>): Promise<void> {
  // 1. Si cambiaron datos del producto o categoría
  if (updates.nombre || updates.descripcion || updates.categoria || typeof updates.activo !== 'undefined') {
    let categoria_id = undefined;
    if (updates.categoria) {
      let { data: cat } = await supabase.from("categorias").select("id").eq("nombre", updates.categoria).eq("tenant_id", DEFAULT_TENANT_ID).single();
      if (!cat) cat = await addCategoriaAPI(updates.categoria);
      categoria_id = cat.id;
    }

    const { error } = await supabase
      .from("productos")
      .update({
        ...(updates.nombre && { nombre: updates.nombre }),
        ...(typeof updates.descripcion !== 'undefined' && { descripcion: updates.descripcion }),
        ...(typeof updates.activo !== 'undefined' && { activo: updates.activo }),
        ...(categoria_id && { categoria_id })
      })
      .eq("id", id);
      
    if (error) throw error;
  }

  // 2. Si cambiaron los precios
  if (updates.precios) {
    for (const [lista_precio_id, precioValue] of Object.entries(updates.precios)) {
      const { error: priceCheck } = await supabase
        .from("precios_productos")
        .select("producto_id")
        .eq("producto_id", id)
        .eq("lista_precio_id", lista_precio_id)
        .single();
      
      if (priceCheck) { // No existe, crear
        await supabase.from("precios_productos")
          .update({ precio: precioValue })
          .eq("producto_id", id)
          .eq("lista_precio_id", lista_precio_id);
      } else {
        await supabase.from("precios_productos")
          .insert([{ producto_id: id, lista_precio_id, precio: precioValue }]);
      }
    }
  }
}

export async function deleteServicioAPI(id: string): Promise<void> {
  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error) throw error;
}
