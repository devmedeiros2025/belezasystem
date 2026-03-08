import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { receitaMensal, extrato } from "@/data/mockData";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

const servicoBreakdown = [
  { name: "Coloração", value: 35 },
  { name: "Corte", value: 25 },
  { name: "Progressiva", value: 18 },
  { name: "Manicure", value: 12 },
  { name: "Outros", value: 10 },
];
const COLORS = ["hsl(35 50% 50%)", "hsl(183 50% 40%)", "hsl(350 55% 57%)", "hsl(270 40% 55%)", "hsl(150 50% 40%)"];

const pagamentos = [
  { tipo: "PIX", valor: 7200, pct: 39 },
  { tipo: "Crédito", valor: 5600, pct: 30 },
  { tipo: "Débito", valor: 3400, pct: 18 },
  { tipo: "Dinheiro", valor: 2220, pct: 13 },
];

export default function Financeiro() {
  const { format } = useCurrency();

  const kpis = [
    { label: "Receita Bruta", value: format(18420), icon: TrendingUp, color: "text-green-custom" },
    { label: "Despesas", value: format(8900), icon: TrendingDown, color: "text-destructive" },
    { label: "Lucro Líquido", value: format(9520), icon: DollarSign, color: "text-primary" },
    { label: "Ticket Médio", value: format(147), icon: DollarSign, color: "text-teal-custom" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(k => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-5 card-hover">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-surface2 p-2.5 ${k.color}`}><k.icon className="h-5 w-5" /></div>
              <div><p className="text-xs text-text3">{k.label}</p><p className="font-display text-2xl font-bold text-foreground">{k.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 card-hover">
          <h3 className="font-display text-base font-semibold text-foreground mb-4">Receita vs Despesas vs Lucro</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={receitaMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 90%)" />
              <XAxis dataKey="mes" tick={{ fill: "hsl(280 15% 60%)", fontSize: 12 }} axisLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(280 20% 90%)", borderRadius: 8, color: "hsl(320 30% 10%)" }} />
              <Bar dataKey="receita" fill="hsl(35 50% 50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="hsl(350 55% 57%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lucro" fill="hsl(150 50% 40%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 card-hover">
          <h3 className="font-display text-base font-semibold text-foreground mb-4">Receita por Serviço</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={servicoBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3}>
                  {servicoBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(280 20% 90%)", borderRadius: 8, color: "hsl(320 30% 10%)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {servicoBreakdown.map((s, i) => (
              <span key={s.name} className="flex items-center gap-1.5 text-xs text-text2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />{s.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Pagamentos */}
      <div className="rounded-xl border border-border bg-card p-5 card-hover">
        <h3 className="font-display text-base font-semibold text-foreground mb-4">Formas de Pagamento</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {pagamentos.map(p => (
            <div key={p.tipo} className="rounded-lg bg-surface2 p-4 text-center">
              <p className="text-sm text-text2">{p.tipo}</p>
              <p className="font-display text-xl font-bold text-foreground mt-1">{format(p.valor)}</p>
              <p className="text-xs text-text3">{p.pct}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Extrato */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <div className="p-5 border-b border-border"><h3 className="font-display text-lg font-semibold text-foreground">Extrato</h3></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-xs text-text3"><th className="p-4 text-left">Data</th><th className="p-4 text-left">Cliente</th><th className="p-4 text-left hidden md:table-cell">Serviço</th><th className="p-4 text-left hidden md:table-cell">Profissional</th><th className="p-4 text-left">Valor</th><th className="p-4 text-left">Pagamento</th></tr></thead>
          <tbody>
            {extrato.map(e => (
              <tr key={e.id} className="border-b border-border/50 hover:bg-surface2/50">
                <td className="p-4 text-text3">{e.data}</td>
                <td className="p-4 text-foreground">{e.cliente}</td>
                <td className="p-4 text-text2 hidden md:table-cell">{e.servico}</td>
                <td className="p-4 text-text2 hidden md:table-cell">{e.profissional}</td>
                <td className="p-4 font-semibold text-foreground">{format(e.valor)}</td>
                <td className="p-4"><span className="rounded-full bg-surface2 px-2.5 py-1 text-[11px] text-text2">{e.pagamento}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
