import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Role = "manager" | "empleado";

export interface Perfil {
  id: string;
  tenant_id: string;
  role: Role;
  email: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  perfil: Perfil | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener la sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPerfil(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // 2. Escuchar cambios de autenticación (Login / Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPerfil(session.user.id);
      } else {
        setPerfil(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchPerfil(userId: string) {
    try {
      const { data, error } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error) throw error;
      setPerfil(data as Perfil);
    } catch (error) {
      console.error("Error al cargar perfil:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    perfil,
    isLoading,
    signOut,
    isManager: perfil?.role === "manager",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
