import { createContext, useContext, useState, ReactNode } from "react";
import { clientes as clientesIniciais } from "@/data/mockData";

export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  ultimoServico: string;
  ultimaVisita: string;
  totalGasto: number;
  visitas: number;
  status: "VIP" | "Ativo" | "Em risco" | "Inativo";
  aniversario: string;
  pontos: number;
  avatar: string;
  // Novos campos
  genero?: string;
  profissao?: string;
  dataNascimento?: string;
  bi?: string;
  observacoes?: string;
}

interface ClientesContextType {
  clientesList: Cliente[];
  addCliente: (cliente: Omit<Cliente, "id" | "avatar" | "totalGasto" | "visitas" | "pontos" | "ultimoServico" | "ultimaVisita" | "status">) => void;
  removeCliente: (id: number) => void;
  getCliente: (id: number) => Cliente | undefined;
}

const ClientesContext = createContext<ClientesContextType | null>(null);

export function ClientesProvider({ children }: { children: ReactNode }) {
  const [clientesList, setClientesList] = useState<Cliente[]>(clientesIniciais as Cliente[]);

  const addCliente = (dados: Omit<Cliente, "id" | "avatar" | "totalGasto" | "visitas" | "pontos" | "ultimoServico" | "ultimaVisita" | "status">) => {
    const nomes = dados.nome.trim().split(" ");
    const avatar = nomes.length >= 2
      ? (nomes[0][0] + nomes[nomes.length - 1][0]).toUpperCase()
      : dados.nome.slice(0, 2).toUpperCase();

    const novo: Cliente = {
      ...dados,
      id: Date.now(),
      avatar,
      totalGasto: 0,
      visitas: 0,
      pontos: 0,
      ultimoServico: "—",
      ultimaVisita: "—",
      status: "Ativo",
    };
    setClientesList((prev) => [novo, ...prev]);
  };

  const removeCliente = (id: number) => {
    setClientesList((prev) => prev.filter((c) => c.id !== id));
  };

  const getCliente = (id: number) => clientesList.find((c) => c.id === id);

  return (
    <ClientesContext.Provider value={{ clientesList, addCliente, removeCliente, getCliente }}>
      {children}
    </ClientesContext.Provider>
  );
}

export function useClientes() {
  const ctx = useContext(ClientesContext);
  if (!ctx) throw new Error("useClientes must be used within ClientesProvider");
  return ctx;
}
