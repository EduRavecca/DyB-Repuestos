import { useState } from "react";
import { useCategorias } from "@/hooks/useCategorias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tags, Check, X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CategoryManager({ open, onOpenChange }: Props) {
  const { categorias, addCategoria, updateCategoria, deleteCategoria } = useCategorias();
  const [newCat, setNewCat] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  function handleAdd() {
    if (addCategoria(newCat)) setNewCat("");
  }

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setEditValue(categorias[idx]);
  }

  function saveEdit(oldName: string) {
    if (updateCategoria(oldName, editValue)) setEditingIdx(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" /> Gestionar Categorías
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nueva categoría..."
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
            <Button onClick={handleAdd} size="icon" disabled={!newCat.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1">
            {categorias.map((cat, idx) => (
              <div key={cat} className="flex items-center gap-2 rounded-md px-3 py-2 bg-muted/50">
                {editingIdx === idx ? (
                  <>
                    <Input
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && saveEdit(cat)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => saveEdit(cat)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingIdx(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium">{cat}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(idx)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCategoria(cat)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}
            {categorias.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay categorías. Agregá una arriba.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
