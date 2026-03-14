import logoCp from "@/assets/dyb.png";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Users } from "lucide-react";
import { useState } from "react";
import UserManagement from "@/components/UserManagement";

export default function Header() {
  const { signOut, perfil, isManager } = useAuth();
  const [usersOpen, setUsersOpen] = useState(false);

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container flex items-center justify-between py-3 gap-4">
        <div className="flex items-center gap-3">
          <img src={logoCp} alt="D&B Repuestos" className="h-10 w-10 rounded-md bg-primary-foreground/10 object-contain" />
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight">D&B Repuestos</h1>
            {perfil && (
              <p className="text-xs text-primary-foreground/70 capitalize hidden md:block">
                Rol: {perfil.role}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isManager && (
            <Button variant="ghost" size="sm" onClick={() => setUsersOpen(true)} className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10 h-8 gap-2">
              <span className="hidden sm:inline">Equipo</span> <Users className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={signOut} className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10 h-8 gap-2">
            <span className="hidden sm:inline">Cerrar Sesión</span> <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <UserManagement open={usersOpen} onOpenChange={setUsersOpen} />
    </header>
  );
}
