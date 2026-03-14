import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getItems, addItemAPI, updateItemAPI, deleteItemAPI } from "@/lib/api";
import { Item } from "@/lib/data";
import { toast } from "@/hooks/use-toast";

export function useItems() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: getItems,
  });

  const addMutation = useMutation({
    mutationFn: (item: Omit<Item, "id">) => addItemAPI(item),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast({ title: "Item agregado", description: variables.nombre });
    },
    onError: (err) => {
      console.error(err);
      toast({ title: "Error al agregar item", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Item> }) => updateItemAPI(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast({ title: "Item actualizado" });
    },
    onError: (err) => {
      console.error(err);
      toast({ title: "Error al actualizar item", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteItemAPI(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast({ title: "Item eliminado" });
    },
    onError: (err) => {
      console.error(err);
      toast({ title: "Error al eliminar item", variant: "destructive" });
    }
  });

  const addItem = (item: Omit<Item, "id">) => {
    addMutation.mutate(item);
    return { ...item, id: "temp-id" } as Item;
  };

  const updateItem = (id: string, updates: Partial<Item>) => {
    updateMutation.mutate({ id, updates });
  };

  const deleteItem = (id: string) => {
    deleteMutation.mutate(id);
  };

  const toggleActivo = (id: string) => {
    const item = items.find(x => x.id === id);
    if (item) {
      updateMutation.mutate({ id, updates: { activo: !item.activo } });
    }
  };

  return { items, isLoading, addItem, updateItem, deleteItem, toggleActivo };
}
