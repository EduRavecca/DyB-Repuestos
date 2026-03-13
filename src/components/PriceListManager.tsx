import { useState } from "react";
import { useListasPrecio } from "@/hooks/useListasPrecio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ListTree, Check, X, ShieldAlert } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PriceListManager({ open, onOpenChange }: Props) {
  const { listas, addLista, updateLista, deleteLista } = useListasPrecio();
  const [newLista, setNewLista] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function handleAdd() {
    if (addLista(newLista)) setNewLista("");
  }

  function startEdit(id: string, currentName: string) {
    setEditingId(id);
    setEditValue(currentName);
  }

  function saveEdit(id: string) {
    if (updateLista(id, editValue)) setEditingId(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListTree className="h-5 w-5" /> Gestionar Listas de Precios
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nueva lista (ej: Mayorista, Mostrador)..."
              value={newLista}
              onChange={e => setNewLista(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
            <Button onClick={handleAdd} size="icon" disabled={!newLista.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1">
            {listas.map((lista) => (
              <div key={lista.id} className="flex items-center gap-2 rounded-md px-3 py-2 bg-muted/50">
                {editingId === lista.id ? (
                  <>
                    <Input
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && saveEdit(lista.id)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => saveEdit(lista.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium flex items-center gap-2">
                      {lista.nombre}
                      {lista.es_default && <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold">Por Defecto</span>}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(lista.id, lista.nombre)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {!lista.es_default ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteLista(lista.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <div className="w-8 h-8 flex items-center justify-center pointer-events-none opacity-50" title="No puedes eliminar la lista base">
                        <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {listas.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Cargando listas o no hay listas disponibles...</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
