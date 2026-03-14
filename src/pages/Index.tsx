import { useState, useCallback } from "react";
import { Item, QuoteItem } from "@/lib/data";
import Header from "@/components/Header";
import PriceTable from "@/components/PriceTable";
import QuoteCalculator from "@/components/QuoteCalculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, DollarSign } from "lucide-react";

export default function Index() {
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

  const addToQuote = useCallback((item: Item) => {
    setQuoteItems(prev => {
      const existing = prev.find(p => p.id === item.id);
      if (existing) {
        return prev.map(p => p.id === item.id ? { ...p, cantidad: p.cantidad + 1 } : p);
      }
      return [...prev, { ...item, cantidad: 1 }];
    });
  }, []);

  const removeFromQuote = useCallback((id: string) => {
    setQuoteItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setQuoteItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const newQty = Math.max(1, item.cantidad + delta);
      return { ...item, cantidad: newQty };
    }));
  }, []);

  const setQuantity = useCallback((id: string, qty: number) => {
    setQuoteItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, cantidad: Math.max(1, qty) };
    }));
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
              <QuoteCalculator 
                items={quoteItems} 
                onRemove={removeFromQuote} 
                onUpdateQuantity={updateQuantity} 
                onSetQuantity={setQuantity}
                onClear={() => setQuoteItems([])} 
              />
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
            <QuoteCalculator 
              items={quoteItems} 
              onRemove={removeFromQuote} 
              onUpdateQuantity={updateQuantity} 
              onSetQuantity={setQuantity}
              onClear={() => setQuoteItems([])} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}
