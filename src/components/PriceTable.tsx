import { useState } from "react";
import { Servicio, getPrice } from "@/lib/data";
import { useServicios } from "@/hooks/useServicios";
import { useCategorias } from "@/hooks/useCategorias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Pencil, Trash2, Power, Tags, ListTree } from "lucide-react";
import AddServiceDialog from "@/components/AddServiceDialog";
import CategoryManager from "@/components/CategoryManager";
import PriceListManager from "@/components/PriceListManager";
import { useListasPrecio } from "@/hooks/useListasPrecio";
import { useAuth } from "@/lib/auth";
import { DEFAULT_LISTA_PRECIO_ID } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface Props {
  onSelectForQuote?: (s: Servicio) => void;
}

const CAT_COLORS = [
  "bg-accent/15 text-accent border-accent/30",
  "bg-warning/15 text-warning border-warning/30",
  "bg-success/15 text-success border-success/30",
  "bg-primary/15 text-primary border-primary/30",
  "bg-destructive/15 text-destructive border-destructive/30",
];

export default function PriceTable({ onSelectForQuote }: Props) {
  const { servicios, updateServicio, deleteServicio, toggleActivo } = useServicios();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("todas");
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [listManagerOpen, setListManagerOpen] = useState(false);
  const [activeListId, setActiveListId] = useState(DEFAULT_LISTA_PRECIO_ID);
  const [editing, setEditing] = useState<Servicio | null>(null);
  const [form, setForm] = useState({ nombre: "", precio: "", descripcion: "", categoria: "" });

  const { categorias, isLoading: loadingCats } = useCategorias();
  const { listas } = useListasPrecio();
  const { isManager } = useAuth();

  const filtered = servicios.filter(s => {
    const matchSearch = s.nombre.toLowerCase().includes(search.toLowerCase()) || s.descripcion.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "todas" || s.categoria === catFilter;
    return matchSearch && matchCat;
  });

  function openEdit(s: Servicio) {
    setEditing(s);
    setForm({ nombre: s.nombre, precio: String(getPrice(s, activeListId)), descripcion: s.descripcion, categoria: s.categoria });
    setEditOpen(true);
  }

  function handleSave() {
    const precio = Number(form.precio);
    if (!form.nombre.trim()) { toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" }); return; }
    if (isNaN(precio) || precio <= 0) { toast({ title: "Error", description: "El precio debe ser mayor a 0", variant: "destructive" }); return; }
    if (editing) {
      updateServicio(editing.id, { 
        nombre: form.nombre, 
        precios: { ...editing.precios, [activeListId]: precio }, 
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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar servicio..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={activeListId} onValueChange={setActiveListId}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Lista de Precio" />
          </SelectTrigger>
          <SelectContent>
            {listas.map(l => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
        {isManager && (
          <>
            <Button variant="outline" onClick={() => setCatOpen(true)} className="gap-1.5" size="icon" title="Gestionar categorías">
              <Tags className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setListManagerOpen(true)} className="gap-1.5" size="icon" title="Gestionar listas de precio">
              <ListTree className="h-4 w-4" />
            </Button>
            <Button onClick={() => setAddOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </>
        )}
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-semibold">Servicio</th>
              <th className="text-left p-3 font-semibold">Categoría</th>
              <th className="text-right p-3 font-semibold">Precio (UYU)</th>
              <th className="text-left p-3 font-semibold">Descripción</th>
              <th className="text-center p-3 font-semibold">Estado</th>
              <th className="text-right p-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${!s.activo ? "opacity-50" : ""}`}>
                <td className="p-3 font-medium">{s.nombre}</td>
                <td className="p-3"><Badge variant="outline" className={getCatColor(s.categoria)}>{s.categoria}</Badge></td>
                <td className="p-3 text-right font-semibold tabular-nums">
                  {getPrice(s, activeListId) > 0 ? `$${getPrice(s, activeListId).toLocaleString("es-UY")}` : <span className="text-muted-foreground text-xs italic">Sin precio</span>}
                </td>
                <td className="p-3 text-muted-foreground">{s.descripcion}</td>
                <td className="p-3 text-center">
                  <button onClick={() => isManager ? toggleActivo(s.id) : null} disabled={!isManager} className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.activo ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"} ${!isManager ? "cursor-default opacity-80" : ""}`}>
                    <Power className="h-3 w-3" />{s.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    {onSelectForQuote && s.activo && (
                      <Button variant="ghost" size="sm" onClick={() => onSelectForQuote(s)} className="text-accent hover:text-accent">+ Cotizar</Button>
                    )}
                    {isManager && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteServicio(s.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No se encontraron servicios.</p>}
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {filtered.map(s => (
          <div key={s.id} className={`glass-card p-4 space-y-2 animate-fade-in ${!s.activo ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{s.nombre}</p>
                <p className="text-xs text-muted-foreground">{s.descripcion}</p>
              </div>
              <p className="text-lg font-bold tabular-nums">
                {getPrice(s, activeListId) > 0 ? `$${getPrice(s, activeListId).toLocaleString("es-UY")}` : <span className="text-muted-foreground text-xs italic font-normal">S/P</span>}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="outline" className={getCatColor(s.categoria)}>{s.categoria}</Badge>
                <button onClick={() => isManager ? toggleActivo(s.id) : null} disabled={!isManager} className={`text-xs px-2 py-0.5 rounded-full ${s.activo ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"} ${!isManager ? "cursor-default opacity-80" : ""}`}>
                  {s.activo ? "Activo" : "Inactivo"}
                </button>
              </div>
              <div className="flex gap-1">
                {onSelectForQuote && s.activo && <Button variant="ghost" size="sm" onClick={() => onSelectForQuote(s)}>+ Cotizar</Button>}
                {isManager && (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteServicio(s.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No se encontraron servicios.</p>}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar servicio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nombre del servicio" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            <Input type="number" placeholder="Precio (UYU)" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} min={1} />
            <Input placeholder="Descripción breve" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isManager && (
        <>
          <AddServiceDialog open={addOpen} onOpenChange={setAddOpen} />
          <CategoryManager open={catOpen} onOpenChange={setCatOpen} />
          <PriceListManager open={listManagerOpen} onOpenChange={setListManagerOpen} />
        </>
      )}
    </div>
  );
}
