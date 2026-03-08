import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { receitaMensal, extrato, profissionais } from "@/data/mockData";
import { TrendingUp, TrendingDown, DollarSign, Plus, X, ArrowUpCircle, ArrowDownCircle, Wallet, CreditCard, Receipt, Users, Scissors, Calendar, FileText, AlertTriangle } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";

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

const fluxoCaixaData = [
  { dia: "01", entrada: 1200, saida: 400 },
  { dia: "05", entrada: 1800, saida: 900 },
  { dia: "10", entrada: 2100, saida: 600 },
  { dia: "15", entrada: 1500, saida: 1800 },
  { dia: "20", entrada: 2800, saida: 700 },
  { dia: "25", entrada: 3200, saida: 1200 },
  { dia: "30", entrada: 2400, saida: 2100 },
];

const servicosMaisSolicitados = [
  { nome: "Coloração", qtd: 142, receita: 25560 },
  { nome: "Corte Feminino", qtd: 121, receita: 9680 },
  { nome: "Progressiva / Botox", qtd: 88, receita: 19360 },
  { nome: "Escova Modeladora", qtd: 75, receita: 5250 },
  { nome: "Manicure + Pedicure", qtd: 68, receita: 4080 },
  { nome: "Corte Masculino", qtd: 55, receita: 2475 },
  { nome: "Hidratação Capilar", qtd: 47, receita: 4230 },
];

type TabFinanceiro = "visao-geral" | "caixa" | "folha" | "servicos-top";

interface MovimentoCaixa {
  id: number;
  data: string;
  descricao: string;
  tipo: "entrada" | "saida";
  valor: number;
  categoria: string;
}

interface LancamentoFolha {
  id: number;
  profissional: string;
  tipo: "adiantamento" | "desconto" | "pagamento";
  descricao: string;
  valor: number;
  data: string;
  status: "pendente" | "aprovado" | "pago";
}

const movimentosInit: MovimentoCaixa[] = [
  { id: 1, data: "05/03", descricao: "Recebimento serviços - Dia", tipo: "entrada", valor: 1850, categoria: "Serviços" },
  { id: 2, data: "05/03", descricao: "Compra produtos Wella", tipo: "saida", valor: 540, categoria: "Fornecedores" },
  { id: 3, data: "04/03", descricao: "Recebimento serviços - Dia", tipo: "entrada", valor: 2100, categoria: "Serviços" },
  { id: 4, data: "04/03", descricao: "Conta de luz", tipo: "saida", valor: 380, categoria: "Despesas fixas" },
  { id: 5, data: "03/03", descricao: "Venda de produtos", tipo: "entrada", valor: 450, categoria: "Vendas" },
  { id: 6, data: "03/03", descricao: "Aluguel do espaço", tipo: "saida", valor: 3500, categoria: "Despesas fixas" },
  { id: 7, data: "02/03", descricao: "Recebimento serviços - Dia", tipo: "entrada", valor: 1600, categoria: "Serviços" },
  { id: 8, data: "01/03", descricao: "Material de limpeza", tipo: "saida", valor: 180, categoria: "Operacional" },
];

const folhaInit: LancamentoFolha[] = [
  { id: 1, profissional: "Élise Monteiro", tipo: "pagamento", descricao: "Comissão Fevereiro (40%)", valor: 2880, data: "01/03", status: "pago" },
  { id: 2, profissional: "Rodrigo Alves", tipo: "pagamento", descricao: "Comissão Fevereiro (40%)", valor: 1940, data: "01/03", status: "pago" },
  { id: 3, profissional: "Camile Torres", tipo: "adiantamento", descricao: "Adiantamento salarial", valor: 500, data: "15/02", status: "aprovado" },
  { id: 4, profissional: "Patrícia Nunes", tipo: "desconto", descricao: "Desconto falta injustificada", valor: 200, data: "01/03", status: "pendente" },
  { id: 5, profissional: "Rodrigo Alves", tipo: "adiantamento", descricao: "Adiantamento salarial", valor: 800, data: "20/02", status: "pago" },
];

