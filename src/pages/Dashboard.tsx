import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, Calendar, Users, Star, CheckCircle, Clock } from "lucide-react";
import { agendamentos, clientes, profissionais, servicos, receitaSemanal } from "@/data/mockData";
import { useState } from "react";

const kpis = [
  { label: "Receita do Mês", value: "R$ 18.420", change: "+12,4%", positive: true, icon: TrendingUp, color: "text-primary" },
  { label: "Agendamentos Hoje", value: "23", sub: "✓ 18 confirmados · ○ 5 pendentes", icon: Calendar, color: "text-teal-custom" },
  { label: "Novos Clientes", value: "47", change: "+8,1%", positive: true, icon: Users, color: "text-rose-custom" },
  { label: "Avaliação Média", value: "4,9", sub: "127 avaliações", icon: Star, color: "text-primary" },
];

const dias = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const horarios = ["09:00", "10:00", "11:00", "14:00", "15:00"];

const corMap: Record<string, string> = {
  gold: "border-l-primary bg-primary/10",
  teal: "border-l-teal-custom bg-teal-custom/10",
  rose: "border-l-rose-custom bg-rose-custom/10",
  purple: "border-l-purple-custom bg-purple-custom/10",
};

export default function Dashboard() {
  const [clienteTab, setClienteTab] = useState<"VIP" | "Frequentes" | "Novos">("VIP");

  const filteredClientes = clienteTab === "VIP"
    ? clientes.filter(c => c.status === "VIP")
    : clienteTab === "Frequentes"
    ? clientes.filter(c => c.visitas >= 10)
    : clientes.filter(c => c.visitas <= 6);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className={`rounded-xl border border-border bg-card p-5 card-hover animate-fadeInUp stagger-${i + 1}`}
            style={{ opacity: 0 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text2">{kpi.label}</p>
                <p className="mt-1 font-display text-3xl font-bold text-foreground">{kpi.value}</p>
                {kpi.change && (
                  <p className={`mt-1 text-sm font-medium ${kpi.positive ? "text-green-custom" : "text-destructive"}`}>
                    {kpi.change}
                  </p>
                )}
                {kpi.sub && <p className="mt-1 text-xs text-text3">{kpi.sub}</p>}
              </div>
              <div className={`rounded-lg bg-surface2 p-2.5 ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agenda + Clientes */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Weekly Schedule */}
        <div className="col-span-1 xl:col-span-2 rounded-xl border border-border bg-card p-5 card-hover">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Agenda Semanal</h3>
          <div className="overflow-x-auto">
            <div className="grid min-w-[600px]" style={{ gridTemplateColumns: "60px repeat(5, 1fr)" }}>
              {/* Header */}
              <div />
              {dias.map((d, i) => (
                <div key={d} className={`py-2 text-center text-sm font-semibold ${i === 0 ? "text-primary" : "text-text2"}`}>
                  {d}
                  {i === 0 && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />}
                </div>
              ))}
              {/* Rows */}
              {horarios.map((h) => (
                <>
                  <div key={h} className="flex items-center text-xs text-text3 pr-2">{h}</div>
                  {dias.map((d) => {
                    const ag = agendamentos.find(a => a.dia === d && a.hora === h);
                    return (
                      <div key={`${d}-${h}`} className="p-1">
                        {ag ? (
                          <div className={`rounded-lg border-l-[3px] px-2.5 py-2 text-xs ${corMap[ag.cor]}`}>
                            <p className="font-medium text-foreground">{ag.clienteNome}</p>
                            <p className="text-text3">{ag.servico}</p>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-border/50 px-2.5 py-3 text-center text-[10px] text-text3 hover:border-primary/30 hover:text-primary cursor-pointer transition-colors">
                            +
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>

        {/* Clientes em Destaque */}
        <div className="rounded-xl border border-border bg-card p-5 card-hover">
          <h3 className="font-display text-lg font-semibold text-foreground mb-3">Clientes em Destaque</h3>
          <div className="flex gap-1 mb-4">
            {(["VIP", "Frequentes", "Novos"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setClienteTab(tab)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  clienteTab === tab
                    ? "bg-primary/20 text-primary"
                    : "text-text3 hover:text-foreground hover:bg-surface2"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredClientes.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg bg-surface2 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gold-gradient text-xs font-bold text-primary-foreground">
                  {c.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{c.nome}</p>
                  <p className="text-xs text-text3">{c.ultimoServico}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">R$ {c.totalGasto.toLocaleString()}</p>
                  <p className="text-[11px] text-text3">{c.visitas} visitas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Receita por Semana */}
        <div className="rounded-xl border border-border bg-card p-5 card-hover">
          <h3 className="font-display text-base font-semibold text-foreground mb-4">Receita por Semana</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={receitaSemanal}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(270 22% 20%)" />
              <XAxis dataKey="semana" tick={{ fill: "hsl(270 20% 48%)", fontSize: 12 }} axisLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(270 18% 8%)", border: "1px solid hsl(270 22% 20%)", borderRadius: 8, color: "hsl(270 60% 95%)" }}
              />
              <Bar dataKey="valor" fill="hsl(38 50% 61%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="meta" fill="hsl(183 50% 60%)" radius={[6, 6, 0, 0]} opacity={0.3} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Serviços Mais Populares */}
        <div className="rounded-xl border border-border bg-card p-5 card-hover">
          <h3 className="font-display text-base font-semibold text-foreground mb-4">Serviços Mais Populares</h3>
          <div className="space-y-3">
            {servicos.slice(0, 5).map((s, i) => (
              <div key={s.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-text2">{i + 1}. {s.nome}</span>
                  <span className="text-text3">{s.contagem}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface2">
                  <div
                    className="h-full rounded-full gold-gradient"
                    style={{ width: `${(s.contagem / 142) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Profissionais */}
        <div className="rounded-xl border border-border bg-card p-5 card-hover">
          <h3 className="font-display text-base font-semibold text-foreground mb-4">Performance</h3>
          <div className="space-y-3">
            {profissionais.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg bg-surface2 p-3">
                <span className="text-2xl">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{p.nome}</p>
                  <p className="text-xs text-text3">{p.atendimentos} atendimentos</p>
                </div>
                <p className="text-sm font-semibold text-green-custom">R$ {p.receita.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
