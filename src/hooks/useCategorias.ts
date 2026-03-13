import { useState, useCallback } from "react";
import { loadCategorias, saveCategorias } from "@/lib/data";
import { toast } from "@/hooks/use-toast";

export function useCategorias() {
  const [categorias, setCategorias] = useState<string[]>(loadCategorias);

  const persist = useCallback((next: string[]) => {
    setCategorias(next);
    saveCategorias(next);
  }, []);

  const addCategoria = useCallback((nombre: string) => {
    const trimmed = nombre.trim();
    if (!trimmed) return false;
    const current = loadCategorias();
    if (current.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: "Esa categoría ya existe", variant: "destructive" });
      return false;
    }
    persist([...current, trimmed]);
    toast({ title: "Categoría agregada", description: trimmed });
    return true;
  }, [persist]);

  const updateCategoria = useCallback((oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return false;
    const current = loadCategorias();
    persist(current.map(c => c === oldName ? trimmed : c));
    toast({ title: "Categoría actualizada" });
    return true;
  }, [persist]);

  const deleteCategoria = useCallback((nombre: string) => {
    persist(loadCategorias().filter(c => c !== nombre));
    toast({ title: "Categoría eliminada" });
  }, [persist]);

  return { categorias, addCategoria, updateCategoria, deleteCategoria };
}
