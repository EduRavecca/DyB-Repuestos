import { useState } from "react";
import { QuoteItem, IVA_RATE, getPrice } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Copy, MessageCircle, FileText, Plus, Minus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';

interface Props {
  items: QuoteItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onSetQuantity: (id: string, qty: number) => void;
  onClear: () => void;
}

export default function QuoteCalculator({ items, onRemove, onUpdateQuantity, onSetQuantity, onClear }: Props) {
  const [cliente, setCliente] = useState("");
  const [vehiculo, setVehiculo] = useState("");
  const [telefono, setTelefono] = useState<string | undefined>("");

  const subtotal = items.reduce((acc, item) => acc + (getPrice(item) * item.cantidad), 0);
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
      ...items.map(item => {
        const p = getPrice(item);
        const itemTotal = p * item.cantidad;
        return `• ${item.cantidad}x ${item.nombre} — $${itemTotal.toLocaleString("es-UY")}${item.cantidad > 1 ? ` ($${p.toLocaleString("es-UY")} c/u)` : ""}`;
      }),
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
    if (!telefono) {
      toast({ title: "Error", description: "Ingresa un número de teléfono para enviar por WhatsApp", variant: "destructive" });
      return;
    }
    const cleanPhone = telefono.replace(/\+/g, "");
    const text = encodeURIComponent(buildText());
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  }

  function clearClientData() {
    setCliente("");
    setVehiculo("");
    setTelefono("");
    toast({ title: "Datos del cliente borrados" });
  }

  if (items.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground border-dashed">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Seleccioná artículos de la lista para armar un presupuesto.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Presupuesto</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={clearClientData} className="text-muted-foreground h-8">Limpiar Datos</Button>
          <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground h-8 hover:text-destructive">Vaciar Lista</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input placeholder="Nombre del cliente" value={cliente} onChange={e => setCliente(e.target.value)} />
        <Input placeholder="Vehículo (ej. VW Gol 2018)" value={vehiculo} onChange={e => setVehiculo(e.target.value)} />
        <div className="sm:col-span-2">
          <PhoneInput
            defaultCountry="UY"
            placeholder="Número de teléfono"
            value={telefono}
            onChange={setTelefono}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between text-sm py-2 px-2 rounded-md bg-muted/50 border">
            <div className="flex-1 min-w-0 mr-2">
              <p className="font-medium truncate">{item.nombre}</p>
              <p className="text-[10px] text-muted-foreground">${getPrice(item).toLocaleString("es-UY")} c/u</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-background rounded-md border p-0.5">
                <button 
                  onClick={() => onUpdateQuantity(item.id, -1)}
                  className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <input 
                  type="number"
                  value={item.cantidad}
                  onChange={(e) => onSetQuantity(item.id, parseInt(e.target.value) || 1)}
                  className="w-8 text-center font-bold tabular-nums text-xs bg-transparent border-none p-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1"
                />
                <button 
                  onClick={() => onUpdateQuantity(item.id, 1)}
                  className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              
              <div className="flex items-center gap-2 min-w-[70px] justify-end">
                <span className="font-bold tabular-nums">${(getPrice(item) * item.cantidad).toLocaleString("es-UY")}</span>
                <button onClick={() => onRemove(item.id)} className="text-muted-foreground hover:text-destructive transition-colors"><X className="h-4 w-4" /></button>
              </div>
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
