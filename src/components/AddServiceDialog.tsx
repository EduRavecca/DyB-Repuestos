import { useState, useRef } from "react";
import { useServicios } from "@/hooks/useServicios";
import { useCategorias } from "@/hooks/useCategorias";
import { DEFAULT_LISTA_PRECIO_ID } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, FileSpreadsheet, AlertCircle, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface BulkRow {
  nombre: string;
  precio: string;
  descripcion: string;
  categoria: string;
}

const emptyRow = (initialCategoria: string = "General"): BulkRow => ({
  nombre: "", precio: "", descripcion: "", categoria: initialCategoria,
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddServiceDialog({ open, onOpenChange }: Props) {
  const { addServicio } = useServicios();
  const fileRef = useRef<HTMLInputElement>(null);
  const { categorias, isLoading } = useCategorias();
  const defaultCat = categorias[0] || "General";

  // Single add
  const [form, setForm] = useState({ nombre: "", precio: "", descripcion: "", categoria: defaultCat });

  // Bulk manual
  const [rows, setRows] = useState<BulkRow[]>([emptyRow(defaultCat), emptyRow(defaultCat), emptyRow(defaultCat)]);

  // Excel import
  const [importedRows, setImportedRows] = useState<BulkRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  function handleSaveSingle() {
    const precio = Number(form.precio);
    if (!form.nombre.trim()) { toast({ title: "El nombre es obligatorio", variant: "destructive" }); return; }
    if (isNaN(precio) || precio <= 0) { toast({ title: "El precio debe ser mayor a 0", variant: "destructive" }); return; }
    addServicio({ nombre: form.nombre, precios: { [DEFAULT_LISTA_PRECIO_ID]: precio }, descripcion: form.descripcion, categoria: form.categoria, activo: true });
    setForm({ nombre: "", precio: "", descripcion: "", categoria: defaultCat });
    onOpenChange(false);
  }

  function updateRow(index: number, field: keyof BulkRow, value: string) {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  }

  function validateAndSave(data: BulkRow[]): number {
    const errs: string[] = [];
    const valid: BulkRow[] = [];
    data.forEach((r, i) => {
      if (!r.nombre.trim()) { errs.push(`Fila ${i + 1}: nombre vacío`); return; }
      const precio = Number(r.precio);
      if (isNaN(precio) || precio <= 0) { errs.push(`Fila ${i + 1}: precio inválido`); return; }
      valid.push(r);
    });
    setErrors(errs);
    valid.forEach(r => addServicio({ nombre: r.nombre, precios: { [DEFAULT_LISTA_PRECIO_ID]: Number(r.precio) }, descripcion: r.descripcion, categoria: r.categoria, activo: true }));
    return valid.length;
  }

  function handleSaveManual() {
    const nonEmpty = rows.filter(r => r.nombre.trim() || r.precio.trim());
    if (nonEmpty.length === 0) { toast({ title: "No hay filas para guardar", variant: "destructive" }); return; }
    const count = validateAndSave(nonEmpty);
    if (count > 0) {
      toast({ title: `${count} servicio(s) agregado(s) ✓` });
      setRows([emptyRow(defaultCat), emptyRow(defaultCat), emptyRow(defaultCat)]);
      if (count === nonEmpty.length) onOpenChange(false);
    }
  }

  function handleSaveImported() {
    if (importedRows.length === 0) return;
    const count = validateAndSave(importedRows);
    if (count > 0) {
      toast({ title: `${count} servicio(s) importado(s) ✓` });
      setImportedRows([]);
      if (count === importedRows.length) onOpenChange(false);
    }
  }

  function parseCategoriaFromString(val: string): string {
    const lower = val?.toLowerCase().trim() || "";
    const match = categorias.find(c => lower.includes(c.toLowerCase().slice(0, 4)));
    return match || defaultCat;
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        const parsed: BulkRow[] = json.map(row => {
          const nombre = String(row["Servicio"] || row["nombre"] || row["Nombre"] || row["servicio"] || row["SERVICIO"] || row["Artículo"] || row["articulo"] || "").trim();
          const precio = String(row["Precio"] || row["precio"] || row["PRECIO"] || row["Precio (UYU)"] || "0").replace(/[^0-9.,]/g, "").replace(",", ".");
          const descripcion = String(row["Descripción"] || row["descripcion"] || row["Descripcion"] || row["DESCRIPCION"] || row["Detalle"] || "").trim();
          const catRaw = String(row["Categoría"] || row["categoria"] || row["Categoria"] || row["CATEGORIA"] || "");
          return { nombre, precio, descripcion, categoria: parseCategoriaFromString(catRaw || nombre) };
        }).filter(r => r.nombre);

        setImportedRows(parsed);
        setErrors([]);
        toast({ title: `${parsed.length} fila(s) leídas del archivo` });
      } catch {
        toast({ title: "Error al leer el archivo", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Servicio", "Precio", "Descripción", "Categoría"],
      ["Neumático 185/65R15 Pirelli", "3800", "Pirelli P1", "Neumáticos"],
      ["Alineación y balanceo", "2500", "Combo 4 ruedas", "Mecánica"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Servicios");
    XLSX.writeFile(wb, "plantilla_cp_neumaticos.xlsx");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Agregar servicios
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="individual">
          <TabsList className="w-full">
            <TabsTrigger value="individual" className="flex-1 gap-1.5"><Plus className="h-4 w-4" /> Individual</TabsTrigger>
            <TabsTrigger value="manual" className="flex-1 gap-1.5"><Plus className="h-4 w-4" /> Carga masiva</TabsTrigger>
            <TabsTrigger value="excel" className="flex-1 gap-1.5"><FileSpreadsheet className="h-4 w-4" /> Importar Excel</TabsTrigger>
          </TabsList>

          {/* Individual */}
          <TabsContent value="individual" className="space-y-3 mt-4">
            <Input placeholder="Nombre del servicio" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            <Input type="number" placeholder="Precio (UYU)" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} min={1} />
            <Input placeholder="Descripción breve" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSaveSingle}>Agregar</Button>
            </DialogFooter>
          </TabsContent>

          {/* Manual bulk */}
          <TabsContent value="manual" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">Completá las filas y hacé clic en "Guardar todo".</p>
            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_1fr_120px_32px] gap-2 items-center">
                  <Input placeholder="Nombre" value={row.nombre} onChange={e => updateRow(i, "nombre", e.target.value)} className="text-sm" />
                  <Input type="number" placeholder="$" value={row.precio} onChange={e => updateRow(i, "precio", e.target.value)} className="text-sm" min={1} />
                  <Input placeholder="Descripción" value={row.descripcion} onChange={e => updateRow(i, "descripcion", e.target.value)} className="text-sm" />
                  <Select value={row.categoria} onValueChange={v => updateRow(i, "categoria", v)}>
                    <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => setRows(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive h-8 w-8">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setRows(prev => [...prev, emptyRow(defaultCat)])} className="gap-1">
              <Plus className="h-3.5 w-3.5" /> Agregar fila
            </Button>
            {errors.length > 0 && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive space-y-1">
                <div className="flex items-center gap-1 font-medium"><AlertCircle className="h-4 w-4" /> Errores:</div>
                {errors.map((e, i) => <p key={i}>• {e}</p>)}
              </div>
            )}
            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSaveManual}>Guardar todo ({rows.filter(r => r.nombre.trim()).length})</Button>
            </DialogFooter>
          </TabsContent>

          {/* Excel import */}
          <TabsContent value="excel" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Subí un archivo Excel (.xlsx) o CSV con columnas: <strong>Servicio, Precio, Descripción, Categoría</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-1.5">
                <Upload className="h-4 w-4" /> Seleccionar archivo
              </Button>
              <Button variant="ghost" onClick={downloadTemplate} className="gap-1.5 text-accent">
                <FileSpreadsheet className="h-4 w-4" /> Descargar plantilla
              </Button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
            </div>

            {importedRows.length > 0 && (
              <>
                <div className="glass-card overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 font-semibold">Servicio</th>
                        <th className="text-right p-2 font-semibold">Precio</th>
                        <th className="text-left p-2 font-semibold">Descripción</th>
                        <th className="text-left p-2 font-semibold">Categoría</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importedRows.map((r, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="p-2">{r.nombre}</td>
                          <td className="p-2 text-right tabular-nums">${Number(r.precio).toLocaleString("es-UY")}</td>
                          <td className="p-2 text-muted-foreground">{r.descripcion}</td>
                          <td className="p-2">{r.categoria}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {errors.length > 0 && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive space-y-1">
                    <div className="flex items-center gap-1 font-medium"><AlertCircle className="h-4 w-4" /> Errores:</div>
                    {errors.map((e, i) => <p key={i}>• {e}</p>)}
                  </div>
                )}
                <DialogFooter>
                  <Button variant="secondary" onClick={() => { setImportedRows([]); setErrors([]); }}>Cancelar</Button>
                  <Button onClick={handleSaveImported}>Importar {importedRows.length} servicio(s)</Button>
                </DialogFooter>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
