import logoCp from "@/assets/logo-cp.png";
import { MapPin, Phone, MessageCircle } from "lucide-react";

const WHATSAPP = "59823574747";
const MAPS_URL = "https://maps.google.com/?q=Bvr.+José+Batlle+y+Ordóñez+5930,+Montevideo,+Uruguay";

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container flex items-center justify-between py-3 gap-4">
        <div className="flex items-center gap-3">
          <img src={logoCp} alt="D&B Repuestos" className="h-10 w-10 rounded-md bg-primary-foreground/10 object-contain" />
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight">D&B Repuestos</h1>
            <p className="text-xs text-primary-foreground/70 hidden sm:block">Sayago, Montevideo</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-md px-2 py-1.5 text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Ubicación</span>
          </a>
          <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-md px-2 py-1.5 text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <a href="tel:+59823574747" className="flex items-center gap-1 rounded-md px-2 py-1.5 text-primary-foreground/80 hover:bg-primary-foreground/10 transition-colors">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">23574747</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
