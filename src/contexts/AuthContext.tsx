import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Perfil = "Administrador" | "Financeiro" | "Colaborador";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
  ativo: boolean;
  criadoEm: string;
  ultimoAcesso?: string;
  profissionalId?: number;
}

export const usuarios: Usuario[] = [
  { id: 1, nome: "Élise Monteiro", email: "elise@studio.ao", senha: "admin123", perfil: "Administrador", ativo: true, criadoEm: "Jan 2024", ultimoAcesso: "Hoje 09:14" },
  { id: 2, nome: "Rodrigo Alves", email: "rodrigo@studio.ao", senha: "colab123", perfil: "Colaborador", ativo: true, criadoEm: "Mar 2024", ultimoAcesso: "Hoje 08:50", profissionalId: 2 },
  { id: 3, nome: "Patrícia Nunes", email: "patricia@studio.ao", senha: "colab123", perfil: "Colaborador", ativo: true, criadoEm: "Jun 2024", ultimoAcesso: "Ontem 17:32", profissionalId: 4 },
  { id: 4, nome: "Carlos Menezes", email: "carlos@studio.ao", senha: "fin123", perfil: "Financeiro", ativo: true, criadoEm: "Ago 2024", ultimoAcesso: "Hoje 08:50" },
  { id: 5, nome: "Camile Torres", email: "camile@studio.ao", senha: "colab123", perfil: "Colaborador", ativo: false, criadoEm: "Out 2024", profissionalId: 3 },
];

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
  login: (email: string, senha: string) => boolean;
  logout: () => void;
  podeAcessar: (recurso: Recurso) => boolean;
  usuariosList: Usuario[];
  setUsuariosList: React.Dispatch<React.SetStateAction<Usuario[]>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [usuariosList, setUsuariosList] = useState<Usuario[]>(usuarios);

  useEffect(() => {
    const saved = localStorage.getItem("beautycrm_user");
    if (saved) {
      const user = JSON.parse(saved);
      const found = usuariosList.find(u => u.id === user.id && u.ativo);
      if (found) setUsuarioLogado(found);
    }
  }, []);

  const login = (email: string, senha: string): boolean => {
    const user = usuariosList.find(u => u.email === email && u.senha === senha && u.ativo);
    if (user) {
      setUsuarioLogado(user);
      localStorage.setItem("beautycrm_user", JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUsuarioLogado(null);
    localStorage.removeItem("beautycrm_user");
  };

  const podeAcessar = (recurso: Recurso): boolean => {
    if (!usuarioLogado) return false;
    return permissoes[usuarioLogado.perfil].includes(recurso);
  };

  return (
    <AuthContext.Provider value={{
      usuarioLogado,
      perfil: usuarioLogado?.perfil || null,
      login,
      logout,
      podeAcessar,
      usuariosList,
      setUsuariosList,
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
