import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategorias, addCategoriaAPI, updateCategoriaAPI, deleteCategoriaAPI } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export function useCategorias() {
  const queryClient = useQueryClient();

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ["categorias"],
    queryFn: getCategorias,
  });

  const addMutation = useMutation({
    mutationFn: (nombre: string) => addCategoriaAPI(nombre),
    onSuccess: (_, nombre) => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast({ title: "Categoría agregada", description: nombre });
    },
    onError: (err) => {
      console.error(err);
      toast({ title: "Error al agregar categoría", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ oldName, newName }: { oldName: string, newName: string }) => updateCategoriaAPI(oldName, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      queryClient.invalidateQueries({ queryKey: ["servicios"] });
      toast({ title: "Categoría actualizada" });
    },
    onError: (err) => {
      console.error(err);
      toast({ title: "Error al actualizar categoría", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (nombre: string) => deleteCategoriaAPI(nombre),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      queryClient.invalidateQueries({ queryKey: ["servicios"] });
      toast({ title: "Categoría eliminada" });
    },
    onError: (err) => {
      console.error(err);
      toast({ title: "Error al eliminar categoría", variant: "destructive" });
    }
  });

  // Compatible API with previous sync hook
  const addCategoria = (nombre: string) => {
    const trimmed = nombre.trim();
    if (!trimmed) return false;
    if (categorias.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: "Esa categoría ya existe", variant: "destructive" });
      return false;
    }
    addMutation.mutate(trimmed);
    return true;
  };

  const updateCategoria = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return false;
    updateMutation.mutate({ oldName, newName: trimmed });
    return true;
  };

  const deleteCategoria = (nombre: string) => {
    deleteMutation.mutate(nombre);
  };

  return { categorias, isLoading, addCategoria, updateCategoria, deleteCategoria };
}
