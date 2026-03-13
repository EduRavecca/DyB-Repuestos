import { useState } from "react";
import { Servicio, IVA_RATE } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Copy, MessageCircle, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const WHATSAPP = "59823574747";

interface Props {
  items: Servicio[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function QuoteCalculator({ items, onRemove, onClear }: Props) {
  const [cliente, setCliente] = useState("");
  const [vehiculo, setVehiculo] = useState("");

  const subtotal = items.reduce((acc, s) => acc + s.precio, 0);
  const iva = Math.round(subtotal * IVA_RATE);
  const total = subtotal + iva;

  function buildText() {
    const lines = [
      `*D&B Repuestos — Presupuesto*`,
      `📍 Bvr. Batlle y Ordóñez 5930, Sayago`,
      `📞 23574747`,
      "",
      cliente && `👤 Cliente: ${cliente}`,
      vehiculo && `🚗 Vehículo: ${vehiculo}`,
      "",
      ...items.map(s => `• ${s.nombre} — $${s.precio.toLocaleString("es-UY")}`),
      "",
      `Subtotal: $${subtotal.toLocaleString("es-UY")}`,
      `IVA (22%): $${iva.toLocaleString("es-UY")}`,
      `*TOTAL: $${total.toLocaleString("es-UY")}*`,
      "",
      `_Precios sujetos a cambio sin previo aviso._`,
    ].filter(Boolean).join("\n");
    return lines;
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(buildText());
    toast({ title: "Presupuesto copiado al portapapeles ✓" });
  }

  function sendWhatsApp() {
    const text = encodeURIComponent(buildText());
    window.open(`https://wa.me/${WHATSAPP}?text=${text}`, "_blank");
  }

  if (items.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground border-dashed">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Seleccioná servicios de la lista para armar un presupuesto.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Presupuesto</h3>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">Limpiar</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input placeholder="Nombre del cliente" value={cliente} onChange={e => setCliente(e.target.value)} />
        <Input placeholder="Vehículo (ej. VW Gol 2018)" value={vehiculo} onChange={e => setVehiculo(e.target.value)} />
      </div>

      <div className="space-y-2">
        {items.map(s => (
          <div key={s.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-md bg-muted/50">
            <span>{s.nombre}</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold tabular-nums">${s.precio.toLocaleString("es-UY")}</span>
              <button onClick={() => onRemove(s.id)} className="text-muted-foreground hover:text-destructive transition-colors"><X className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-3 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">${subtotal.toLocaleString("es-UY")}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">IVA (22%)</span><span className="tabular-nums">${iva.toLocaleString("es-UY")}</span></div>
        <div className="flex justify-between text-lg font-bold pt-1"><span>Total</span><span className="tabular-nums">${total.toLocaleString("es-UY")}</span></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={copyToClipboard} variant="secondary" className="flex-1 gap-1.5">
          <Copy className="h-4 w-4" /> Copiar
        </Button>
        <Button onClick={sendWhatsApp} className="flex-1 gap-1.5 bg-success hover:bg-success/90 text-success-foreground">
          <MessageCircle className="h-4 w-4" /> Enviar por WhatsApp
        </Button>
      </div>
    </Card>
  );
}
