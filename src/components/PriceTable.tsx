import { useState } from "react";
import { Item, getPrice, IVA_RATE } from "@/lib/data";
import { useItems } from "@/hooks/useItems";
import { useCategorias } from "@/hooks/useCategorias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Pencil, Trash2, Power, Tags, ListTree } from "lucide-react";
import AddItemDialog from "@/components/AddItemDialog";
import CategoryManager from "@/components/CategoryManager";
import PriceListManager from "@/components/PriceListManager";
import { useListasPrecio } from "@/hooks/useListasPrecio";
import { useAuth } from "@/lib/auth";
import { DEFAULT_LISTA_PRECIO_ID } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface Props {
  onSelectForQuote?: (item: Item) => void;
}

const CAT_COLORS = [
  "bg-accent/15 text-accent border-accent/30",
  "bg-warning/15 text-warning border-warning/30",
  "bg-success/15 text-success border-success/30",
  "bg-primary/15 text-primary border-primary/30",
  "bg-destructive/15 text-destructive border-destructive/30",
];

const normalize = (str: string) => 
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function PriceTable({ onSelectForQuote }: Props) {
  const { items, updateItem, deleteItem, toggleActivo } = useItems();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("todas");
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [listManagerOpen, setListManagerOpen] = useState(false);
  const [activeListId, setActiveListId] = useState(DEFAULT_LISTA_PRECIO_ID);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({ 
    nombre: "", 
    precios: {} as Record<string, { neto: string, conIva: string }>, 
    descripcion: "", 
    categoria: "" 
  });

  const { categorias, isLoading: loadingCats } = useCategorias();
  const { listas } = useListasPrecio();
  const { isManager } = useAuth();

  const filtered = items.filter(item => {
    const searchNorm = normalize(search);
    const matchSearch = normalize(item.nombre).includes(searchNorm) || 
                       normalize(item.descripcion).includes(searchNorm);
    const matchCat = catFilter === "todas" || item.categoria === catFilter;
    return matchSearch && matchCat;
  });

  function openEdit(item: Item) {
    setEditing(item);
    const itemPrecios: Record<string, { neto: string, conIva: string }> = {};
    listas.forEach(l => {
      const p = item.precios[l.id] || 0;
      itemPrecios[l.id] = {
        neto: p > 0 ? String(p) : "",
        conIva: p > 0 ? String(Math.round(p * (1 + IVA_RATE))) : ""
      };
    });
    setForm({ 
      nombre: item.nombre, 
      precios: itemPrecios,
      descripcion: item.descripcion, 
      categoria: item.categoria 
    });
    setEditOpen(true);
  }

  function handlePriceChange(listaId: string, val: string) {
    const p = Number(val);
    setForm(f => ({ 
      ...f, 
      precios: {
        ...f.precios,
        [listaId]: {
          neto: val,
          conIva: isNaN(p) || val === "" ? "" : String(Math.round(p * (1 + IVA_RATE)))
        }
      }
    }));
  }

  function handlePriceWithIvaChange(listaId: string, val: string) {
    const pIva = Number(val);
    setForm(f => ({ 
      ...f, 
      precios: {
        ...f.precios,
        [listaId]: {
          conIva: val,
          neto: isNaN(pIva) || val === "" ? "" : String(Math.round(pIva / (1 + IVA_RATE)))
        }
      }
    }));
  }

  function handleSave() {
    if (!form.nombre.trim()) { toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" }); return; }
    
    if (editing) {
      const numericPrecios: Record<string, number> = {};
      Object.entries(form.precios).forEach(([id, p]) => {
        const val = Number(p.neto);
        if (!isNaN(val) && val > 0) numericPrecios[id] = val;
      });

      updateItem(editing.id, { 
        nombre: form.nombre, 
        precios: numericPrecios, 
        descripcion: form.descripcion, 
        categoria: form.categoria 
      });
    }
    setEditOpen(false);
  }

  function getCatColor(cat: string) {
    const idx = categorias.indexOf(cat);
    return CAT_COLORS[idx % CAT_COLORS.length] || CAT_COLORS[0];
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-end gap-3">
        <div className="relative flex-1 w-full">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 block mb-1">Buscar</label>
          <Search className="absolute left-3 top-[34px] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar artículo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <div className="w-full sm:w-[180px]">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 block mb-1">Categoría</label>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-[150px]">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 block mb-1">Lista de Precio</label>
          <Select value={activeListId} onValueChange={setActiveListId}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Lista de Precio" />
            </SelectTrigger>
            <SelectContent>
              {listas.map(l => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {isManager && (
          <div className="flex gap-2 w-full sm:w-auto h-10">
            <Button variant="outline" onClick={() => setCatOpen(true)} className="h-10 w-10 p-0" title="Gestionar categorías">
              <Tags className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setListManagerOpen(true)} className="h-10 w-10 p-0" title="Gestionar listas de precio">
              <ListTree className="h-4 w-4" />
            </Button>
            <Button onClick={() => setAddOpen(true)} className="flex-1 sm:flex-none gap-1.5 h-10">
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>
        )}
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-semibold">Artículo</th>
              <th className="text-left p-3 font-semibold">Categoría</th>
              <th className="text-right p-3 font-semibold">Básico (UYU)</th>
              <th className="text-right p-3 font-semibold">Con IVA (22%)</th>
              <th className="text-left p-3 font-semibold">Descripción</th>
              <th className="text-center p-3 font-semibold">Estado</th>
              <th className="text-right p-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${!item.activo ? "opacity-50" : ""}`}>
                <td className="p-3 font-medium">{item.nombre}</td>
                <td className="p-3"><Badge variant="outline" className={getCatColor(item.categoria)}>{item.categoria}</Badge></td>
                <td className="p-3 text-right font-medium tabular-nums">
                  {getPrice(item, activeListId) > 0 ? `$${getPrice(item, activeListId).toLocaleString("es-UY")}` : <span className="text-muted-foreground text-xs italic">S/P</span>}
                </td>
                <td className="p-3 text-right font-bold tabular-nums text-primary">
                  {getPrice(item, activeListId) > 0 ? `$${Math.round(getPrice(item, activeListId) * (1 + IVA_RATE)).toLocaleString("es-UY")}` : <span className="text-muted-foreground text-xs italic">S/P</span>}
                </td>
                <td className="p-3 text-muted-foreground">{item.descripcion}</td>
                <td className="p-3 text-center">
                  <button onClick={() => isManager ? toggleActivo(item.id) : null} disabled={!isManager} className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${item.activo ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"} ${!isManager ? "cursor-default opacity-80" : ""}`}>
                    <Power className="h-3 w-3" />{item.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    {onSelectForQuote && item.activo && (
                      <Button variant="ghost" size="sm" onClick={() => onSelectForQuote(item)} className="text-accent hover:text-accent">+ Cotizar</Button>
                    )}
                    {isManager && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No se encontraron artículos.</p>}
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {filtered.map(item => (
          <div key={item.id} className={`glass-card p-4 space-y-2 animate-fade-in ${!item.activo ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{item.nombre}</p>
                <p className="text-xs text-muted-foreground">{item.descripcion}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold tabular-nums text-primary">
                  {getPrice(item, activeListId) > 0 ? `$${Math.round(getPrice(item, activeListId) * (1 + IVA_RATE)).toLocaleString("es-UY")}` : <span className="text-muted-foreground text-xs italic font-normal">S/P</span>}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Con IVA</p>
                <p className="text-xs font-medium tabular-nums mt-1">
                  {getPrice(item, activeListId) > 0 ? `$${getPrice(item, activeListId).toLocaleString("es-UY")} neto` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="outline" className={getCatColor(item.categoria)}>{item.categoria}</Badge>
                <button onClick={() => isManager ? toggleActivo(item.id) : null} disabled={!isManager} className={`text-xs px-2 py-0.5 rounded-full ${item.activo ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"} ${!isManager ? "cursor-default opacity-80" : ""}`}>
                  {item.activo ? "Activo" : "Inactivo"}
                </button>
              </div>
              <div className="flex gap-1">
                {onSelectForQuote && item.activo && <Button variant="ghost" size="sm" onClick={() => onSelectForQuote(item)}>+ Cotizar</Button>}
                {isManager && (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No se encontraron artículos.</p>}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar artículo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nombre</label>
              <Input placeholder="Nombre del artículo" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>

            <div className="space-y-4 border rounded-md p-3 bg-muted/30">
              <p className="text-xs font-bold uppercase text-muted-foreground border-b pb-2">Precios por Lista</p>
              {listas.map(l => (
                <div key={l.id} className="grid grid-cols-[120px_1fr_1fr] gap-3 items-end">
                  <div className="text-xs font-medium pb-2 text-primary">{l.nombre}</div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Precio Neto</label>
                    <Input 
                      type="number" 
                      placeholder="Neto" 
                      value={form.precios[l.id]?.neto || ""} 
                      onChange={e => handlePriceChange(l.id, e.target.value)} 
                      min={0}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Con IVA</label>
                    <Input 
                      type="number" 
                      placeholder="Con IVA" 
                      value={form.precios[l.id]?.conIva || ""} 
                      onChange={e => handlePriceWithIvaChange(l.id, e.target.value)} 
                      min={0}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Categoría</label>
                <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                <Input placeholder="Descripción breve" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isManager && (
        <>
          <AddItemDialog open={addOpen} onOpenChange={setAddOpen} />
          <CategoryManager open={catOpen} onOpenChange={setCatOpen} />
          <PriceListManager open={listManagerOpen} onOpenChange={setListManagerOpen} />
        </>
      )}
    </div>
  );
}
