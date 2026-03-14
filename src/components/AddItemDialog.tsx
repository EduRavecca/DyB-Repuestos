import { useState, useRef, useMemo } from "react";
import { useItems } from "@/hooks/useItems";
import { useCategorias } from "@/hooks/useCategorias";
import { useListasPrecio } from "@/hooks/useListasPrecio";
import { DEFAULT_LISTA_PRECIO_ID } from "@/lib/api";
import { IVA_RATE } from "@/lib/data";
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
  precios: Record<string, string>; // ID -> Value (Neto)
  descripcion: string;
  categoria: string;
}

const emptyRow = (initialCategoria: string = "General", listas: any[] = []): BulkRow => {
  const precios: Record<string, string> = {};
  listas.forEach(l => precios[l.id] = "");
  return { nombre: "", precios, descripcion: "", categoria: initialCategoria };
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddItemDialog({ open, onOpenChange }: Props) {
  const { addItem } = useItems();
  const fileRef = useRef<HTMLInputElement>(null);
  const { categorias, isLoading: loadingCat } = useCategorias();
  const { listas, isLoading: loadingListas } = useListasPrecio();
  const defaultCat = categorias[0] || "General";

  // Single add
  const [form, setForm] = useState({ 
    nombre: "", 
    precios: {} as Record<string, { neto: string, conIva: string }>, 
    descripcion: "", 
    categoria: defaultCat 
  });

  // Initialize prices for individual form
  useMemo(() => {
    if (listas.length > 0 && Object.keys(form.precios).length === 0) {
      const initialPrecios: Record<string, { neto: string, conIva: string }> = {};
      listas.forEach(l => initialPrecios[l.id] = { neto: "", conIva: "" });
      setForm(f => ({ ...f, precios: initialPrecios }));
    }
  }, [listas]);

  // Bulk manual
  const [totalPreciosCount, setTotalPreciosCount] = useState(0);
  const [rows, setRows] = useState<BulkRow[]>([]);
  
  useMemo(() => {
    if (rows.length === 0 && listas.length > 0) {
      setRows([emptyRow(defaultCat, listas), emptyRow(defaultCat, listas), emptyRow(defaultCat, listas)]);
    }
  }, [listas, defaultCat]);

  // Excel import
  const [importedRows, setImportedRows] = useState<BulkRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  function handleSaveSingle() {
    if (!form.nombre.trim()) { toast({ title: "El nombre es obligatorio", variant: "destructive" }); return; }
    
    const numericPrecios: Record<string, number> = {};
    let hasPrice = false;
    Object.entries(form.precios).forEach(([id, p]) => {
      const val = Number(p.neto);
      if (!isNaN(val) && val > 0) {
        numericPrecios[id] = val;
        hasPrice = true;
      }
    });

    if (!hasPrice) { toast({ title: "Debes ingresar al menos un precio", variant: "destructive" }); return; }

    addItem({ 
      nombre: form.nombre, 
      precios: numericPrecios, 
      descripcion: form.descripcion, 
      categoria: form.categoria, 
      activo: true 
    });

    const resetPrecios: Record<string, { neto: string, conIva: string }> = {};
    listas.forEach(l => resetPrecios[l.id] = { neto: "", conIva: "" });
    setForm({ nombre: "", precios: resetPrecios, descripcion: "", categoria: defaultCat });
    onOpenChange(false);
  }

  function handlePriceChangeSingle(listaId: string, val: string) {
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

  function handlePriceWithIvaChangeSingle(listaId: string, val: string) {
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

  function updateRow(index: number, field: string, value: string, listaId?: string) {
    setRows(prev => prev.map((r, i) => {
      if (i !== index) return r;
      if (listaId) {
        return { ...r, precios: { ...r.precios, [listaId]: value } };
      }
      return { ...r, [field as keyof BulkRow]: value } as BulkRow;
    }));
  }

  function validateAndSave(data: BulkRow[]): number {
    const errs: string[] = [];
    const valid: { nombre: string, precios: Record<string, number>, descripcion: string, categoria: string }[] = [];
    
    data.forEach((r, i) => {
      if (!r.nombre.trim()) { errs.push(`Fila ${i + 1}: nombre vacío`); return; }
      
      const numericPrecios: Record<string, number> = {};
      let hasPrice = false;
      Object.entries(r.precios).forEach(([id, val]) => {
        const p = Number(val);
        if (!isNaN(p) && p > 0) {
          numericPrecios[id] = p;
          hasPrice = true;
        }
      });

      if (!hasPrice) { errs.push(`Fila ${i + 1}: debe tener al menos un precio válido`); return; }
      
      valid.push({ nombre: r.nombre, precios: numericPrecios, descripcion: r.descripcion, categoria: r.categoria });
    });

    setErrors(errs);
    valid.forEach(r => addItem({ ...r, activo: true }));
    return valid.length;
  }

  function handleSaveManual() {
    const nonEmpty = rows.filter(r => r.nombre.trim() || Object.values(r.precios).some(v => v.trim()));
    if (nonEmpty.length === 0) { toast({ title: "No hay filas para guardar", variant: "destructive" }); return; }
    const count = validateAndSave(nonEmpty);
    if (count > 0) {
      toast({ title: `${count} item(s) agregado(s) ✓` });
      setRows([emptyRow(defaultCat, listas), emptyRow(defaultCat, listas), emptyRow(defaultCat, listas)]);
      if (count === nonEmpty.length) onOpenChange(false);
    }
  }

  function handleSaveImported() {
    if (importedRows.length === 0) return;
    const count = validateAndSave(importedRows);
    if (count > 0) {
      toast({ title: `${count} item(s) importado(s) ✓` });
      setImportedRows([]);
      if (count === importedRows.length) onOpenChange(false);
    }
  }

  function parseCategoriaFromString(val: string): string {
    const lower = val?.toLowerCase().trim() || "";
    const match = categorias.find(c => lower.includes(c.toLowerCase().slice(0, 4)));
    return match || defaultCat;
  }

  const findColumn = (row: any, names: string[]) => {
    const rowKeys = Object.keys(row);
    // 1. Try exact match (normalized)
    let key = rowKeys.find(k => names.some(n => k.toLowerCase().trim() === n.toLowerCase().trim()));
    if (key) return String(row[key]);

    // 2. Try partial match
    key = rowKeys.find(k => names.some(n => {
      const normalizedK = k.toLowerCase().trim();
      const normalizedN = n.toLowerCase().trim();
      return normalizedK.includes(normalizedN) || normalizedN.includes(normalizedK);
    }));
    
    return key ? String(row[key]) : null;
  };

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", codepage: 65001 });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false });

        const parsed: BulkRow[] = json.map(row => {
          const nombre = findColumn(row, ["Item", "Artículo", "Servicio", "nombre", "Nombre", "articulo"]) || "";
          const descripcion = findColumn(row, ["Descripción", "descripcion", "Descripcion", "Detalle"]) || "";
          const catRaw = findColumn(row, ["Categoría", "categoria", "Categoria"]) || "";
          
          const rowPrecios: Record<string, string> = {};
          listas.forEach(l => {
            const val = findColumn(row, [l.nombre, `Precio ${l.nombre}`, l.nombre.replace(" ", "_"), `precio_${l.id}`]);
            if (val) {
              rowPrecios[l.id] = val.replace(/[^0-9.,]/g, "").replace(",", ".");
            } else if (l.es_default) {
              const defVal = findColumn(row, ["Precio", "precio", "Precio (Neto)", "precio_neto"]);
              if (defVal) rowPrecios[l.id] = defVal.replace(/[^0-9.,]/g, "").replace(",", ".");
            }
          });

          return { 
            nombre, 
            precios: rowPrecios,
            descripcion, 
            categoria: parseCategoriaFromString(catRaw || nombre) 
          };
        }).filter(r => r.nombre);

        setImportedRows(parsed);
        setErrors([]);
        toast({ title: `${parsed.length} fila(s) leídas del archivo` });
      } catch (err) {
        console.error(err);
        toast({ title: "Error al leer el archivo", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  function downloadTemplate() {
    const headers = ["Item", ...listas.map(l => `Precio ${l.nombre} (Neto)`), "Descripción", "Categoría"];
    const examplePrecios = listas.map(l => l.es_default ? "3800" : "3200");
    
    const ws = XLSX.utils.aoa_to_sheet([
      headers,
      ["Neumático 185/65R15 Pirelli", ...examplePrecios, "Pirelli P1", "Neumáticos"],
      ["Alineación y balanceo", "2500", ...listas.slice(1).map(() => "2000"), "Combo 4 ruedas", "Mecánica"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Items");
    XLSX.writeFile(wb, "plantilla_items.xlsx");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Agregar artículos
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="individual">
          <TabsList className="w-full">
            <TabsTrigger value="individual" className="flex-1 gap-1.5"><Plus className="h-4 w-4" /> Individual</TabsTrigger>
            <TabsTrigger value="manual" className="flex-1 gap-1.5"><Plus className="h-4 w-4" /> Carga masiva</TabsTrigger>
            <TabsTrigger value="excel" className="flex-1 gap-1.5"><FileSpreadsheet className="h-4 w-4" /> Importar Excel</TabsTrigger>
          </TabsList>

          {/* Individual */}
          <TabsContent value="individual" className="space-y-4 mt-4">
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
                      onChange={e => handlePriceChangeSingle(l.id, e.target.value)} 
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
                      onChange={e => handlePriceWithIvaChangeSingle(l.id, e.target.value)} 
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

            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSaveSingle}>Agregar</Button>
            </DialogFooter>
          </TabsContent>

          {/* Manual bulk */}
          <TabsContent value="manual" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">Completa los datos en la tabla. Solo se guardarán las filas con nombre y al menos un precio.</p>
            <div className="overflow-x-auto border rounded-md">
              <div className="min-w-[800px] p-2 space-y-2">
                <div className="grid gap-2 items-center px-1 text-[10px] uppercase font-bold text-muted-foreground" style={{ gridTemplateColumns: `1fr ${listas.map(() => "80px").join(" ")} 1fr 120px 32px` }}>
                  <span>Nombre</span>
                  {listas.map(l => <span key={l.id} className="text-right" title={l.nombre}>{l.nombre.slice(0, 6)}..</span>)}
                  <span>Descripción</span>
                  <span>Categoría</span>
                  <span></span>
                </div>
                {rows.map((row, i) => (
                  <div key={i} className="grid gap-2 items-center" style={{ gridTemplateColumns: `1fr ${listas.map(() => "80px").join(" ")} 1fr 120px 32px` }}>
                    <Input placeholder="Nombre" value={row.nombre} onChange={e => updateRow(i, "nombre", e.target.value)} className="text-xs h-8" />
                    {listas.map(l => (
                      <Input 
                        key={l.id}
                        type="number" 
                        placeholder="$" 
                        value={row.precios[l.id] || ""} 
                        onChange={e => updateRow(i, "precios", e.target.value, l.id)} 
                        className="text-xs h-8 text-right px-1" min={0} 
                      />
                    ))}
                    <Input placeholder="Desc." value={row.descripcion} onChange={e => updateRow(i, "descripcion", e.target.value)} className="text-xs h-8" />
                    <Select value={row.categoria} onValueChange={v => updateRow(i, "categoria", v)}>
                      <SelectTrigger className="text-xs h-8 px-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => setRows(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive h-7 w-7">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setRows(prev => [...prev, emptyRow(defaultCat, listas)])} className="w-full gap-1">
                  <Plus className="h-4 w-4" /> Agregar fila
                </Button>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSaveManual}>Guardar todo ({rows.length})</Button>
            </DialogFooter>
          </TabsContent>

          {/* Excel import */}
          <TabsContent value="excel" className="space-y-4 mt-4">
            <div className="bg-primary/5 p-3 rounded-md border border-primary/20 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" /> Importación Multi-Lista
              </p>
              <p className="text-xs text-muted-foreground">
                El sistema detectará automáticamente columnas con los nombres de tus listas (ej: <strong>{listas.map(l => l.nombre).join(", ")}</strong>).
                Los precios deben ser <strong>Netos</strong>. La primera columna debe ser <strong>Item</strong> o <strong>Artículo</strong>.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-1.5">
                <Upload className="h-4 w-4" /> Seleccionar archivo
              </Button>
              <Button variant="secondary" onClick={downloadTemplate} className="gap-1.5">
                <FileSpreadsheet className="h-4 w-4" /> Descargar plantilla
              </Button>
              <input type="file" ref={fileRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
            </div>

            {importedRows.length > 0 && (
              <div className="space-y-4">
                <div className="border rounded-md overflow-hidden overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 font-semibold min-w-[150px]">Artículo</th>
                        {listas.map(l => (
                          <th key={l.id} className="text-right p-2 font-semibold whitespace-nowrap">{l.nombre}</th>
                        ))}
                        <th className="text-left p-2 font-semibold min-w-[120px]">Categoría</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importedRows.map((r, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-2 truncate max-w-[200px]" title={r.nombre}>{r.nombre}</td>
                          {listas.map(l => (
                            <td key={l.id} className="p-2 text-right tabular-nums">
                              {r.precios[l.id] ? `$${Number(r.precios[l.id]).toLocaleString("es-UY")}` : "-"}
                            </td>
                          ))}
                          <td className="p-2">{r.categoria}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {errors.length > 0 && (
                  <div className="bg-destructive/10 p-3 rounded-md text-destructive text-xs space-y-1">
                    <p className="font-bold">Se encontraron errores:</p>
                    {errors.slice(0, 5).map((e, i) => <p key={i}>• {e}</p>)}
                    {errors.length > 5 && <p>...y {errors.length - 5} errores más.</p>}
                  </div>
                )}

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setImportedRows([])}>Cancelar importación</Button>
                  <Button onClick={handleSaveImported}>Importar {importedRows.length} artículos</Button>
                </DialogFooter>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
