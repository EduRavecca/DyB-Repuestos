import { useState } from "react";
import { Servicio, Categoria, CATEGORIAS } from "@/lib/data";
import { useServicios } from "@/hooks/useServicios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, Pencil, Trash2, Power, Upload } from "lucide-react";
import BulkImport from "@/components/BulkImport";
import { toast } from "@/hooks/use-toast";

interface Props {
  onSelectForQuote?: (s: Servicio) => void;
}

export default function PriceTable({ onSelectForQuote }: Props) {
  const { servicios, addServicio, updateServicio, deleteServicio, toggleActivo } = useServicios();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("todas");
  const [editOpen, setEditOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<Servicio | null>(null);
  const [form, setForm] = useState({ nombre: "", precio: "", descripcion: "", categoria: "Neumáticos" as Categoria });

  const filtered = servicios.filter(s => {
    const matchSearch = s.nombre.toLowerCase().includes(search.toLowerCase()) || s.descripcion.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "todas" || s.categoria === catFilter;
    return matchSearch && matchCat;
  });

  function openNew() {
    setEditing(null);
    setForm({ nombre: "", precio: "", descripcion: "", categoria: "Neumáticos" });
    setEditOpen(true);
  }

  function openEdit(s: Servicio) {
    setEditing(s);
    setForm({ nombre: s.nombre, precio: String(s.precio), descripcion: s.descripcion, categoria: s.categoria });
    setEditOpen(true);
  }

  function handleSave() {
    const precio = Number(form.precio);
    if (!form.nombre.trim()) { toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" }); return; }
    if (isNaN(precio) || precio <= 0) { toast({ title: "Error", description: "El precio debe ser mayor a 0", variant: "destructive" }); return; }
    if (editing) {
      updateServicio(editing.id, { nombre: form.nombre, precio, descripcion: form.descripcion, categoria: form.categoria });
    } else {
      addServicio({ nombre: form.nombre, precio, descripcion: form.descripcion, categoria: form.categoria, activo: true });
    }
    setEditOpen(false);
  }

  const catColors: Record<Categoria, string> = {
    "Neumáticos": "bg-accent/15 text-accent border-accent/30",
    "Mecánica": "bg-warning/15 text-warning border-warning/30",
    "Aceites": "bg-success/15 text-success border-success/30",
  };

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
            {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" /> Agregar
        </Button>
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
                <td className="p-3"><Badge variant="outline" className={catColors[s.categoria]}>{s.categoria}</Badge></td>
                <td className="p-3 text-right font-semibold tabular-nums">${s.precio.toLocaleString("es-UY")}</td>
                <td className="p-3 text-muted-foreground">{s.descripcion}</td>
                <td className="p-3 text-center">
                  <button onClick={() => toggleActivo(s.id)} className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.activo ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                    <Power className="h-3 w-3" />{s.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    {onSelectForQuote && s.activo && (
                      <Button variant="ghost" size="sm" onClick={() => onSelectForQuote(s)} className="text-accent hover:text-accent">+ Cotizar</Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteServicio(s.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
              <p className="text-lg font-bold tabular-nums">${s.precio.toLocaleString("es-UY")}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="outline" className={catColors[s.categoria]}>{s.categoria}</Badge>
                <button onClick={() => toggleActivo(s.id)} className={`text-xs px-2 py-0.5 rounded-full ${s.activo ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                  {s.activo ? "Activo" : "Inactivo"}
                </button>
              </div>
              <div className="flex gap-1">
                {onSelectForQuote && s.activo && <Button variant="ghost" size="sm" onClick={() => onSelectForQuote(s)}>+ Cotizar</Button>}
                <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deleteServicio(s.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No se encontraron servicios.</p>}
      </div>

      {/* Edit/Add Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar servicio" : "Agregar servicio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nombre del servicio" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            <Input type="number" placeholder="Precio (UYU)" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} min={1} />
            <Input placeholder="Descripción breve" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            <Select value={form.categoria} onValueChange={(v) => setForm(f => ({ ...f, categoria: v as Categoria }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? "Guardar" : "Agregar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
