import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { useAuth, Perfil, Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Users, ShieldAlert, Loader2, Plus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserManagement({ open, onOpenChange }: Props) {
  const { isManager, perfil: currentUser, user: authUser } = useAuth();
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("empleado");
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open && isManager && currentUser?.tenant_id) {
      loadProfiles();
    }
  }, [open, isManager, currentUser?.tenant_id]);

  async function loadProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from("perfiles")
      .select("*")
      .eq("tenant_id", currentUser?.tenant_id)
      .order("email");

    if (error) {
      toast({ title: "Error al cargar usuarios", description: error.message, variant: "destructive" });
    } else {
      setPerfiles(data as Perfil[]);
    }
    setLoading(false);
  }

  async function updateRole(id: string, newRole: Role) {
    if (id === authUser?.id) {
      toast({ title: "No puedes cambiar tu propio rol", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("perfiles")
      .update({ role: newRole })
      .eq("id", id);

    if (error) {
      toast({ title: "Error al actualizar rol", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rol actualizado correctamente" });
      loadProfiles();
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    if (newPassword !== confirmPassword) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    setCreating(true);

    // Creamos un cliente temporal que NO guarde la sesión.
    // Esto previene que el Manager se desloguee al crear una cuenta nueva!
    const tempClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { error: signUpError } = await tempClient.auth.signUp({
      email: newEmail,
      password: newPassword,
      options: {
        data: {
          role: newRole,
          tenant_id: currentUser?.tenant_id,
        },
      },
    });

    if (signUpError) {
      toast({ title: "Error al crear usuario", description: signUpError.message, variant: "destructive" });
    } else {
      toast({ title: "Usuario creado correctamente" });
      setNewEmail("");
      setNewPassword("");
      setConfirmPassword("");
      setNewRole("empleado");
      // Damos 1 segundo para que el Trigger de base de datos insértese el perfil
      setTimeout(loadProfiles, 1000);
    }
    setCreating(false);
  }

  if (!isManager) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Gestión de Equipo y Roles
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleCreateUser} className="bg-muted/30 p-4 border rounded-md space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Plus className="h-4 w-4" /> Agregar Nuevo Usuario
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input 
                placeholder="Email del usuario" 
                type="email" 
                value={newEmail} 
                onChange={e => setNewEmail(e.target.value)} 
                required 
                disabled={creating}
              />
              <div className="relative">
                <Input 
                  placeholder="Contraseña (min 6)" 
                  type={showPassword ? "text" : "password"} 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required 
                  minLength={6}
                  disabled={creating}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              <div className="relative">
                <Input 
                  placeholder="Confirmar contraseña" 
                  type={showPassword ? "text" : "password"} 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  minLength={6}
                  disabled={creating}
                  className="pr-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)} disabled={creating}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empleado">Empleado</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={creating || !newEmail || !newPassword || !confirmPassword || newPassword !== confirmPassword}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear"}
                </Button>
              </div>
            </div>
          </form>

          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2.5 font-medium">Email / Usuario</th>
                  <th className="text-left p-2.5 font-medium">Rol Actual</th>
                  <th className="text-right p-2.5 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : perfiles.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-muted-foreground">No hay usuarios en este tenant.</td>
                  </tr>
                ) : (
                  perfiles.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="p-2.5">{p.email || "Usuario sin email"} {p.id === authUser?.id && <span className="text-xs text-primary font-medium ml-2">(Tú)</span>}</td>
                      <td className="p-2.5 capitalize">{p.role}</td>
                      <td className="p-2.5 text-right flex justify-end">
                        <Select 
                          disabled={p.id === authUser?.id}
                          value={p.role} 
                          onValueChange={(val) => updateRole(p.id, val as Role)}
                        >
                          <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="empleado">Empleado</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
