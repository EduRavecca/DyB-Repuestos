import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getListasPrecio, addListaPrecioAPI, updateListaPrecioAPI, deleteListaPrecioAPI, ListaPrecioDB } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export function useListasPrecio() {
  const queryClient = useQueryClient();

  const { data: listas = [], isLoading } = useQuery({
    queryKey: ["listas_precio"],
    queryFn: getListasPrecio,
  });

  const addMutation = useMutation({
    mutationFn: (nombre: string) => addListaPrecioAPI(nombre),
    onSuccess: (_, nombre) => {
      queryClient.invalidateQueries({ queryKey: ["listas_precio"] });
      toast({ title: "Lista de precio agregada", description: nombre });
    },
    onError: (err) => {
      console.error(err);
      toast({ title: "Error al agregar lista de precio", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<ListaPrecioDB> }) => updateListaPrecioAPI(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listas_precio"] });
      queryClient.invalidateQueries({ queryKey: ["servicios"] }); // Invalidate services since prices might be linked
      toast({ title: "Lista de precio actualizada" });
    },
    onError: (err) => {
      console.error(err);
      toast({ title: "Error al actualizar lista de precio", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteListaPrecioAPI(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listas_precio"] });
      queryClient.invalidateQueries({ queryKey: ["servicios"] });
      toast({ title: "Lista de precio eliminada" });
    },
    onError: (err) => {
      console.error(err);
      toast({ title: "Error al eliminar lista de precio", variant: "destructive" });
    }
  });

  const addLista = (nombre: string) => {
    const trimmed = nombre.trim();
    if (!trimmed) return false;
    if (listas.some(l => l.nombre.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: "Esa lista ya existe", variant: "destructive" });
      return false;
    }
    addMutation.mutate(trimmed);
    return true;
  };

  const updateLista = (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return false;
    updateMutation.mutate({ id, updates: { nombre: trimmed } });
    return true;
  };

  const deleteLista = (id: string) => {
    const lista = listas.find(l => l.id === id);
    if (lista?.es_default) {
       toast({ title: "No podés eliminar la lista por defecto", variant: "destructive" });
       return;
    }
    deleteMutation.mutate(id);
  };

  return { listas, isLoading, addLista, updateLista, deleteLista };
}
