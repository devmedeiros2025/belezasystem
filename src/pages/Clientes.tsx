import { useState } from "react";
import { clientes } from "@/data/mockData";
import { Search, Users, UserCheck, TrendingUp, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrency } from "@/hooks/useCurrency";

type Filter = "Todos" | "VIP" | "Ativos" | "Inativos" | "Em risco";

const statusStyle: Record<string, string> = {
  VIP: "badge-vip",
  Ativo: "badge-active",
  "Em risco": "badge-risk",
  Inativo: "badge-inactive",
};

export default function Clientes() {
  const [filter, setFilter] = useState<Filter>("Todos");
  const [search, setSearch] = useState("");
  const { format } = useCurrency();

  const metrics = [
    { label: "Total", value: "384", icon: Users, color: "text-primary" },
    { label: "Ativos este mês", value: "127", icon: UserCheck, color: "text-green-custom" },
    { label: "Taxa de retorno", value: "68%", icon: TrendingUp, color: "text-teal-custom" },
    { label: "Ticket médio", value: format(147), icon: DollarSign, color: "text-primary" },
  ];

  const filtered = clientes.filter((c) => {
    if (search && !c.nome.toLowerCase().includes(search.toLowerCase()) && !c.telefone.includes(search)) return false;
    if (filter === "Todos") return true;
    if (filter === "VIP") return c.status === "VIP";
    if (filter === "Ativos") return c.status === "Ativo";
    if (filter === "Em risco") return c.status === "Em risco";
    return false;
  });

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-4 card-hover">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-surface2 p-2 ${m.color}`}><m.icon className="h-4 w-4" /></div>
              <div>
                <p className="text-xs text-text3">{m.label}</p>
                <p className="font-display text-xl font-bold text-foreground">{m.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="w-full rounded-lg border border-border bg-input pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-text3 focus:border-primary/50 focus:outline-none"
          />
        </div>
        <div className="flex gap-1">
          {(["Todos", "VIP", "Ativos", "Em risco"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? "bg-primary/20 text-primary" : "text-text3 hover:text-foreground hover:bg-surface2"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text3">
              <th className="p-4">Cliente</th>
              <th className="p-4 hidden md:table-cell">Telefone</th>
              <th className="p-4 hidden lg:table-cell">Último Serviço</th>
              <th className="p-4 hidden lg:table-cell">Última Visita</th>
              <th className="p-4">Total Gasto</th>
              <th className="p-4 hidden md:table-cell">Visitas</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                <td className="p-4">
                  <Link to={`/clientes/${c.id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gold-gradient text-xs font-bold text-primary-foreground">
                      {c.avatar}
                    </div>
                    <span className="font-medium text-foreground">{c.nome}</span>
                  </Link>
                </td>
                <td className="p-4 text-text2 hidden md:table-cell">{c.telefone}</td>
                <td className="p-4 text-text2 hidden lg:table-cell">{c.ultimoServico}</td>
                <td className="p-4 text-text3 hidden lg:table-cell">{c.ultimaVisita}</td>
                <td className="p-4 font-semibold text-foreground">{format(c.totalGasto)}</td>
                <td className="p-4 text-text2 hidden md:table-cell">{c.visitas}</td>
                <td className="p-4">
                  <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyle[c.status]}`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
