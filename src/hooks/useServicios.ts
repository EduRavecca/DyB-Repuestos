import { useState, useCallback } from "react";
import { Servicio, loadServicios, saveServicios } from "@/lib/data";
import { toast } from "@/hooks/use-toast";

export function useServicios() {
  const [servicios, setServicios] = useState<Servicio[]>(loadServicios);

  const persist = useCallback((next: Servicio[]) => {
    setServicios(next);
    saveServicios(next);
  }, []);

  const addServicio = useCallback((s: Omit<Servicio, "id">) => {
    const newS = { ...s, id: crypto.randomUUID() };
    persist([...loadServicios(), newS]);
    toast({ title: "Servicio agregado", description: s.nombre });
    return newS;
  }, [persist]);

  const updateServicio = useCallback((id: string, updates: Partial<Servicio>) => {
    const next = loadServicios().map(s => s.id === id ? { ...s, ...updates } : s);
    persist(next);
    toast({ title: "Servicio actualizado" });
  }, [persist]);

  const deleteServicio = useCallback((id: string) => {
    persist(loadServicios().filter(s => s.id !== id));
    toast({ title: "Servicio eliminado" });
  }, [persist]);

  const toggleActivo = useCallback((id: string) => {
    const next = loadServicios().map(s => s.id === id ? { ...s, activo: !s.activo } : s);
    persist(next);
  }, [persist]);

  return { servicios, addServicio, updateServicio, deleteServicio, toggleActivo };
}
