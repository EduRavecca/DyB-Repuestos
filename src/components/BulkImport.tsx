import { useState, useRef } from "react";
import { Servicio, Categoria, CATEGORIAS } from "@/lib/data";
import { useServicios } from "@/hooks/useServicios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Plus, Trash2, FileSpreadsheet, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface BulkRow {
  nombre: string;
  precio: string;
  descripcion: string;
  categoria: Categoria;
}

const emptyRow = (): BulkRow => ({ nombre: "", precio: "", descripcion: "", categoria: "Neumáticos" });

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BulkImport({ open, onOpenChange }: Props) {
  const { addServicio } = useServicios();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<BulkRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  const [importedRows, setImportedRows] = useState<BulkRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  function updateRow(index: number, field: keyof BulkRow, value: string) {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  }

  function addRow() {
    setRows(prev => [...prev, emptyRow()]);
  }

  function removeRow(index: number) {
    setRows(prev => prev.filter((_, i) => i !== index));
  }

  function validateAndSave(data: BulkRow[]): number {
    const errs: string[] = [];
    const valid: BulkRow[] = [];
    data.forEach((r, i) => {
      if (!r.nombre.trim()) { errs.push(`Fila ${i + 1}: nombre vacío`); return; }
      const precio = Number(r.precio);
      if (isNaN(precio) || precio <= 0) { errs.push(`Fila ${i + 1}: precio inválido`); return; }
      if (!CATEGORIAS.includes(r.categoria)) { errs.push(`Fila ${i + 1}: categoría inválida`); return; }
      valid.push(r);
    });
    setErrors(errs);
    valid.forEach(r => addServicio({ nombre: r.nombre, precio: Number(r.precio), descripcion: r.descripcion, categoria: r.categoria, activo: true }));
    return valid.length;
  }

  function handleSaveManual() {
    const nonEmpty = rows.filter(r => r.nombre.trim() || r.precio.trim());
    if (nonEmpty.length === 0) { toast({ title: "No hay filas para guardar", variant: "destructive" }); return; }
    const count = validateAndSave(nonEmpty);
    if (count > 0) {
      toast({ title: `${count} servicio(s) agregado(s) ✓` });
      setRows([emptyRow(), emptyRow(), emptyRow()]);
      if (count === nonEmpty.length) onOpenChange(false);
    }
  }

  function handleSaveImported() {
    if (importedRows.length === 0) return;
    const count = validateAndSave(importedRows);
    if (count > 0) {
      toast({ title: `${count} servicio(s) importado(s) desde archivo ✓` });
      setImportedRows([]);
      if (count === importedRows.length) onOpenChange(false);
    }
  }

  function parseCategoriaFromString(val: string): Categoria {
    const lower = val?.toLowerCase().trim() || "";
    if (lower.includes("neum")) return "Neumáticos";
    if (lower.includes("mec") || lower.includes("aline") || lower.includes("balanc")) return "Mecánica";
    if (lower.includes("aceit") || lower.includes("filtro") || lower.includes("lubric")) return "Aceites";
    return "Neumáticos";
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
        toast({ title: "Error al leer el archivo", description: "Asegurate de que sea un Excel o CSV válido.", variant: "destructive" });
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
            <Upload className="h-5 w-5" /> Carga masiva de servicios
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual">
          <TabsList className="w-full">
            <TabsTrigger value="manual" className="flex-1 gap-1.5"><Plus className="h-4 w-4" /> Manual</TabsTrigger>
            <TabsTrigger value="excel" className="flex-1 gap-1.5"><FileSpreadsheet className="h-4 w-4" /> Importar Excel/CSV</TabsTrigger>
          </TabsList>

          {/* Manual bulk entry */}
          <TabsContent value="manual" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">Completá las filas y hacé clic en "Guardar todo". Podés agregar las filas que necesites.</p>
            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_1fr_120px_32px] gap-2 items-center">
                  <Input placeholder="Nombre" value={row.nombre} onChange={e => updateRow(i, "nombre", e.target.value)} className="text-sm" />
                  <Input type="number" placeholder="$" value={row.precio} onChange={e => updateRow(i, "precio", e.target.value)} className="text-sm" min={1} />
                  <Input placeholder="Descripción" value={row.descripcion} onChange={e => updateRow(i, "descripcion", e.target.value)} className="text-sm" />
                  <Select value={row.categoria} onValueChange={v => updateRow(i, "categoria", v)}>
                    <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => removeRow(i)} className="text-destructive h-8 w-8"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addRow} className="gap-1"><Plus className="h-3.5 w-3.5" /> Agregar fila</Button>

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

          {/* Excel/CSV import */}
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
