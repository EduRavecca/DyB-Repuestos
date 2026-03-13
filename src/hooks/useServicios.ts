import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getServicios, addServicioAPI, updateServicioAPI, deleteServicioAPI } from "@/lib/api";
import { Servicio } from "@/lib/data";
import { toast } from "@/hooks/use-toast";

export function useServicios() {
  const queryClient = useQueryClient();

  const { data: servicios = [], isLoading } = useQuery({
    queryKey: ["servicios"],
    queryFn: getServicios,
  });

  const addMutation = useMutation({
    mutationFn: (s: Omit<Servicio, "id">) => addServicioAPI(s),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["servicios"] });
      toast({ title: "Servicio agregado", description: variables.nombre });
    },
    onError: (err) => {
      console.error(err);
      toast({ title: "Error al agregar servicio", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Servicio> }) => updateServicioAPI(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicios"] });
      toast({ title: "Servicio actualizado" });
    },
    onError: (err) => {
      console.error(err);
      toast({ title: "Error al actualizar servicio", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteServicioAPI(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicios"] });
      toast({ title: "Servicio eliminado" });
    },
    onError: (err) => {
      console.error(err);
      toast({ title: "Error al eliminar servicio", variant: "destructive" });
    }
  });

  // Wrappers to keep backward compatibility with the components
  const addServicio = (s: Omit<Servicio, "id">) => {
    addMutation.mutate(s);
    return { ...s, id: "temp-id" } as Servicio;
  };

  const updateServicio = (id: string, updates: Partial<Servicio>) => {
    updateMutation.mutate({ id, updates });
  };

  const deleteServicio = (id: string) => {
    deleteMutation.mutate(id);
  };

  const toggleActivo = (id: string) => {
    const s = servicios.find(x => x.id === id);
    if (s) {
      updateMutation.mutate({ id, updates: { activo: !s.activo } });
    }
  };

  return { servicios, isLoading, addServicio, updateServicio, deleteServicio, toggleActivo };
}