const categoriasMovimento = ["Serviços", "Vendas", "Fornecedores", "Despesas fixas", "Operacional", "Manutenção", "Marketing", "Outros"];

export default function Financeiro() {
  const { format } = useCurrency();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabFinanceiro>("visao-geral");

  // Caixa state
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>(movimentosInit);
  const [showMovModal, setShowMovModal] = useState(false);
  const movForm = useState({ descricao: "", tipo: "entrada" as "entrada" | "saida", valor: 0, categoria: "Serviços" });
  const [mf, setMf] = movForm;

  // Folha state
  const [folha, setFolha] = useState<LancamentoFolha[]>(folhaInit);
  const [showFolhaModal, setShowFolhaModal] = useState(false);
  const [ff, setFf] = useState({ profissional: profissionais[0]?.nome || "", tipo: "adiantamento" as LancamentoFolha["tipo"], descricao: "", valor: 0 });

  const totalEntradas = movimentos.filter(m => m.tipo === "entrada").reduce((a, m) => a + m.valor, 0);
  const totalSaidas = movimentos.filter(m => m.tipo === "saida").reduce((a, m) => a + m.valor, 0);
  const saldoCaixa = totalEntradas - totalSaidas;

  const salvarMov = () => {
    if (!mf.descricao.trim() || mf.valor <= 0) return;
    setMovimentos(prev => [{ id: Date.now(), data: new Date().toLocaleDateString("pt-BR").slice(0, 5), ...mf }, ...prev]);
    setShowMovModal(false);
    setMf({ descricao: "", tipo: "entrada", valor: 0, categoria: "Serviços" });
    toast({ title: `${mf.tipo === "entrada" ? "Entrada" : "Saída"} registrada` });
  };

  const salvarFolha = () => {
    if (!ff.descricao.trim() || ff.valor <= 0) return;
    setFolha(prev => [{ id: Date.now(), ...ff, data: new Date().toLocaleDateString("pt-BR").slice(0, 5), status: "pendente" }, ...prev]);
    setShowFolhaModal(false);
    setFf({ profissional: profissionais[0]?.nome || "", tipo: "adiantamento", descricao: "", valor: 0 });
    toast({ title: "Lançamento registrado" });
  };

  const aprovarFolha = (id: number) => {
    setFolha(prev => prev.map(f => f.id === id ? { ...f, status: f.status === "pendente" ? "aprovado" : "pago" } : f));
    toast({ title: "Status atualizado" });
  };

  const kpis = [
    { label: "Receita Bruta", value: format(18420), icon: TrendingUp, color: "text-green-custom" },
    { label: "Despesas", value: format(8900), icon: TrendingDown, color: "text-destructive" },
    { label: "Lucro Líquido", value: format(9520), icon: DollarSign, color: "text-primary" },
    { label: "Ticket Médio", value: format(147), icon: DollarSign, color: "text-teal-custom" },
  ];

  const tabs: { key: TabFinanceiro; label: string; icon: any }[] = [
    { key: "visao-geral", label: "Visão Geral", icon: Wallet },
    { key: "caixa", label: "Fluxo de Caixa", icon: ArrowUpCircle },
    { key: "folha", label: "Folha / Pagamentos", icon: Users },
    { key: "servicos-top", label: "Serviços Top", icon: Scissors },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${tab === t.key ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-text3 hover:text-foreground hover:bg-surface2"}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {/* ===== VISÃO GERAL ===== */}
      {tab === "visao-geral" && (
        <>
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
        </>
      )}

      {/* ===== FLUXO DE CAIXA ===== */}
      {tab === "caixa" && (
        <>
          {/* KPIs Caixa */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5 card-hover">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-custom/10 p-2.5 text-green-custom"><ArrowUpCircle className="h-5 w-5" /></div>
                <div><p className="text-xs text-text3">Total Entradas</p><p className="font-display text-2xl font-bold text-green-custom">{format(totalEntradas)}</p></div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 card-hover">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2.5 text-destructive"><ArrowDownCircle className="h-5 w-5" /></div>
                <div><p className="text-xs text-text3">Total Saídas</p><p className="font-display text-2xl font-bold text-destructive">{format(totalSaidas)}</p></div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 card-hover">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Wallet className="h-5 w-5" /></div>
                <div><p className="text-xs text-text3">Saldo em Caixa</p><p className="font-display text-2xl font-bold text-primary">{format(saldoCaixa)}</p></div>
              </div>
            </div>
          </div>

          {/* Gráfico Fluxo */}
          <div className="rounded-xl border border-border bg-card p-5 card-hover">
            <h3 className="font-display text-base font-semibold text-foreground mb-4">Fluxo de Caixa Mensal</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={fluxoCaixaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 90%)" />
                <XAxis dataKey="dia" tick={{ fill: "hsl(280 15% 60%)", fontSize: 12 }} axisLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(280 20% 90%)", borderRadius: 8, color: "hsl(320 30% 10%)" }} />
                <Legend />
                <Line type="monotone" dataKey="entrada" stroke="hsl(150 50% 40%)" strokeWidth={2} name="Entradas" />
                <Line type="monotone" dataKey="saida" stroke="hsl(350 55% 57%)" strokeWidth={2} name="Saídas" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Movimentações */}
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-foreground">Movimentações</h3>
              <button onClick={() => setShowMovModal(true)} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2 text-sm font-semibold text-primary-foreground">
                <Plus className="h-4 w-4" /> Nova Movimentação
              </button>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-text3"><th className="p-4 text-left">Data</th><th className="p-4 text-left">Descrição</th><th className="p-4 text-left hidden md:table-cell">Categoria</th><th className="p-4 text-left">Tipo</th><th className="p-4 text-left">Valor</th></tr></thead>
              <tbody>
                {movimentos.map(m => (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-surface2/50">
                    <td className="p-4 text-text3">{m.data}</td>
                    <td className="p-4 text-foreground">{m.descricao}</td>
                    <td className="p-4 text-text2 hidden md:table-cell">{m.categoria}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${m.tipo === "entrada" ? "bg-green-custom/10 text-green-custom" : "bg-destructive/10 text-destructive"}`}>
                        {m.tipo === "entrada" ? "↑ Entrada" : "↓ Saída"}
                      </span>
                    </td>
                    <td className={`p-4 font-semibold ${m.tipo === "entrada" ? "text-green-custom" : "text-destructive"}`}>{m.tipo === "entrada" ? "+" : "-"}{format(m.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ===== FOLHA / PAGAMENTOS ===== */}
      {tab === "folha" && (
        <>
          {/* Resumo folha */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-5 card-hover">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><CreditCard className="h-5 w-5" /></div>
                <div><p className="text-xs text-text3">Total Comissões</p><p className="font-display text-xl font-bold text-foreground">{format(profissionais.reduce((a, p) => a + p.receita * 0.4, 0))}</p></div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 card-hover">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-teal-custom/10 p-2.5 text-teal-custom"><Receipt className="h-5 w-5" /></div>
                <div><p className="text-xs text-text3">Adiantamentos</p><p className="font-display text-xl font-bold text-foreground">{format(folha.filter(f => f.tipo === "adiantamento").reduce((a, f) => a + f.valor, 0))}</p></div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 card-hover">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-destructive/10 p-2.5 text-destructive"><AlertTriangle className="h-5 w-5" /></div>
                <div><p className="text-xs text-text3">Descontos</p><p className="font-display text-xl font-bold text-foreground">{format(folha.filter(f => f.tipo === "desconto").reduce((a, f) => a + f.valor, 0))}</p></div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 card-hover">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-custom/10 p-2.5 text-green-custom"><FileText className="h-5 w-5" /></div>
                <div><p className="text-xs text-text3">Pagos</p><p className="font-display text-xl font-bold text-foreground">{format(folha.filter(f => f.status === "pago").reduce((a, f) => a + f.valor, 0))}</p></div>
              </div>
            </div>
          </div>

          {/* Fechamento por profissional */}
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <div className="p-5 border-b border-border"><h3 className="font-display text-lg font-semibold text-foreground">Fechamento por Profissional</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-text3"><th className="p-4 text-left">Profissional</th><th className="p-4 text-left">Comissão (40%)</th><th className="p-4 text-left">Adiantamentos</th><th className="p-4 text-left">Descontos</th><th className="p-4 text-left">Líquido</th></tr></thead>
              <tbody>
                {profissionais.map(p => {
                  const comissao = p.receita * 0.4;
                  const adianta = folha.filter(f => f.profissional === p.nome && f.tipo === "adiantamento").reduce((a, f) => a + f.valor, 0);
                  const desc = folha.filter(f => f.profissional === p.nome && f.tipo === "desconto").reduce((a, f) => a + f.valor, 0);
                  const liq = comissao - adianta - desc;
                  return (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-surface2/50">
                      <td className="p-4 font-medium text-foreground">{p.nome}</td>
                      <td className="p-4 text-green-custom">{format(comissao)}</td>
                      <td className="p-4 text-teal-custom">-{format(adianta)}</td>
                      <td className="p-4 text-destructive">-{format(desc)}</td>
                      <td className="p-4 font-bold text-foreground">{format(liq)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Lançamentos */}
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-foreground">Lançamentos</h3>
              <button onClick={() => setShowFolhaModal(true)} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2 text-sm font-semibold text-primary-foreground">
                <Plus className="h-4 w-4" /> Novo Lançamento
              </button>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-text3"><th className="p-4 text-left">Data</th><th className="p-4 text-left">Profissional</th><th className="p-4 text-left">Tipo</th><th className="p-4 text-left hidden md:table-cell">Descrição</th><th className="p-4 text-left">Valor</th><th className="p-4 text-left">Status</th><th className="p-4 text-left">Ação</th></tr></thead>
              <tbody>
                {folha.map(f => (
                  <tr key={f.id} className="border-b border-border/50 hover:bg-surface2/50">
                    <td className="p-4 text-text3">{f.data}</td>
                    <td className="p-4 text-foreground">{f.profissional}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${f.tipo === "adiantamento" ? "bg-teal-custom/10 text-teal-custom" : f.tipo === "desconto" ? "bg-destructive/10 text-destructive" : "bg-green-custom/10 text-green-custom"}`}>
                        {f.tipo === "adiantamento" ? "Adiantamento" : f.tipo === "desconto" ? "Desconto" : "Pagamento"}
                      </span>
                    </td>
                    <td className="p-4 text-text2 hidden md:table-cell">{f.descricao}</td>
                    <td className="p-4 font-semibold text-foreground">{format(f.valor)}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${f.status === "pago" ? "badge-active" : f.status === "aprovado" ? "bg-teal-custom/10 text-teal-custom" : "bg-primary/10 text-primary"}`}>
                        {f.status === "pago" ? "Pago" : f.status === "aprovado" ? "Aprovado" : "Pendente"}
                      </span>
                    </td>
                    <td className="p-4">
                      {f.status !== "pago" && (
                        <button onClick={() => aprovarFolha(f.id)} className="rounded-lg bg-surface2 px-3 py-1.5 text-xs text-foreground hover:bg-primary/10 hover:text-primary">
                          {f.status === "pendente" ? "Aprovar" : "Pagar"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ===== SERVIÇOS TOP ===== */}
      {tab === "servicos-top" && (
        <>
          <div className="rounded-xl border border-border bg-card p-5 card-hover">
            <h3 className="font-display text-base font-semibold text-foreground mb-4">Serviços Mais Solicitados</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={servicosMaisSolicitados} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 90%)" />
                <XAxis type="number" tick={{ fill: "hsl(280 15% 60%)", fontSize: 12 }} axisLine={false} />
                <YAxis dataKey="nome" type="category" width={140} tick={{ fill: "hsl(280 15% 60%)", fontSize: 11 }} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(280 20% 90%)", borderRadius: 8, color: "hsl(320 30% 10%)" }} />
                <Bar dataKey="qtd" fill="hsl(35 50% 50%)" radius={[0, 4, 4, 0]} name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <div className="p-5 border-b border-border"><h3 className="font-display text-lg font-semibold text-foreground">Ranking de Serviços</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-text3"><th className="p-4 text-left">#</th><th className="p-4 text-left">Serviço</th><th className="p-4 text-left">Atendimentos</th><th className="p-4 text-left">Receita Total</th><th className="p-4 text-left">Ticket Médio</th></tr></thead>
              <tbody>
                {servicosMaisSolicitados.map((s, i) => (
                  <tr key={s.nome} className="border-b border-border/50 hover:bg-surface2/50">
                    <td className="p-4"><span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? "bg-primary/15 text-primary" : "bg-surface2 text-text3"}`}>{i + 1}</span></td>
                    <td className="p-4 font-medium text-foreground">{s.nome}</td>
                    <td className="p-4 text-text2">{s.qtd}</td>
                    <td className="p-4 font-semibold text-green-custom">{format(s.receita)}</td>
                    <td className="p-4 text-text2">{format(Math.round(s.receita / s.qtd))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal Movimentação Caixa */}
      {showMovModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Nova Movimentação</h2>
              <button onClick={() => setShowMovModal(false)} className="text-text3 hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text3 mb-1 block">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setMf(f => ({ ...f, tipo: "entrada" }))} className={`rounded-lg py-2 text-sm font-medium transition-colors ${mf.tipo === "entrada" ? "bg-green-custom/15 text-green-custom ring-1 ring-green-custom/30" : "bg-surface2 text-text3"}`}>↑ Entrada</button>
                  <button onClick={() => setMf(f => ({ ...f, tipo: "saida" }))} className={`rounded-lg py-2 text-sm font-medium transition-colors ${mf.tipo === "saida" ? "bg-destructive/15 text-destructive ring-1 ring-destructive/30" : "bg-surface2 text-text3"}`}>↓ Saída</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-text3 mb-1 block">Descrição *</label>
                <input value={mf.descricao} onChange={e => setMf(f => ({ ...f, descricao: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-text3 mb-1 block">Categoria</label>
                <select value={mf.categoria} onChange={e => setMf(f => ({ ...f, categoria: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                  {categoriasMovimento.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-text3 mb-1 block">Valor *</label>
                <input type="number" value={mf.valor || ""} onChange={e => setMf(f => ({ ...f, valor: +e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <button onClick={salvarMov} className="w-full rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">Registrar</button>
          </div>
        </div>
      )}

      {/* Modal Folha */}
      {showFolhaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Novo Lançamento</h2>
              <button onClick={() => setShowFolhaModal(false)} className="text-text3 hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text3 mb-1 block">Profissional</label>
                <select value={ff.profissional} onChange={e => setFf(f => ({ ...f, profissional: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                  {profissionais.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-text3 mb-1 block">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["adiantamento", "desconto", "pagamento"] as const).map(t => (
                    <button key={t} onClick={() => setFf(f => ({ ...f, tipo: t }))} className={`rounded-lg py-2 text-xs font-medium transition-colors ${ff.tipo === t ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-surface2 text-text3"}`}>
                      {t === "adiantamento" ? "Adiantamento" : t === "desconto" ? "Desconto" : "Pagamento"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-text3 mb-1 block">Descrição *</label>
                <input value={ff.descricao} onChange={e => setFf(f => ({ ...f, descricao: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-text3 mb-1 block">Valor *</label>
                <input type="number" value={ff.valor || ""} onChange={e => setFf(f => ({ ...f, valor: +e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <button onClick={salvarFolha} className="w-full rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">Registrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
