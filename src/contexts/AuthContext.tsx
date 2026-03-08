import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type Perfil = "Administrador" | "Financeiro" | "Colaborador";

type AppRole = "admin" | "financeiro" | "colaborador";

const roleToPerfilMap: Record<AppRole, Perfil> = {
  admin: "Administrador",
  financeiro: "Financeiro",
  colaborador: "Colaborador",
};

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  profissionalId?: string;
}

type Recurso =
  | "dashboard_completo"
  | "agenda_ver"
  | "agenda_editar_todos"
  | "clientes_ver"
  | "clientes_editar"
  | "financeiro_completo"
  | "comissoes"
  | "estoque"
  | "estoque_editar"
  | "fidelidade"
  | "avaliacoes"
  | "configuracoes"
  | "admin"
  | "criar_usuarios";

const permissoes: Record<Perfil, Recurso[]> = {
  Administrador: [
    "dashboard_completo", "agenda_ver", "agenda_editar_todos", "clientes_ver", "clientes_editar",
    "financeiro_completo", "comissoes", "estoque", "estoque_editar", "fidelidade", "avaliacoes",
    "configuracoes", "admin", "criar_usuarios"
  ],
  Financeiro: [
    "dashboard_completo", "agenda_ver", "clientes_ver", "financeiro_completo", "comissoes"
  ],
  Colaborador: [
    "agenda_ver", "clientes_ver", "clientes_editar", "estoque", "fidelidade", "avaliacoes"
  ],
};

interface AuthContextType {
  usuarioLogado: Usuario | null;
  perfil: Perfil | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => Promise<void>;
  podeAcessar: (recurso: Recurso) => boolean;
  criarUsuario: (email: string, senha: string, nome: string, role: AppRole) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchUserData(user: User): Promise<Usuario | null> {
  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Fetch role using security definer function
  const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: user.id });

  const role = (roleData as AppRole) || "colaborador";
  const perfil = roleToPerfilMap[role] || "Colaborador";

  return {
    id: user.id,
    nome: profile?.nome || user.email || "Usuário",
    email: user.email || "",
    perfil,
    ativo: profile?.ativo ?? true,
    profissionalId: profile?.profissional_id || undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Use setTimeout to avoid potential deadlocks with Supabase client
        setTimeout(async () => {
          const userData = await fetchUserData(session.user);
          setUsuarioLogado(userData);
          setLoading(false);
        }, 0);
      } else {
        setUsuarioLogado(null);
        setLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userData = await fetchUserData(session.user);
        setUsuarioLogado(userData);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, senha: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    return !error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUsuarioLogado(null);
  };

  const podeAcessar = (recurso: Recurso): boolean => {
    if (!usuarioLogado) return false;
    return permissoes[usuarioLogado.perfil].includes(recurso);
  };

  const criarUsuario = async (email: string, senha: string, nome: string, role: AppRole): Promise<boolean> => {
    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    });

    if (error || !data.user) return false;

    // Assign role (needs admin privileges - done via service role in edge function ideally)
    // For now, insert directly (RLS allows admins)
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: data.user.id, role });

    return !roleError;
  };

  return (
    <AuthContext.Provider value={{
      usuarioLogado,
      perfil: usuarioLogado?.perfil || null,
      loading,
      login,
      logout,
      podeAcessar,
      criarUsuario,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
