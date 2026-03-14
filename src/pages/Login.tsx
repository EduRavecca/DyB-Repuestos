import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2, KeyRound } from "lucide-react";
import logoCp from "@/assets/dyb.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log(error);

      if (error) throw error;

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Credenciales incorrectas",
        variant: "destructive"
      });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm glass-card p-8 space-y-6 animate-fade-in shadow-xl border-t-4 border-t-primary">
        <div className="flex flex-col items-center gap-2">
          <div className="h-16 w-16 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
            <img src={logoCp} alt="Logo" className="h-12 w-12 object-contain drop-shadow-sm" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-center">Bienvenido</h1>
          <p className="text-sm text-muted-foreground text-center">
            Inicia sesión para acceder al sistema
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (
              <>
                <KeyRound className="mr-2 h-4 w-4" /> Ingresar
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
