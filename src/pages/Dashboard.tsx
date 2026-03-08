import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, AreaChart, Area, Legend, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Calendar, Users, Star, CheckCircle, Clock, DollarSign, ArrowUpCircle, ArrowDownCircle, Receipt } from "lucide-react";
import { agendamentos, clientes, profissionais, servicos, receitaSemanal, avaliacoes } from "@/data/mockData";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/hooks/useCurrency";
import KanbanBoard from "@/components/KanbanBoard";

const dias = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const horarios = ["09:00", "10:00", "11:00", "14:00", "15:00"];

const corMap: Record<string, string> = {
  gold: "border-l-primary bg-primary/10",
  teal: "border-l-teal-custom bg-teal-custom/10",
  rose: "border-l-rose-custom bg-rose-custom/10",
  purple: "border-l-purple-custom bg-purple-custom/10",
};

function DashboardCompleto() {
  const [clienteTab, setClienteTab] = useState<"VIP" | "Frequentes" | "Novos">("VIP");
  const { format } = useCurrency();

  const filteredClientes = clienteTab === "VIP"
    ? clientes.filter(c => c.status === "VIP")
    : clienteTab === "Frequentes"
    ? clientes.filter(c => c.visitas >= 10)
    : clientes.filter(c => c.visitas <= 6);

  const kpis = [
    { label: "Receita do Mês", value: format(18420), change: "+12,4%", positive: true, icon: TrendingUp, color: "text-primary" },
    { label: "Agendamentos Hoje", value: "23", sub: "✓ 18 confirmados · ○ 5 pendentes", icon: Calendar, color: "text-teal-custom" },
    { label: "Novos Clientes", value: "47", change: "+8,1%", positive: true, icon: Users, color: "text-rose-custom" },
    { label: "Avaliação Média", value: "4,9", sub: "127 avaliações", icon: Star, color: "text-primary" },
  ];

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

      {/* Tendência Mensal & Comparativo */}
      {(() => {
        const tendenciaMensal = [
          { mes: "Out", receita: 14200, clientes: 32, agendamentos: 185, ticketMedio: 195 },
          { mes: "Nov", receita: 15800, clientes: 38, agendamentos: 210, ticketMedio: 210 },
          { mes: "Dez", receita: 19500, clientes: 45, agendamentos: 248, ticketMedio: 228 },
          { mes: "Jan", receita: 16300, clientes: 35, agendamentos: 198, ticketMedio: 215 },
          { mes: "Fev", receita: 17100, clientes: 41, agendamentos: 220, ticketMedio: 232 },
          { mes: "Mar", receita: 18420, clientes: 47, agendamentos: 237, ticketMedio: 245 },
        ];

        const comparativo = [
          { label: "Receita", mesAtual: 18420, mesAnterior: 17100, variacao: 7.7 },
          { label: "Clientes Novos", mesAtual: 47, mesAnterior: 41, variacao: 14.6 },
          { label: "Agendamentos", mesAtual: 237, mesAnterior: 220, variacao: 7.7 },
          { label: "Ticket Médio", mesAtual: 245, mesAnterior: 232, variacao: 5.6 },
          { label: "Avaliação Média", mesAtual: 4.9, mesAnterior: 4.7, variacao: 4.3 },
          { label: "Taxa de Retorno", mesAtual: 72, mesAnterior: 68, variacao: 5.9 },
        ];

        const categoriaPie = [
          { name: "Cabelo", value: 45, color: "hsl(35 50% 50%)" },
          { name: "Unhas", value: 22, color: "hsl(183 50% 40%)" },
          { name: "Estética", value: 18, color: "hsl(340 60% 55%)" },
          { name: "Barba", value: 10, color: "hsl(260 40% 55%)" },
          { name: "Spa", value: 5, color: "hsl(160 50% 42%)" },
        ];

        return (
          <>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              {/* Line Chart - Receita */}
              <div className="col-span-1 xl:col-span-2 rounded-xl border border-border bg-card p-5 card-hover">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold text-foreground">Tendência de Receita</h3>
                  <span className="text-xs text-text3 bg-surface2 rounded-full px-3 py-1">Últimos 6 meses</span>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={tendenciaMensal}>
                    <defs>
                      <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(35 50% 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(35 50% 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 90%)" />
                    <XAxis dataKey="mes" tick={{ fill: "hsl(280 15% 60%)", fontSize: 12 }} axisLine={false} />
                    <YAxis tick={{ fill: "hsl(280 15% 60%)", fontSize: 11 }} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(280 20% 90%)", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="receita" name="Receita" stroke="hsl(35 50% 50%)" strokeWidth={2.5} fill="url(#gradReceita)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Pie - Categoria de Serviços */}
              <div className="rounded-xl border border-border bg-card p-5 card-hover">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Receita por Categoria</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categoriaPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {categoriaPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(280 20% 90%)", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {categoriaPie.map((c) => (
                    <div key={c.name} className="flex items-center gap-1.5 text-xs text-text2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name} ({c.value}%)
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tendência Clientes + Agendamentos */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5 card-hover">
                <h3 className="font-display text-base font-semibold text-foreground mb-4">Clientes & Agendamentos</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={tendenciaMensal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 90%)" />
                    <XAxis dataKey="mes" tick={{ fill: "hsl(280 15% 60%)", fontSize: 12 }} axisLine={false} />
                    <YAxis yAxisId="left" tick={{ fill: "hsl(280 15% 60%)", fontSize: 11 }} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(280 15% 60%)", fontSize: 11 }} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(280 20% 90%)", borderRadius: 8 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Line yAxisId="left" type="monotone" dataKey="clientes" name="Novos Clientes" stroke="hsl(340 60% 55%)" strokeWidth={2} dot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="agendamentos" name="Agendamentos" stroke="hsl(183 50% 40%)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Comparativo Mês Atual vs Anterior */}
              <div className="rounded-xl border border-border bg-card p-5 card-hover">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base font-semibold text-foreground">Mar vs Fev</h3>
                  <span className="text-xs text-text3 bg-surface2 rounded-full px-3 py-1">Comparativo</span>
                </div>
                <div className="space-y-3">
                  {comparativo.map((item) => {
                    const isPositive = item.variacao > 0;
                    return (
                      <div key={item.label} className="flex items-center justify-between rounded-lg bg-surface2 p-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-text3">Fev: {item.mesAnterior.toLocaleString("pt-BR")}</span>
                            <span className="text-text3">→</span>
                            <span className="text-xs font-semibold text-foreground">Mar: {item.mesAtual.toLocaleString("pt-BR")}</span>
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isPositive ? "bg-green-custom/15 text-green-custom" : "bg-destructive/15 text-destructive"}`}>
                          {isPositive ? "+" : ""}{item.variacao}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        );
      })()}

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
                  <p className="text-sm font-semibold text-primary">{format(c.totalGasto)}</p>
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
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 90%)" />
              <XAxis dataKey="semana" tick={{ fill: "hsl(280 15% 60%)", fontSize: 12 }} axisLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(280 20% 90%)", borderRadius: 8, color: "hsl(320 30% 10%)" }}
              />
              <Bar dataKey="valor" fill="hsl(35 50% 50%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="meta" fill="hsl(183 50% 40%)" radius={[6, 6, 0, 0]} opacity={0.3} />
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
                <p className="text-sm font-semibold text-green-custom">{format(p.receita)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban */}
      <KanbanBoard />
    </div>
  );
}

function DashboardColaborador() {
  const { usuarioLogado } = useAuth();
  
  // Get today's appointments for this professional
  const meusAgendamentos = agendamentos.filter(a => a.dia === "Seg"); // Simulating "today"
  const minhasAvaliacoes = avaliacoes.filter(a => {
    const prof = profissionais.find(p => String(p.id) === usuarioLogado?.profissionalId);
    return prof ? a.profissional === prof.nome : false;
  }).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl border border-border bg-card p-6 card-hover">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Bom dia, {usuarioLogado?.nome.split(" ")[0]}! 👋
        </h2>
        <p className="text-text2 mt-1">Aqui está o resumo do seu dia</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* My appointments today */}
        <div className="rounded-xl border border-border bg-card p-5 card-hover">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Meus Agendamentos Hoje
          </h3>
          <div className="space-y-3">
            {meusAgendamentos.length > 0 ? meusAgendamentos.map((ag) => (
              <div key={ag.id} className={`rounded-lg border-l-[3px] px-4 py-3 ${corMap[ag.cor]}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{ag.clienteNome}</p>
                    <p className="text-sm text-text3">{ag.servico}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{ag.hora}</p>
                    <span className={`text-xs ${ag.status === "Confirmado" ? "text-green-custom" : "text-primary"}`}>
                      {ag.status}
                    </span>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-text3 text-sm">Nenhum agendamento para hoje</p>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5 card-hover">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2.5" style={{ backgroundColor: "hsl(160 50% 42% / 0.12)", color: "hsl(160 50% 42%)" }}>
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{meusAgendamentos.filter(a => a.status === "Confirmado").length}</p>
                  <p className="text-xs text-text3">Confirmados</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 card-hover">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2.5" style={{ backgroundColor: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{meusAgendamentos.filter(a => a.status === "Pendente").length}</p>
                  <p className="text-xs text-text3">Pendentes</p>
                </div>
              </div>
            </div>
          </div>

          {/* My evaluations */}
          <div className="rounded-xl border border-border bg-card p-5 card-hover">
            <h3 className="font-display text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Minhas Avaliações Recentes
            </h3>
            <div className="space-y-3">
              {minhasAvaliacoes.length > 0 ? minhasAvaliacoes.map((av) => (
                <div key={av.id} className="flex items-start gap-3 rounded-lg bg-surface2 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary" style={{ backgroundColor: "hsl(var(--primary) / 0.12)" }}>
                    {av.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{av.nome}</p>
                      <div className="flex">
                        {Array.from({ length: av.nota }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-text3 truncate">{av.comentario}</p>
                  </div>
                </div>
              )) : (
                <p className="text-text3 text-sm">Nenhuma avaliação recente</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Team schedule (view only) */}
      <div className="rounded-xl border border-border bg-card p-5 card-hover">
        <h3 className="font-display text-lg font-semibold text-foreground mb-4">Agenda da Equipe</h3>
        <div className="overflow-x-auto">
          <div className="grid min-w-[600px]" style={{ gridTemplateColumns: "60px repeat(5, 1fr)" }}>
            <div />
            {dias.map((d, i) => (
              <div key={d} className={`py-2 text-center text-sm font-semibold ${i === 0 ? "text-primary" : "text-text2"}`}>
                {d}
                {i === 0 && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />}
              </div>
            ))}
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
                          <p className="text-text3">{ag.profissional}</p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-border/30 px-2.5 py-3" />
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban */}
      <KanbanBoard />
    </div>
  );
}

function DashboardFinanceiro() {
  const { usuarioLogado } = useAuth();
  const { format } = useCurrency();

  const receitaMensal = 18420;
  const despesasMensal = 9850;
  const lucroLiquido = receitaMensal - despesasMensal;
  const ticketMedio = 245;

  const fluxoCaixa = [
    { mes: "Out", entradas: 14200, saidas: 8100 },
    { mes: "Nov", entradas: 15800, saidas: 8900 },
    { mes: "Dez", entradas: 19500, saidas: 11200 },
    { mes: "Jan", entradas: 16300, saidas: 9400 },
    { mes: "Fev", entradas: 17100, saidas: 9200 },
    { mes: "Mar", entradas: 18420, saidas: 9850 },
  ];

  const despesasCategoria = [
    { categoria: "Salários", valor: 4200, pct: 42.6 },
    { categoria: "Produtos", valor: 2100, pct: 21.3 },
    { categoria: "Aluguel", valor: 1800, pct: 18.3 },
    { categoria: "Energia/Água", valor: 650, pct: 6.6 },
    { categoria: "Marketing", valor: 580, pct: 5.9 },
    { categoria: "Outros", valor: 520, pct: 5.3 },
  ];

  const contasAReceber = [
    { cliente: "Ana Paula Souza", valor: 360, vencimento: "10 Mar", status: "pendente" },
    { cliente: "Mariana Ferreira", valor: 440, vencimento: "08 Mar", status: "atrasado" },
    { cliente: "Fernanda Ribeiro", valor: 180, vencimento: "15 Mar", status: "pendente" },
  ];

  const contasAPagar = [
    { fornecedor: "Distribuidora Beleza", valor: 1200, vencimento: "12 Mar", status: "pendente" },
    { fornecedor: "Aluguel Sala", valor: 1800, vencimento: "05 Mar", status: "pago" },
    { fornecedor: "Energia Elétrica", valor: 380, vencimento: "18 Mar", status: "pendente" },
  ];

  const comissoesProfissionais = profissionais.map(p => ({
    nome: p.nome,
    atendimentos: p.atendimentos,
    receita: p.receita,
    comissao: Math.round(p.receita * 0.35),
    pago: p.id % 2 === 0,
  }));

  const kpis = [
    { label: "Receita do Mês", value: format(receitaMensal), change: "+12,4%", positive: true, icon: TrendingUp, color: "text-green-custom" },
    { label: "Despesas do Mês", value: format(despesasMensal), change: "+3,2%", positive: false, icon: ArrowDownCircle, color: "text-destructive" },
    { label: "Lucro Líquido", value: format(lucroLiquido), change: "+18,7%", positive: true, icon: DollarSign, color: "text-primary" },
    { label: "Ticket Médio", value: format(ticketMedio), change: "+5,1%", positive: true, icon: Receipt, color: "text-teal-custom" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl border border-border bg-card p-6 card-hover">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Painel Financeiro 💰
        </h2>
        <p className="text-text2 mt-1">Olá, {usuarioLogado?.nome.split(" ")[0]}! Aqui está o resumo financeiro do mês</p>
      </div>

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
                <p className={`mt-1 text-sm font-medium ${kpi.positive ? "text-green-custom" : "text-destructive"}`}>
                  {kpi.change}
                </p>
              </div>
              <div className={`rounded-lg bg-surface2 p-2.5 ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fluxo de Caixa Chart + Despesas */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="col-span-1 xl:col-span-2 rounded-xl border border-border bg-card p-5 card-hover">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Fluxo de Caixa - 6 Meses</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={fluxoCaixa}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 90%)" />
              <XAxis dataKey="mes" tick={{ fill: "hsl(280 15% 60%)", fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: "hsl(280 15% 60%)", fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(280 20% 90%)", borderRadius: 8 }} />
              <Bar dataKey="entradas" name="Entradas" fill="hsl(160 50% 42%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidas" name="Saídas" fill="hsl(0 70% 55%)" radius={[4, 4, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 card-hover">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Despesas por Categoria</h3>
          <div className="space-y-3">
            {despesasCategoria.map((d) => (
              <div key={d.categoria}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-text2">{d.categoria}</span>
                  <span className="text-foreground font-medium">{format(d.valor)} <span className="text-text3 text-xs">({d.pct}%)</span></span>
                </div>
                <div className="h-2 rounded-full bg-surface2">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contas a Receber + Contas a Pagar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 card-hover">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-green-custom" />
            Contas a Receber
          </h3>
          <div className="space-y-3">
            {contasAReceber.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-surface2 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.cliente}</p>
                  <p className="text-xs text-text3">Venc: {c.vencimento}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{format(c.valor)}</p>
                  <span className={`text-xs font-medium ${c.status === "atrasado" ? "text-destructive" : "text-primary"}`}>
                    {c.status === "atrasado" ? "Atrasado" : "Pendente"}
                  </span>
                </div>
              </div>
            ))}
            <p className="text-sm font-semibold text-green-custom text-right">
              Total: {format(contasAReceber.reduce((s, c) => s + c.valor, 0))}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 card-hover">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5 text-destructive" />
            Contas a Pagar
          </h3>
          <div className="space-y-3">
            {contasAPagar.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-surface2 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.fornecedor}</p>
                  <p className="text-xs text-text3">Venc: {c.vencimento}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{format(c.valor)}</p>
                  <span className={`text-xs font-medium ${c.status === "pago" ? "text-green-custom" : "text-primary"}`}>
                    {c.status === "pago" ? "Pago ✓" : "Pendente"}
                  </span>
                </div>
              </div>
            ))}
            <p className="text-sm font-semibold text-destructive text-right">
              Total: {format(contasAPagar.reduce((s, c) => s + c.valor, 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Comissões */}
      <div className="rounded-xl border border-border bg-card p-5 card-hover">
        <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Comissões dos Profissionais
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text3">
                <th className="pb-3 font-medium">Profissional</th>
                <th className="pb-3 font-medium">Atendimentos</th>
                <th className="pb-3 font-medium">Receita Gerada</th>
                <th className="pb-3 font-medium">Comissão (35%)</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {comissoesProfissionais.map((c) => (
                <tr key={c.nome} className="border-b border-border/50">
                  <td className="py-3 font-medium text-foreground">{c.nome}</td>
                  <td className="py-3 text-text2">{c.atendimentos}</td>
                  <td className="py-3 text-text2">{format(c.receita)}</td>
                  <td className="py-3 font-semibold text-primary">{format(c.comissao)}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.pago ? "bg-green-custom/15 text-green-custom" : "bg-primary/15 text-primary"}`}>
                      {c.pago ? "Pago" : "Pendente"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receita por Semana + Serviços Populares */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 card-hover">
          <h3 className="font-display text-base font-semibold text-foreground mb-4">Receita Semanal</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={receitaSemanal}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 90%)" />
              <XAxis dataKey="semana" tick={{ fill: "hsl(280 15% 60%)", fontSize: 12 }} axisLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(280 20% 90%)", borderRadius: 8 }} />
              <Bar dataKey="valor" fill="hsl(35 50% 50%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="meta" fill="hsl(183 50% 40%)" radius={[6, 6, 0, 0]} opacity={0.3} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 card-hover">
          <h3 className="font-display text-base font-semibold text-foreground mb-4">Serviços por Receita</h3>
          <div className="space-y-3">
            {servicos.slice(0, 6).map((s, i) => (
              <div key={s.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-text2">{i + 1}. {s.nome}</span>
                  <span className="text-foreground font-medium">{format(s.preco * s.contagem)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface2">
                  <div className="h-full rounded-full gold-gradient" style={{ width: `${(s.contagem / 142) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban */}
      <KanbanBoard />
    </div>
  );
}

export default function Dashboard() {
  const { perfil } = useAuth();
  
  if (perfil === "Colaborador") return <DashboardColaborador />;
  if (perfil === "Financeiro") return <DashboardFinanceiro />;
  return <DashboardCompleto />;
}
