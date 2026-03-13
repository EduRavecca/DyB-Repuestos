import { useState, useCallback } from "react";
import { Servicio } from "@/lib/data";
import Header from "@/components/Header";
import PriceTable from "@/components/PriceTable";
import QuoteCalculator from "@/components/QuoteCalculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, DollarSign } from "lucide-react";

export default function Index() {
  const [quoteItems, setQuoteItems] = useState<Servicio[]>([]);

  const addToQuote = useCallback((s: Servicio) => {
    setQuoteItems(prev => {
      if (prev.find(p => p.id === s.id)) return prev;
      return [...prev, s];
    });
  }, []);

  const removeFromQuote = useCallback((id: string) => {
    setQuoteItems(prev => prev.filter(s => s.id !== id));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-6">
        {/* Mobile: tabs */}
        <div className="md:hidden">
          <Tabs defaultValue="precios">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="precios" className="flex-1 gap-1.5"><ClipboardList className="h-4 w-4" /> Precios</TabsTrigger>
              <TabsTrigger value="presupuesto" className="flex-1 gap-1.5">
                <DollarSign className="h-4 w-4" /> Presupuesto
                {quoteItems.length > 0 && <span className="ml-1 bg-accent text-accent-foreground text-xs rounded-full px-1.5">{quoteItems.length}</span>}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="precios">
              <PriceTable onSelectForQuote={addToQuote} />
            </TabsContent>
            <TabsContent value="presupuesto">
              <QuoteCalculator items={quoteItems} onRemove={removeFromQuote} onClear={() => setQuoteItems([])} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop: side by side */}
        <div className="hidden md:grid md:grid-cols-[1fr_380px] gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Lista de Precios</h2>
            <PriceTable onSelectForQuote={addToQuote} />
          </div>
          <div className="sticky top-6 self-start">
            <h2 className="text-2xl font-bold mb-4">Presupuesto</h2>
            <QuoteCalculator items={quoteItems} onRemove={removeFromQuote} onClear={() => setQuoteItems([])} />
          </div>
        </div>
      </main>
    </div>
  );
}
