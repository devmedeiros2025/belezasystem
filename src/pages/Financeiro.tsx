import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Plus, X, ArrowUpCircle, ArrowDownCircle,
  Wallet, CreditCard, Receipt, Users, AlertTriangle, Download, FileSpreadsheet,
  Bell, Eye, Pencil, Trash2, Check, ShoppingBag, Truck, Calendar, ClipboardList,
  Building2, FileText, BarChart3, Package, ChevronDown, ChevronUp,
} from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/exportUtils";
import {
  movimentacoesInit, contasAPagarInit, contasAReceberInit, despesasInit,
  fornecedoresInit, salariosConfig, adiantamentosInit, produtosVendidosInit,
  fechamentoCaixaInit, receitaDespesasMensal, formaPagamentoData,
  fluxoCaixaDiario, topServicosReceita, categoriasDespesa, dreData,
  type Movimentacao, type ContaPagar, type ContaReceber, type Despesa,
  type Fornecedor, type Adiantamento, type ProdutoVendido, type FechamentoCaixa,
} from "@/data/financeiroData";

const COLORS = ["hsl(35 50% 50%)", "hsl(183 50% 40%)", "hsl(350 55% 57%)", "hsl(270 40% 55%)", "hsl(150 50% 40%)"];
const tooltipStyle = { backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(280 20% 90%)", borderRadius: 8, color: "hsl(320 30% 10%)" };

type TabKey = "visao-geral" | "fluxo-caixa" | "entradas-saidas" | "contas-pagar" | "contas-receber" | "despesas" | "fornecedores" | "salarios" | "fechamento" | "dre" | "produtos";
type SubTabSalario = "salarios" | "comissoes" | "adiantamentos";

// ===== MODAL COMPONENT =====
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 animate-fadeInUp" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-text3 hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ===== FIELD =====
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs text-text3 mb-1 block">{label}</label>{children}</div>;
}

function InputField({ label, value, onChange, type = "text", placeholder = "" }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <Field label={label}>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
    </Field>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <Field label={label}>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

// ===== KPI CARD =====
function KpiCard({ label, value, icon: Icon, color, variacao }: { label: string; value: string; icon: any; color: string; variacao?: { valor: string; positivo: boolean } }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 card-hover">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${color}`}><Icon className="h-5 w-5" /></div>
        <div className="flex-1">
          <p className="text-xs text-text3">{label}</p>
          <p className="font-display text-2xl font-bold text-foreground">{value}</p>
          {variacao && (
            <p className={`text-xs mt-0.5 ${variacao.positivo ? "text-green-custom" : "text-destructive"}`}>
              {variacao.positivo ? "↑" : "↓"} {variacao.valor} vs mês anterior
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== STATUS BADGE =====
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Pendente": "bg-primary/10 text-primary",
    "Vencida": "bg-destructive/10 text-destructive animate-pulse",
    "Paga": "bg-green-custom/10 text-green-custom",
    "Paga com atraso": "bg-muted text-muted-foreground",
    "Em aberto": "bg-primary/10 text-primary",
    "Parcialmente pago": "bg-teal-custom/10 text-teal-custom",
    "Quitado": "bg-green-custom/10 text-green-custom",
    "Vencido": "bg-destructive/10 text-destructive animate-pulse",
    "Pendente aprovação": "bg-primary/10 text-primary",
    "Aprovado — aguardando desconto": "bg-gold/10 text-primary",
    "Descontado no salário": "bg-green-custom/10 text-green-custom",
    "Incluída no salário": "bg-green-custom/10 text-green-custom",
    "Paga separadamente": "bg-teal-custom/10 text-teal-custom",
    "Pendente pagamento": "bg-primary/10 text-primary",
    "Entrada": "bg-green-custom/10 text-green-custom",
    "Saída": "bg-destructive/10 text-destructive",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[status] || "bg-muted text-muted-foreground"}`}>{status}</span>;
}

// ===== EXPORT BUTTONS =====
function ExportButtons({ onPdf, onExcel }: { onPdf: () => void; onExcel: () => void }) {
  return (
    <div className="flex gap-2">
      <button onClick={onPdf} className="flex items-center gap-1.5 rounded-lg bg-surface2 px-3 py-1.5 text-xs font-medium text-text2 hover:text-foreground hover:bg-primary/10"><Download className="h-3.5 w-3.5" />PDF</button>
      <button onClick={onExcel} className="flex items-center gap-1.5 rounded-lg bg-surface2 px-3 py-1.5 text-xs font-medium text-text2 hover:text-foreground hover:bg-primary/10"><FileSpreadsheet className="h-3.5 w-3.5" />Excel</button>
    </div>
  );
}

// ===== PAGINATION =====
function usePagination<T>(items: T[], perPage = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(items.length / perPage);
  const paginated = items.slice((page - 1) * perPage, page * perPage);
  return { paginated, page, totalPages, setPage };
}

function PaginationControls({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 p-4">
      <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg bg-surface2 px-3 py-1.5 text-xs text-text2 hover:bg-primary/10 disabled:opacity-40">Anterior</button>
      <span className="text-xs text-text3">Página {page} de {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg bg-surface2 px-3 py-1.5 text-xs text-text2 hover:bg-primary/10 disabled:opacity-40">Próxima</button>
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function Financeiro() {
  const { perfil, usuarioLogado } = useAuth();
  const { format } = useCurrency();
  const { toast } = useToast();

  const [tab, setTab] = useState<TabKey>("visao-geral");

  // State for all tabs
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>(movimentacoesInit);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>(contasAPagarInit);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>(contasAReceberInit);
  const [despesas, setDespesas] = useState<Despesa[]>(despesasInit);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(fornecedoresInit);
  const [adiantamentos, setAdiantamentos] = useState<Adiantamento[]>(adiantamentosInit);
  const [produtosVendidos] = useState<ProdutoVendido[]>(produtosVendidosInit);
  const [fechamento, setFechamento] = useState<FechamentoCaixa>(fechamentoCaixaInit);

  // Modal states
  const [modalEntrada, setModalEntrada] = useState(false);
  const [modalSaida, setModalSaida] = useState(false);
  const [modalContaPagar, setModalContaPagar] = useState(false);
  const [modalFiado, setModalFiado] = useState(false);
  const [modalPagamento, setModalPagamento] = useState<number | null>(null);
  const [modalDespesa, setModalDespesa] = useState(false);
  const [modalFornecedor, setModalFornecedor] = useState(false);
  const [modalCompraFornecedor, setModalCompraFornecedor] = useState(false);
  const [modalSalario, setModalSalario] = useState<string | null>(null);
  const [modalAdiantamento, setModalAdiantamento] = useState(false);
  const [modalPagarConta, setModalPagarConta] = useState<number | null>(null);

  // Sub-tab for salários
  const [subTabSalario, setSubTabSalario] = useState<SubTabSalario>("salarios");

  // Filter for despesas
  const [catDespesaFilter, setCatDespesaFilter] = useState<string | null>(null);

  // Expandable fornecedor
  const [expandedFornecedor, setExpandedFornecedor] = useState<number | null>(null);

  // ===== COMPUTED =====
  const totalEntradas = movimentacoes.filter(m => m.tipo === "Entrada").reduce((a, m) => a + m.valor, 0);
  const totalSaidas = movimentacoes.filter(m => m.tipo === "Saída").reduce((a, m) => a + m.valor, 0);
  const lucroLiquido = totalEntradas - totalSaidas;
  const saldoCaixa = lucroLiquido + 150000; // simulated opening balance

  const contasVencidasCount = contasPagar.filter(c => c.status === "Vencida").length;
  const comissoesPendentes = salariosConfig.filter(s => s.comissaoPct > 0).length;
  const adiantNaoDescontado = adiantamentos.filter(a => a.status === "Aprovado — aguardando desconto").length;

  // Pagination
  const movPag = usePagination(movimentacoes);
  const cpPag = usePagination(contasPagar);
  const crPag = usePagination(contasReceber);
  const despFiltradas = catDespesaFilter ? despesas.filter(d => d.categoria === catDespesaFilter) : despesas;
  const dePag = usePagination(despFiltradas);

  // Helper for exports
  const exportData = (title: string, fileName: string, columns: any[], data: any[], fmt: "pdf" | "excel") => {
    const opts = { title, fileName, columns, data };
    fmt === "pdf" ? exportToPDF(opts) : exportToExcel(opts);
    toast({ title: `${title} exportado em ${fmt.toUpperCase()}` });
  };

  // Generic save toast
  const saved = (msg: string) => toast({ title: msg });

  // ===== TABS CONFIG =====
  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: "visao-geral", label: "Visão Geral", icon: BarChart3 },
    { key: "fluxo-caixa", label: "Fluxo de Caixa", icon: TrendingUp },
    { key: "entradas-saidas", label: "Entradas & Saídas", icon: ArrowUpCircle },
    { key: "contas-pagar", label: "Contas a Pagar", icon: ArrowDownCircle },
    { key: "contas-receber", label: "Contas a Receber", icon: Receipt },
    { key: "despesas", label: "Despesas", icon: CreditCard },
    { key: "fornecedores", label: "Fornecedores", icon: Truck },
    { key: "salarios", label: "Salários & Comissões", icon: Users },
    { key: "fechamento", label: "Fechamento de Caixa", icon: ClipboardList },
    { key: "dre", label: "DRE", icon: FileText },
    { key: "produtos", label: "Produtos Vendidos", icon: Package },
  ];

  // ===== FECHAMENTO COMPUTADOS =====
  const fcReceitaServicos = fechamento.atendimentos.reduce((a, at) => a + at.valor, 0);
  const fcReceitaProdutos = fechamento.receitaProdutos;
  const fcDescontos = fechamento.descontos;
  const fcReceitaLiquida = fcReceitaServicos + fcReceitaProdutos - fcDescontos;
  const fcDespesasDia = fechamento.saidasDia.reduce((a, s) => a + s.valor, 0);
  const fcSaldoDia = fcReceitaLiquida - fcDespesasDia;
  const fcDinheiro = fechamento.atendimentos.filter(a => a.formaPgto === "Dinheiro").reduce((a, at) => a + at.valor, 0);
  const fcTransferencia = fechamento.atendimentos.filter(a => a.formaPgto === "Transferência").reduce((a, at) => a + at.valor, 0);
  const fcTPA = fechamento.atendimentos.filter(a => a.formaPgto === "TPA").reduce((a, at) => a + at.valor, 0);

  // ===== DRE COMPUTADOS =====
  const d = dreData;
  const receitaBruta = d.servicosPrestados + d.vendaProdutos;
  const receitaLiquida = receitaBruta - d.descontosConcedidos;
  const totalDespOp = Object.values(d.despesasOperacionais).reduce((a, v) => a + v, 0);
  const totalDespPessoal = Object.values(d.despesasPessoal).reduce((a, v) => a + v, 0);
  const lucroOperacional = receitaLiquida - totalDespOp - totalDespPessoal - d.compraFornecedores;
  const margemLiquida = ((lucroOperacional / receitaBruta) * 100).toFixed(1);

  // ===== PRODUTOS COMPUTADOS =====
  const totalVendidoKz = produtosVendidos.reduce((a, p) => a + p.preco * p.unidades, 0);
  const totalUnidades = produtosVendidos.reduce((a, p) => a + p.unidades, 0);
  const produtoMaisVendido = [...produtosVendidos].sort((a, b) => b.unidades - a.unidades)[0];
  const margemMedia = produtosVendidos.length > 0
    ? (produtosVendidos.reduce((a, p) => a + ((p.preco - p.custo) / p.preco) * 100, 0) / produtosVendidos.length).toFixed(1)
    : "0";

  // Redirect non-authorized (after all hooks)
  if (perfil === "Colaborador") return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6">
      {/* ALERTAS GLOBAIS */}
      <div className="space-y-2">
        {contasVencidasCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            <Bell className="h-4 w-4" /> 🔴 {contasVencidasCount} conta(s) vencida(s) — ação necessária
          </div>
        )}
        {comissoesPendentes > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm text-primary">
            <Bell className="h-4 w-4" /> 🟡 {comissoesPendentes} profissional(is) com comissão pendente de pagamento
          </div>
        )}
        {adiantNaoDescontado > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-gold/10 px-4 py-2.5 text-sm text-primary">
            <Bell className="h-4 w-4" /> 🟠 {adiantNaoDescontado} adiantamento(s) não descontado(s) ainda
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-1 scrollbar-thin">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-medium transition-colors ${tab === t.key ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-text3 hover:text-foreground hover:bg-surface2"}`}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ==================== ABA 1: VISÃO GERAL ==================== */}
      {tab === "visao-geral" && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Receita do Mês" value={format(468000)} icon={TrendingUp} color="bg-green-custom/10 text-green-custom" variacao={{ valor: "+2,6%", positivo: true }} />
            <KpiCard label="Despesas do Mês" value={format(385500)} icon={TrendingDown} color="bg-destructive/10 text-destructive" variacao={{ valor: "+21%", positivo: false }} />
            <KpiCard label="Lucro Líquido" value={format(82500)} icon={DollarSign} color={`${82500 >= 0 ? "bg-green-custom/10 text-green-custom" : "bg-destructive/10 text-destructive"}`} />
            <KpiCard label="Saldo em Caixa" value={format(saldoCaixa)} icon={Wallet} color="bg-primary/10 text-primary" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5 card-hover">
              <h3 className="font-display text-base font-semibold text-foreground mb-4">Receita vs Despesas vs Lucro — 6 meses</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={receitaDespesasMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 90%)" />
                  <XAxis dataKey="mes" tick={{ fill: "hsl(280 15% 60%)", fontSize: 12 }} axisLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="receita" fill="hsl(150 50% 40%)" radius={[4,4,0,0]} name="Receita" />
                  <Bar dataKey="despesas" fill="hsl(350 55% 57%)" radius={[4,4,0,0]} name="Despesas" />
                  <Bar dataKey="lucro" fill="hsl(35 50% 50%)" radius={[4,4,0,0]} name="Lucro" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 card-hover">
              <h3 className="font-display text-base font-semibold text-foreground mb-4">Por Forma de Pagamento</h3>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={formaPagamentoData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                      {formaPagamentoData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {formaPagamentoData.map((s, i) => (
                  <span key={s.name} className="flex items-center gap-1.5 text-xs text-text2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />{s.name}: {format(s.value)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 card-hover">
            <h3 className="font-display text-base font-semibold text-foreground mb-4">Top 5 Serviços por Receita no Mês</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topServicosReceita} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 90%)" />
                <XAxis type="number" tick={{ fill: "hsl(280 15% 60%)", fontSize: 12 }} axisLine={false} />
                <YAxis dataKey="nome" type="category" width={140} tick={{ fill: "hsl(280 15% 60%)", fontSize: 11 }} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="receita" fill="hsl(35 50% 50%)" radius={[0,4,4,0]} name="Receita (Kz)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ==================== ABA 2: FLUXO DE CAIXA ==================== */}
      {tab === "fluxo-caixa" && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <KpiCard label="Total Entradas" value={format(totalEntradas)} icon={ArrowUpCircle} color="bg-green-custom/10 text-green-custom" />
            <KpiCard label="Total Saídas" value={format(totalSaidas)} icon={ArrowDownCircle} color="bg-destructive/10 text-destructive" />
            <KpiCard label="Saldo do Período" value={format(lucroLiquido)} icon={Wallet} color="bg-primary/10 text-primary" />
            <KpiCard label="Maior Entrada" value={format(Math.max(...movimentacoes.filter(m=>m.tipo==="Entrada").map(m=>m.valor)))} icon={TrendingUp} color="bg-green-custom/10 text-green-custom" />
            <KpiCard label="Maior Saída" value={format(Math.max(...movimentacoes.filter(m=>m.tipo==="Saída").map(m=>m.valor)))} icon={TrendingDown} color="bg-destructive/10 text-destructive" />
          </div>

          <div className="rounded-xl border border-border bg-card p-5 card-hover">
            <h3 className="font-display text-base font-semibold text-foreground mb-4">Fluxo Diário — Entradas vs Saídas</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={fluxoCaixaDiario}>
                <defs>
                  <linearGradient id="colorEnt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(150 50% 40%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(150 50% 40%)" stopOpacity={0} /></linearGradient>
                  <linearGradient id="colorSai" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(350 55% 57%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(350 55% 57%)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 90%)" />
                <XAxis dataKey="dia" tick={{ fill: "hsl(280 15% 60%)", fontSize: 12 }} axisLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="entradas" stroke="hsl(150 50% 40%)" fill="url(#colorEnt)" strokeWidth={2} name="Entradas" />
                <Area type="monotone" dataKey="saidas" stroke="hsl(350 55% 57%)" fill="url(#colorSai)" strokeWidth={2} name="Saídas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-foreground">Movimentações</h3>
              <ExportButtons
                onPdf={() => exportData("Fluxo de Caixa", "fluxo-caixa", [{ header: "Data", key: "data" }, { header: "Descrição", key: "descricao" }, { header: "Tipo", key: "tipo" }, { header: "Valor", key: "valorFmt" }], movimentacoes.map(m => ({ ...m, valorFmt: format(m.valor) })), "pdf")}
                onExcel={() => exportData("Fluxo de Caixa", "fluxo-caixa", [{ header: "Data", key: "data" }, { header: "Descrição", key: "descricao" }, { header: "Tipo", key: "tipo" }, { header: "Valor", key: "valorFmt" }], movimentacoes.map(m => ({ ...m, valorFmt: format(m.valor) })), "excel")}
              />
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-text3">
                <th className="p-3 text-left">Data</th><th className="p-3 text-left">Hora</th><th className="p-3 text-left">Descrição</th>
                <th className="p-3 text-left hidden md:table-cell">Categoria</th><th className="p-3 text-left">Entrada</th><th className="p-3 text-left">Saída</th><th className="p-3 text-left">Saldo Acum.</th>
              </tr></thead>
              <tbody>
                {(() => { let saldo = 0; return movPag.paginated.map(m => { saldo += m.tipo === "Entrada" ? m.valor : -m.valor; return (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-surface2/50">
                    <td className="p-3 text-text3">{m.data}</td><td className="p-3 text-text3">{m.hora}</td>
                    <td className="p-3 text-foreground">{m.descricao}</td>
                    <td className="p-3 text-text2 hidden md:table-cell">{m.categoria}</td>
                    <td className="p-3 text-green-custom font-medium">{m.tipo === "Entrada" ? format(m.valor) : "—"}</td>
                    <td className="p-3 text-destructive font-medium">{m.tipo === "Saída" ? format(m.valor) : "—"}</td>
                    <td className={`p-3 font-semibold ${saldo >= 0 ? "text-green-custom" : "text-destructive"}`}>{format(Math.abs(saldo))}</td>
                  </tr>); }); })()}
              </tbody>
            </table>
            <PaginationControls {...movPag} />
          </div>
        </>
      )}

      {/* ==================== ABA 3: ENTRADAS & SAÍDAS ==================== */}
      {tab === "entradas-saidas" && (
        <>
          <div className="flex gap-3">
            <button onClick={() => setModalEntrada(true)} className="flex items-center gap-2 rounded-lg bg-green-custom px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> Nova Entrada
            </button>
            <button onClick={() => setModalSaida(true)} className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> Nova Saída
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-foreground">Todas as Movimentações</h3>
              <ExportButtons
                onPdf={() => exportData("Entradas & Saídas", "entradas-saidas", [{ header: "Data", key: "data" }, { header: "Tipo", key: "tipo" }, { header: "Descrição", key: "descricao" }, { header: "Valor", key: "valorFmt" }], movimentacoes.map(m => ({ ...m, valorFmt: format(m.valor) })), "pdf")}
                onExcel={() => exportData("Entradas & Saídas", "entradas-saidas", [{ header: "Data", key: "data" }, { header: "Tipo", key: "tipo" }, { header: "Descrição", key: "descricao" }, { header: "Valor", key: "valorFmt" }], movimentacoes.map(m => ({ ...m, valorFmt: format(m.valor) })), "excel")}
              />
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-text3">
                <th className="p-3 text-left">Data</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Descrição</th>
                <th className="p-3 text-left hidden md:table-cell">Categoria</th><th className="p-3 text-left hidden md:table-cell">Beneficiário/Origem</th>
                <th className="p-3 text-left">Valor</th><th className="p-3 text-left hidden md:table-cell">Forma Pgto</th><th className="p-3 text-left hidden lg:table-cell">Registrado por</th><th className="p-3 text-left">Ações</th>
              </tr></thead>
              <tbody>
                {movPag.paginated.map(m => (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-surface2/50">
                    <td className="p-3 text-text3">{m.data}</td>
                    <td className="p-3"><StatusBadge status={m.tipo} /></td>
                    <td className="p-3 text-foreground">{m.descricao}</td>
                    <td className="p-3 text-text2 hidden md:table-cell">{m.categoria}</td>
                    <td className="p-3 text-text2 hidden md:table-cell">{m.beneficiarioOrigem || "—"}</td>
                    <td className={`p-3 font-semibold ${m.tipo === "Entrada" ? "text-green-custom" : "text-destructive"}`}>{format(m.valor)}</td>
                    <td className="p-3 text-text2 hidden md:table-cell">{m.formaPgto}</td>
                    <td className="p-3 text-text3 hidden lg:table-cell">{m.registradoPor}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button className="rounded p-1 hover:bg-surface2"><Eye className="h-3.5 w-3.5 text-text3" /></button>
                        <button className="rounded p-1 hover:bg-surface2"><Pencil className="h-3.5 w-3.5 text-text3" /></button>
                        <button onClick={() => { setMovimentacoes(prev => prev.filter(x => x.id !== m.id)); saved("Movimentação excluída"); }} className="rounded p-1 hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls {...movPag} />
          </div>
        </>
      )}

      {/* ==================== ABA 4: CONTAS A PAGAR ==================== */}
      {tab === "contas-pagar" && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="A vencer hoje" value={String(contasPagar.filter(c => c.vencimento === "2025-03-04" && c.status === "Pendente").length)} icon={Calendar} color="bg-primary/10 text-primary" />
            <KpiCard label="A vencer esta semana" value={String(contasPagar.filter(c => c.status === "Pendente").length)} icon={AlertTriangle} color="bg-gold/10 text-primary" />
            <KpiCard label="Vencidas" value={String(contasPagar.filter(c => c.status === "Vencida").length)} icon={Bell} color="bg-destructive/10 text-destructive" />
            <KpiCard label="Pagas este mês" value={String(contasPagar.filter(c => c.status === "Paga" || c.status === "Paga com atraso").length)} icon={Check} color="bg-green-custom/10 text-green-custom" />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setModalContaPagar(true)} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              <Plus className="h-4 w-4" /> Nova Conta a Pagar
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-text3">
                <th className="p-3 text-left">Fornecedor/Beneficiário</th><th className="p-3 text-left">Descrição</th>
                <th className="p-3 text-left hidden md:table-cell">Categoria</th><th className="p-3 text-left">Valor</th>
                <th className="p-3 text-left">Vencimento</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Ações</th>
              </tr></thead>
              <tbody>
                {cpPag.paginated.map(c => {
                  const isVencida = c.status === "Vencida";
                  const venceBreve = c.status === "Pendente" && c.vencimento <= "2025-03-07";
                  return (
                    <tr key={c.id} className={`border-b border-border/50 hover:bg-surface2/50 ${isVencida ? "bg-destructive/5" : venceBreve ? "bg-primary/5" : ""}`}>
                      <td className="p-3 text-foreground font-medium">{c.fornecedorBeneficiario} {isVencida && <Bell className="inline h-3.5 w-3.5 text-destructive ml-1" />}</td>
                      <td className="p-3 text-text2">{c.descricao}</td>
                      <td className="p-3 text-text3 hidden md:table-cell">{c.categoria}</td>
                      <td className="p-3 font-semibold text-foreground">{format(c.valor)}</td>
                      <td className="p-3 text-text3">{c.vencimento}</td>
                      <td className="p-3"><StatusBadge status={c.status} /></td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {(c.status === "Pendente" || c.status === "Vencida") && (
                            <button onClick={() => { setContasPagar(prev => prev.map(x => x.id === c.id ? { ...x, status: "Paga", dataPagamento: "2025-03-04" } : x)); saved("Conta marcada como paga"); }}
                              className="rounded-lg bg-green-custom/10 px-2 py-1 text-xs text-green-custom hover:bg-green-custom/20">Pagar</button>
                          )}
                          <button className="rounded p-1 hover:bg-surface2"><Pencil className="h-3.5 w-3.5 text-text3" /></button>
                          <button onClick={() => { setContasPagar(prev => prev.filter(x => x.id !== c.id)); saved("Conta excluída"); }} className="rounded p-1 hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <PaginationControls {...cpPag} />
          </div>
        </>
      )}

      {/* ==================== ABA 5: CONTAS A RECEBER ==================== */}
      {tab === "contas-receber" && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Total em Aberto" value={format(contasReceber.filter(c => c.status !== "Quitado").reduce((a, c) => a + (c.valorTotal - c.valorPago), 0))} icon={Receipt} color="bg-primary/10 text-primary" />
            <KpiCard label="Recebido este mês" value={format(contasReceber.reduce((a, c) => a + c.valorPago, 0))} icon={ArrowUpCircle} color="bg-green-custom/10 text-green-custom" />
            <KpiCard label="Vencido" value={format(contasReceber.filter(c => c.status === "Vencido").reduce((a, c) => a + (c.valorTotal - c.valorPago), 0))} icon={AlertTriangle} color="bg-destructive/10 text-destructive" />
            <KpiCard label="A vencer" value={format(contasReceber.filter(c => c.status === "Em aberto" || c.status === "Parcialmente pago").reduce((a, c) => a + (c.valorTotal - c.valorPago), 0))} icon={Calendar} color="bg-teal-custom/10 text-teal-custom" />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setModalFiado(true)} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              <Plus className="h-4 w-4" /> Registrar Fiado
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-text3">
                <th className="p-3 text-left">Cliente</th><th className="p-3 text-left">Serviço/Descrição</th>
                <th className="p-3 text-left">Valor Total</th><th className="p-3 text-left">Valor Pago</th>
                <th className="p-3 text-left">Saldo Devedor</th><th className="p-3 text-left">Vencimento</th>
                <th className="p-3 text-left">Status</th><th className="p-3 text-left">Ações</th>
              </tr></thead>
              <tbody>
                {crPag.paginated.map(c => (
                  <tr key={c.id} className={`border-b border-border/50 hover:bg-surface2/50 ${c.status === "Vencido" ? "bg-destructive/5" : ""}`}>
                    <td className="p-3 text-foreground font-medium">{c.cliente}</td>
                    <td className="p-3 text-text2">{c.servico}</td>
                    <td className="p-3 text-foreground">{format(c.valorTotal)}</td>
                    <td className="p-3 text-green-custom">{format(c.valorPago)}</td>
                    <td className="p-3 font-semibold text-destructive">{format(c.valorTotal - c.valorPago)}</td>
                    <td className="p-3 text-text3">{c.vencimento}</td>
                    <td className="p-3"><StatusBadge status={c.status} /></td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {c.status !== "Quitado" && (
                          <button onClick={() => setModalPagamento(c.id)} className="rounded-lg bg-green-custom/10 px-2 py-1 text-xs text-green-custom hover:bg-green-custom/20">Receber</button>
                        )}
                        <button className="rounded p-1 hover:bg-surface2"><Eye className="h-3.5 w-3.5 text-text3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls {...crPag} />
          </div>
        </>
      )}

      {/* ==================== ABA 6: DESPESAS ==================== */}
      {tab === "despesas" && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => setCatDespesaFilter(null)} className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${!catDespesaFilter ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-surface2 text-text3 hover:bg-surface3"}`}>Todas</button>
                {categoriasDespesa.map(c => (
                  <button key={c.key} onClick={() => setCatDespesaFilter(c.key)}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${catDespesaFilter === c.key ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-surface2 text-text3 hover:bg-surface3"}`}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>

              <button onClick={() => setModalDespesa(true)} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground mb-4">
                <Plus className="h-4 w-4" /> Nova Despesa
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 card-hover">
              <h3 className="font-display text-sm font-semibold text-foreground mb-3">Despesas por Categoria</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={(() => {
                    const grouped = despesas.reduce((acc, d) => { acc[d.categoria] = (acc[d.categoria] || 0) + d.valor; return acc; }, {} as Record<string,number>);
                    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
                  })()} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                    {Object.keys(despesas.reduce((acc, d) => { acc[d.categoria] = 1; return acc; }, {} as Record<string,number>)).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-text3">
                <th className="p-3 text-left">Data</th><th className="p-3 text-left">Descrição</th><th className="p-3 text-left">Categoria</th>
                <th className="p-3 text-left hidden md:table-cell">Fornecedor</th><th className="p-3 text-left">Valor</th>
                <th className="p-3 text-left hidden md:table-cell">Forma Pgto</th><th className="p-3 text-left hidden lg:table-cell">Registrado por</th><th className="p-3 text-left">Ações</th>
              </tr></thead>
              <tbody>
                {dePag.paginated.map(d => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-surface2/50">
                    <td className="p-3 text-text3">{d.data}</td><td className="p-3 text-foreground">{d.descricao}</td>
                    <td className="p-3 text-text2">{d.categoria}</td><td className="p-3 text-text3 hidden md:table-cell">{d.fornecedor || "—"}</td>
                    <td className="p-3 font-semibold text-destructive">{format(d.valor)}</td><td className="p-3 text-text3 hidden md:table-cell">{d.formaPgto}</td>
                    <td className="p-3 text-text3 hidden lg:table-cell">{d.registradoPor}</td>
                    <td className="p-3"><div className="flex gap-1">
                      <button className="rounded p-1 hover:bg-surface2"><Pencil className="h-3.5 w-3.5 text-text3" /></button>
                      <button onClick={() => { setDespesas(prev => prev.filter(x => x.id !== d.id)); saved("Despesa excluída"); }} className="rounded p-1 hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls {...dePag} />
          </div>
        </>
      )}

      {/* ==================== ABA 7: FORNECEDORES ==================== */}
      {tab === "fornecedores" && (
        <>
          <div className="flex gap-3 mb-4">
            <button onClick={() => setModalFornecedor(true)} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              <Plus className="h-4 w-4" /> Novo Fornecedor
            </button>
            <button onClick={() => setModalCompraFornecedor(true)} className="flex items-center gap-2 rounded-lg bg-surface2 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface3">
              <ShoppingBag className="h-4 w-4" /> Registrar Compra
            </button>
          </div>

          <div className="space-y-3">
            {fornecedores.map(f => (
              <div key={f.id} className="rounded-xl border border-border bg-card card-hover">
                <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedFornecedor(expandedFornecedor === f.id ? null : f.id)}>
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-primary/10 p-2.5"><Building2 className="h-5 w-5 text-primary" /></div>
                    <div>
                      <p className="font-medium text-foreground">{f.nome}</p>
                      <p className="text-xs text-text3">{f.categoria} · {f.contato}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-text3">Saldo devedor</p>
                      <p className={`font-display text-lg font-bold ${f.saldoDevedor > 0 ? "text-destructive" : "text-green-custom"}`}>{format(f.saldoDevedor)}</p>
                    </div>
                    {expandedFornecedor === f.id ? <ChevronUp className="h-4 w-4 text-text3" /> : <ChevronDown className="h-4 w-4 text-text3" />}
                  </div>
                </div>
                {expandedFornecedor === f.id && (
                  <div className="border-t border-border p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 text-sm">
                      <div><p className="text-xs text-text3">NIF</p><p className="text-foreground">{f.nif}</p></div>
                      <div><p className="text-xs text-text3">E-mail</p><p className="text-foreground">{f.email || "—"}</p></div>
                      <div><p className="text-xs text-text3">Endereço</p><p className="text-foreground">{f.endereco || "—"}</p></div>
                      <div><p className="text-xs text-text3">Última compra</p><p className="text-foreground">{f.ultimaCompra}</p></div>
                    </div>
                    {f.historicoCompras && f.historicoCompras.length > 0 && (
                      <div>
                        <p className="text-xs text-text3 mb-2 font-medium">Histórico de compras</p>
                        <div className="space-y-1">
                          {f.historicoCompras.map((h, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg bg-surface2 px-3 py-2 text-xs">
                              <span className="text-text3">{h.data}</span>
                              <span className="text-foreground">{h.descricao}</span>
                              <span className="text-foreground font-medium">{format(h.valor)}</span>
                              <span className={h.pago >= h.valor ? "text-green-custom" : "text-destructive"}>{h.pago >= h.valor ? "Pago" : `Deve ${format(h.valor - h.pago)}`}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ==================== ABA 8: SALÁRIOS & COMISSÕES ==================== */}
      {tab === "salarios" && (
        <>
          <div className="flex gap-1 border-b border-border pb-1 mb-4">
            {(["salarios", "comissoes", "adiantamentos"] as SubTabSalario[]).map(st => (
              <button key={st} onClick={() => setSubTabSalario(st)}
                className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${subTabSalario === st ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-text3 hover:text-foreground"}`}>
                {st === "salarios" ? "Salários" : st === "comissoes" ? "Comissões" : "Adiantamentos"}
              </button>
            ))}
          </div>

          {/* Sub: SALÁRIOS */}
          {subTabSalario === "salarios" && (
            <div className="rounded-xl border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-xs text-text3">
                  <th className="p-3 text-left">Profissional</th><th className="p-3 text-left">Tipo Remuneração</th>
                  <th className="p-3 text-left">Valor Base</th><th className="p-3 text-left">Comissão (%)</th>
                  <th className="p-3 text-left">Total Calculado</th><th className="p-3 text-left">Ações</th>
                </tr></thead>
                <tbody>
                  {salariosConfig.map(s => {
                    const comissao = Math.round(s.receitaGeradaMes * s.comissaoPct / 100);
                    const adiantDesc = adiantamentos.filter(a => a.profissional === s.profissional && a.status === "Aprovado — aguardando desconto").reduce((a, ad) => a + ad.valorAprovado, 0);
                    const total = s.fixo + comissao - adiantDesc;
                    return (
                      <tr key={s.profissionalId} className="border-b border-border/50 hover:bg-surface2/50">
                        <td className="p-3 font-medium text-foreground">{s.profissional}</td>
                        <td className="p-3"><StatusBadge status={s.tipo} /></td>
                        <td className="p-3 text-foreground">{s.fixo > 0 ? format(s.fixo) : "—"}</td>
                        <td className="p-3 text-text2">{s.comissaoPct}%</td>
                        <td className="p-3 font-bold text-foreground">{format(total)}</td>
                        <td className="p-3">
                          <button onClick={() => setModalSalario(s.profissional)} className="rounded-lg bg-green-custom/10 px-2.5 py-1 text-xs text-green-custom hover:bg-green-custom/20">Pagar Salário</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub: COMISSÕES */}
          {subTabSalario === "comissoes" && (
            <>
              <button onClick={() => saved("Comissões recalculadas com base nos atendimentos do mês")} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground mb-4">
                <BarChart3 className="h-4 w-4" /> Calcular comissões do mês
              </button>
              <div className="rounded-xl border border-border bg-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-xs text-text3">
                    <th className="p-3 text-left">Profissional</th><th className="p-3 text-left">Atendimentos</th>
                    <th className="p-3 text-left">Receita Gerada</th><th className="p-3 text-left">% Comissão</th>
                    <th className="p-3 text-left">Valor Comissão</th><th className="p-3 text-left">Status</th>
                  </tr></thead>
                  <tbody>
                    {salariosConfig.filter(s => s.comissaoPct > 0).map(s => {
                      const comissao = Math.round(s.receitaGeradaMes * s.comissaoPct / 100);
                      return (
                        <tr key={s.profissionalId} className="border-b border-border/50 hover:bg-surface2/50">
                          <td className="p-3 font-medium text-foreground">{s.profissional}</td>
                          <td className="p-3 text-text2">{s.atendimentosMes}</td>
                          <td className="p-3 text-foreground">{format(s.receitaGeradaMes)}</td>
                          <td className="p-3 text-text2">{s.comissaoPct}%</td>
                          <td className="p-3 font-bold text-primary">{format(comissao)}</td>
                          <td className="p-3"><StatusBadge status={s.tipo === "Fixo + comissão" ? "Incluída no salário" : "Pendente pagamento"} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Sub: ADIANTAMENTOS */}
          {subTabSalario === "adiantamentos" && (
            <>
              <button onClick={() => setModalAdiantamento(true)} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground mb-4">
                <Plus className="h-4 w-4" /> Novo Adiantamento
              </button>
              <div className="rounded-xl border border-border bg-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-xs text-text3">
                    <th className="p-3 text-left">Data</th><th className="p-3 text-left">Profissional</th>
                    <th className="p-3 text-left">Valor Solicitado</th><th className="p-3 text-left">Valor Aprovado</th>
                    <th className="p-3 text-left hidden md:table-cell">Aprovado por</th><th className="p-3 text-left">Mês Desconto</th>
                    <th className="p-3 text-left">Status</th><th className="p-3 text-left">Ações</th>
                  </tr></thead>
                  <tbody>
                    {adiantamentos.map(a => (
                      <tr key={a.id} className={`border-b border-border/50 hover:bg-surface2/50 ${a.status === "Pendente aprovação" ? "bg-primary/5" : a.status === "Aprovado — aguardando desconto" ? "bg-gold/5" : "bg-green-custom/5"}`}>
                        <td className="p-3 text-text3">{a.data}</td>
                        <td className="p-3 font-medium text-foreground">{a.profissional}</td>
                        <td className="p-3 text-foreground">{format(a.valorSolicitado)}</td>
                        <td className="p-3 text-foreground">{a.valorAprovado > 0 ? format(a.valorAprovado) : "—"}</td>
                        <td className="p-3 text-text3 hidden md:table-cell">{a.aprovadoPor || "—"}</td>
                        <td className="p-3 text-text3">{a.mesDesconto}</td>
                        <td className="p-3"><StatusBadge status={a.status} /></td>
                        <td className="p-3">
                          {a.status === "Pendente aprovação" && (
                            <button onClick={() => { setAdiantamentos(prev => prev.map(x => x.id === a.id ? { ...x, status: "Aprovado — aguardando desconto", valorAprovado: x.valorSolicitado, aprovadoPor: usuarioLogado?.nome || "" } : x)); saved("Adiantamento aprovado"); }}
                              className="rounded-lg bg-green-custom/10 px-2.5 py-1 text-xs text-green-custom hover:bg-green-custom/20">Aprovar</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ==================== ABA 9: FECHAMENTO DE CAIXA ==================== */}
      {tab === "fechamento" && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Atendimentos" value={String(fechamento.atendimentos.length)} icon={Users} color="bg-primary/10 text-primary" />
            <KpiCard label="Receita Bruta" value={format(fcReceitaServicos)} icon={TrendingUp} color="bg-green-custom/10 text-green-custom" />
            <KpiCard label="Receita Produtos" value={format(fcReceitaProdutos)} icon={Package} color="bg-teal-custom/10 text-teal-custom" />
            <KpiCard label="Receita Líquida" value={format(fcReceitaLiquida)} icon={DollarSign} color="bg-primary/10 text-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <KpiCard label="Descontos" value={format(fcDescontos)} icon={TrendingDown} color="bg-destructive/10 text-destructive" />
            <KpiCard label="Despesas do Dia" value={format(fcDespesasDia)} icon={ArrowDownCircle} color="bg-destructive/10 text-destructive" />
            <KpiCard label="Saldo do Dia" value={format(fcSaldoDia)} icon={Wallet} color={fcSaldoDia >= 0 ? "bg-green-custom/10 text-green-custom" : "bg-destructive/10 text-destructive"} />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-display text-base font-semibold text-foreground mb-3">Breakdown por Forma de Pagamento</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-surface2 p-4 text-center"><p className="text-xs text-text3">Dinheiro</p><p className="font-display text-xl font-bold text-foreground">{format(fcDinheiro)}</p></div>
              <div className="rounded-lg bg-surface2 p-4 text-center"><p className="text-xs text-text3">Transferência</p><p className="font-display text-xl font-bold text-foreground">{format(fcTransferencia)}</p></div>
              <div className="rounded-lg bg-surface2 p-4 text-center"><p className="text-xs text-text3">TPA (cartão)</p><p className="font-display text-xl font-bold text-foreground">{format(fcTPA)}</p></div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <div className="p-5 border-b border-border"><h3 className="font-display text-base font-semibold text-foreground">Atendimentos do Dia</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-text3">
                <th className="p-3 text-left">Hora</th><th className="p-3 text-left">Cliente</th><th className="p-3 text-left">Serviço</th>
                <th className="p-3 text-left">Profissional</th><th className="p-3 text-left">Valor</th><th className="p-3 text-left">Forma Pgto</th>
              </tr></thead>
              <tbody>
                {fechamento.atendimentos.map((a, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-surface2/50">
                    <td className="p-3 text-text3">{a.hora}</td><td className="p-3 text-foreground">{a.cliente}</td>
                    <td className="p-3 text-text2">{a.servico}</td><td className="p-3 text-text2">{a.profissional}</td>
                    <td className="p-3 font-semibold text-foreground">{format(a.valor)}</td><td className="p-3 text-text3">{a.formaPgto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <div className="p-5 border-b border-border"><h3 className="font-display text-base font-semibold text-foreground">Saídas do Dia</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-text3">
                <th className="p-3 text-left">Hora</th><th className="p-3 text-left">Descrição</th><th className="p-3 text-left">Categoria</th><th className="p-3 text-left">Valor</th>
              </tr></thead>
              <tbody>
                {fechamento.saidasDia.map((s, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-surface2/50">
                    <td className="p-3 text-text3">{s.hora}</td><td className="p-3 text-foreground">{s.descricao}</td>
                    <td className="p-3 text-text2">{s.categoria}</td><td className="p-3 font-semibold text-destructive">{format(s.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!fechamento.fechado ? (
            <button onClick={() => { setFechamento(prev => ({ ...prev, fechado: true, fechadoPor: usuarioLogado?.nome || "", horaFechamento: "18:00" })); saved("✓ Caixa do dia fechado com sucesso"); }}
              className="w-full rounded-lg gold-gradient px-4 py-3 text-sm font-semibold text-primary-foreground">
              Fechar Caixa do Dia
            </button>
          ) : (
            <div className="rounded-lg bg-green-custom/10 px-4 py-3 text-center text-sm text-green-custom font-medium">
              ✓ Caixa fechado por {fechamento.fechadoPor} às {fechamento.horaFechamento}
            </div>
          )}
        </>
      )}

      {/* ==================== ABA 10: DRE ==================== */}
      {tab === "dre" && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => saved("PDF do DRE gerado com sucesso")} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              <Download className="h-4 w-4" /> Exportar PDF
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 font-mono text-sm space-y-4">
            <h3 className="font-display text-lg font-bold text-foreground text-center mb-6">DRE — Demonstrativo de Resultado do Exercício</h3>
            <p className="text-center text-xs text-text3 mb-6">Período: Março 2025</p>

            <div className="space-y-1">
              <p className="font-bold text-foreground">RECEITA BRUTA</p>
              <div className="flex justify-between pl-4"><span className="text-text2">(+) Serviços prestados</span><span className="text-foreground">{format(d.servicosPrestados)}</span></div>
              <div className="flex justify-between pl-4"><span className="text-text2">(+) Venda de produtos</span><span className="text-foreground">{format(d.vendaProdutos)}</span></div>
              <div className="border-t border-border my-2" />
              <div className="flex justify-between font-bold"><span className="text-foreground">= RECEITA BRUTA TOTAL</span><span className="text-foreground">{format(receitaBruta)}</span></div>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-foreground">DEDUÇÕES</p>
              <div className="flex justify-between pl-4"><span className="text-text2">(-) Descontos concedidos</span><span className="text-destructive">{format(d.descontosConcedidos)}</span></div>
              <div className="border-t border-border my-2" />
              <div className="flex justify-between font-bold"><span className="text-foreground">= RECEITA LÍQUIDA</span><span className="text-foreground">{format(receitaLiquida)}</span></div>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-foreground">DESPESAS OPERACIONAIS</p>
              <div className="flex justify-between pl-4"><span className="text-text2">(-) Aluguel</span><span className="text-destructive">{format(d.despesasOperacionais.aluguel)}</span></div>
              <div className="flex justify-between pl-4"><span className="text-text2">(-) Água e energia</span><span className="text-destructive">{format(d.despesasOperacionais.aguaEnergia)}</span></div>
              <div className="flex justify-between pl-4"><span className="text-text2">(-) Internet e telefone</span><span className="text-destructive">{format(d.despesasOperacionais.internetTelefone)}</span></div>
              <div className="flex justify-between pl-4"><span className="text-text2">(-) Marketing</span><span className="text-destructive">{format(d.despesasOperacionais.marketing)}</span></div>
              <div className="flex justify-between pl-4"><span className="text-text2">(-) Manutenção</span><span className="text-destructive">{format(d.despesasOperacionais.manutencao)}</span></div>
              <div className="flex justify-between pl-4"><span className="text-text2">(-) Outros</span><span className="text-destructive">{format(d.despesasOperacionais.outros)}</span></div>
              <div className="border-t border-border my-2" />
              <div className="flex justify-between font-bold"><span className="text-foreground">= TOTAL DESPESAS OPERACIONAIS</span><span className="text-destructive">{format(totalDespOp)}</span></div>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-foreground">DESPESAS COM PESSOAL</p>
              <div className="flex justify-between pl-4"><span className="text-text2">(-) Salários fixos</span><span className="text-destructive">{format(d.despesasPessoal.salarios)}</span></div>
              <div className="flex justify-between pl-4"><span className="text-text2">(-) Comissões pagas</span><span className="text-destructive">{format(d.despesasPessoal.comissoes)}</span></div>
              <div className="flex justify-between pl-4"><span className="text-text2">(-) Adiantamentos descontados</span><span className="text-destructive">{format(d.despesasPessoal.adiantamentos)}</span></div>
              <div className="border-t border-border my-2" />
              <div className="flex justify-between font-bold"><span className="text-foreground">= TOTAL DESPESAS PESSOAL</span><span className="text-destructive">{format(totalDespPessoal)}</span></div>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-foreground">DESPESAS COM FORNECEDORES</p>
              <div className="flex justify-between pl-4"><span className="text-text2">(-) Compra de produtos/insumos</span><span className="text-destructive">{format(d.compraFornecedores)}</span></div>
            </div>

            <div className="border-t-2 border-primary my-4" />
            <div className="flex justify-between text-lg font-bold">
              <span className="text-foreground">= LUCRO OPERACIONAL</span>
              <span className={lucroOperacional >= 0 ? "text-green-custom" : "text-destructive"}>{format(lucroOperacional)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span className="text-foreground">= MARGEM LÍQUIDA</span>
              <span className={lucroOperacional >= 0 ? "text-green-custom" : "text-destructive"}>{margemLiquida}%</span>
            </div>
          </div>
        </>
      )}

      {/* ==================== ABA 11: PRODUTOS VENDIDOS ==================== */}
      {tab === "produtos" && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Total Vendido" value={format(totalVendidoKz)} icon={DollarSign} color="bg-green-custom/10 text-green-custom" />
            <KpiCard label="Unidades Vendidas" value={String(totalUnidades)} icon={Package} color="bg-primary/10 text-primary" />
            <KpiCard label="Mais Vendido" value={produtoMaisVendido?.nome || "—"} icon={TrendingUp} color="bg-teal-custom/10 text-teal-custom" />
            <KpiCard label="Margem Média" value={`${margemMedia}%`} icon={BarChart3} color="bg-gold/10 text-primary" />
          </div>

          <div className="rounded-xl border border-border bg-card p-5 card-hover">
            <h3 className="font-display text-base font-semibold text-foreground mb-4">Top 8 Produtos por Receita</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...produtosVendidos].map(p => ({ ...p, receita: p.preco * p.unidades })).sort((a, b) => b.receita - a.receita).slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 90%)" />
                <XAxis type="number" tick={{ fill: "hsl(280 15% 60%)", fontSize: 12 }} axisLine={false} />
                <YAxis dataKey="nome" type="category" width={180} tick={{ fill: "hsl(280 15% 60%)", fontSize: 11 }} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="receita" fill="hsl(35 50% 50%)" radius={[0,4,4,0]} name="Receita (Kz)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-text3">
                <th className="p-3 text-left">Produto</th><th className="p-3 text-left">Categoria</th>
                <th className="p-3 text-left">Unidades</th><th className="p-3 text-left">Preço Unit.</th>
                <th className="p-3 text-left">Receita Total</th><th className="p-3 text-left">Custo Total</th><th className="p-3 text-left">Margem</th>
              </tr></thead>
              <tbody>
                {produtosVendidos.map(p => {
                  const receita = p.preco * p.unidades;
                  const custoTotal = p.custo * p.unidades;
                  const margem = ((p.preco - p.custo) / p.preco * 100).toFixed(1);
                  return (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-surface2/50">
                      <td className="p-3 font-medium text-foreground">{p.nome}</td>
                      <td className="p-3 text-text2">{p.categoria}</td>
                      <td className="p-3 text-text2">{p.unidades}</td>
                      <td className="p-3 text-foreground">{format(p.preco)}</td>
                      <td className="p-3 font-semibold text-green-custom">{format(receita)}</td>
                      <td className="p-3 text-destructive">{format(custoTotal)}</td>
                      <td className="p-3 text-primary font-medium">{margem}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ==================== MODAIS ==================== */}

      {/* Modal Nova Entrada */}
      <Modal open={modalEntrada} onClose={() => setModalEntrada(false)} title="Nova Entrada">
        <FormEntradaSaida tipo="Entrada" onSave={(m) => { setMovimentacoes(prev => [m, ...prev]); setModalEntrada(false); saved("Entrada registrada com sucesso"); }} />
      </Modal>

      {/* Modal Nova Saída */}
      <Modal open={modalSaida} onClose={() => setModalSaida(false)} title="Nova Saída">
        <FormEntradaSaida tipo="Saída" onSave={(m) => { setMovimentacoes(prev => [m, ...prev]); setModalSaida(false); saved("Saída registrada com sucesso"); }} />
      </Modal>

      {/* Modal Nova Conta a Pagar */}
      <Modal open={modalContaPagar} onClose={() => setModalContaPagar(false)} title="Nova Conta a Pagar">
        <FormContaPagar onSave={(c) => { setContasPagar(prev => [c, ...prev]); setModalContaPagar(false); saved("Conta a pagar registrada"); }} />
      </Modal>

      {/* Modal Registrar Fiado */}
      <Modal open={modalFiado} onClose={() => setModalFiado(false)} title="Registrar Fiado">
        <FormFiado onSave={(c) => { setContasReceber(prev => [c, ...prev]); setModalFiado(false); saved("Fiado registrado com sucesso"); }} />
      </Modal>

      {/* Modal Registrar Pagamento Fiado */}
      <Modal open={modalPagamento !== null} onClose={() => setModalPagamento(null)} title="Registrar Pagamento">
        {modalPagamento !== null && (
          <FormPagamentoFiado
            conta={contasReceber.find(c => c.id === modalPagamento)!}
            format={format}
            onSave={(valor) => {
              setContasReceber(prev => prev.map(c => {
                if (c.id !== modalPagamento) return c;
                const novoPago = c.valorPago + valor;
                return { ...c, valorPago: novoPago, status: novoPago >= c.valorTotal ? "Quitado" : "Parcialmente pago" };
              }));
              setModalPagamento(null);
              saved("Pagamento registrado");
            }}
          />
        )}
      </Modal>

      {/* Modal Nova Despesa */}
      <Modal open={modalDespesa} onClose={() => setModalDespesa(false)} title="Nova Despesa">
        <FormDespesa onSave={(d) => { setDespesas(prev => [d, ...prev]); setModalDespesa(false); saved("Despesa registrada"); }} />
      </Modal>

      {/* Modal Novo Fornecedor */}
      <Modal open={modalFornecedor} onClose={() => setModalFornecedor(false)} title="Novo Fornecedor">
        <FormFornecedor onSave={(f) => { setFornecedores(prev => [...prev, f]); setModalFornecedor(false); saved("Fornecedor cadastrado"); }} />
      </Modal>

      {/* Modal Compra Fornecedor */}
      <Modal open={modalCompraFornecedor} onClose={() => setModalCompraFornecedor(false)} title="Registrar Compra / Pagamento">
        <FormCompraFornecedor fornecedores={fornecedores} onSave={() => { setModalCompraFornecedor(false); saved("Compra registrada"); }} />
      </Modal>

      {/* Modal Pagar Salário */}
      <Modal open={modalSalario !== null} onClose={() => setModalSalario(null)} title="Registrar Pagamento de Salário">
        {modalSalario && (() => {
          const s = salariosConfig.find(x => x.profissional === modalSalario);
          if (!s) return null;
          const comissao = Math.round(s.receitaGeradaMes * s.comissaoPct / 100);
          const adiantDesc = adiantamentos.filter(a => a.profissional === s.profissional && a.status === "Aprovado — aguardando desconto").reduce((a, ad) => a + ad.valorAprovado, 0);
          const total = s.fixo + comissao - adiantDesc;
          return (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-surface2 p-4 space-y-2">
                <div className="flex justify-between"><span className="text-text3">Salário base:</span><span className="text-foreground">{format(s.fixo)}</span></div>
                <div className="flex justify-between"><span className="text-text3">Comissão ({s.comissaoPct}%):</span><span className="text-green-custom">{format(comissao)}</span></div>
                <div className="flex justify-between"><span className="text-text3">Adiantamentos a descontar:</span><span className="text-destructive">-{format(adiantDesc)}</span></div>
                <div className="border-t border-border pt-2 flex justify-between font-bold"><span>Total líquido:</span><span className="text-foreground">{format(total)}</span></div>
              </div>
              <button onClick={() => { setModalSalario(null); saved(`Salário de ${s.profissional} pago: ${format(total)}`); }}
                className="w-full rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">Confirmar Pagamento</button>
            </div>
          );
        })()}
      </Modal>

      {/* Modal Novo Adiantamento */}
      <Modal open={modalAdiantamento} onClose={() => setModalAdiantamento(false)} title="Novo Adiantamento">
        <FormAdiantamento
          profissionais={salariosConfig.map(s => s.profissional)}
          aprovadoPor={usuarioLogado?.nome || ""}
          onSave={(a) => { setAdiantamentos(prev => [...prev, a]); setModalAdiantamento(false); saved("Adiantamento registrado"); }}
        />
      </Modal>
    </div>
  );
}

// ==================== FORM COMPONENTS ====================

function FormEntradaSaida({ tipo, onSave }: { tipo: "Entrada" | "Saída"; onSave: (m: Movimentacao) => void }) {
  const [f, setF] = useState({ descricao: "", valor: "", categoria: tipo === "Entrada" ? "Serviço" : "Despesa Operacional", formaPgto: "Dinheiro" as const, beneficiario: "", obs: "" });
  const catEntrada = [{ value: "Serviço", label: "Serviço" }, { value: "Venda de Produto", label: "Venda de Produto" }, { value: "Outros", label: "Outros" }];
  const catSaida = [{ value: "Despesa Operacional", label: "Despesa Operacional" }, { value: "Fornecedor", label: "Fornecedor" }, { value: "Salário", label: "Salário" }, { value: "Adiantamento", label: "Adiantamento" }, { value: "Comissão", label: "Comissão" }, { value: "Outros", label: "Outros" }];
  return (
    <div className="space-y-3">
      <InputField label="Descrição *" value={f.descricao} onChange={v => setF(p => ({ ...p, descricao: v }))} />
      <InputField label="Valor *" value={f.valor} onChange={v => setF(p => ({ ...p, valor: v }))} type="number" />
      <SelectField label="Categoria" value={f.categoria} onChange={v => setF(p => ({ ...p, categoria: v }))} options={tipo === "Entrada" ? catEntrada : catSaida} />
      <SelectField label="Forma de pagamento" value={f.formaPgto} onChange={v => setF(p => ({ ...p, formaPgto: v as any }))} options={[{ value: "Dinheiro", label: "Dinheiro" }, { value: "Transferência", label: "Transferência" }, { value: "TPA", label: "TPA" }]} />
      <InputField label="Beneficiário / Origem (opcional)" value={f.beneficiario} onChange={v => setF(p => ({ ...p, beneficiario: v }))} />
      <InputField label="Observações" value={f.obs} onChange={v => setF(p => ({ ...p, obs: v }))} />
      <button disabled={!f.descricao || !f.valor} onClick={() => onSave({ id: Date.now(), data: new Date().toISOString().slice(0, 10), hora: new Date().toTimeString().slice(0, 5), descricao: f.descricao, categoria: f.categoria, tipo, valor: Number(f.valor), formaPgto: f.formaPgto, registradoPor: "Usuário", beneficiarioOrigem: f.beneficiario, observacoes: f.obs })}
        className="w-full rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Registrar</button>
    </div>
  );
}

function FormContaPagar({ onSave }: { onSave: (c: ContaPagar) => void }) {
  const [f, setF] = useState({ fornecedor: "", descricao: "", categoria: "Aluguel", valor: "", vencimento: "", recorrencia: "Única" as const, obs: "" });
  const cats = ["Aluguel", "Utilidades", "Internet", "Fornecedor", "Equipamento", "Outros"].map(v => ({ value: v, label: v }));
  return (
    <div className="space-y-3">
      <InputField label="Fornecedor/Beneficiário *" value={f.fornecedor} onChange={v => setF(p => ({ ...p, fornecedor: v }))} />
      <InputField label="Descrição *" value={f.descricao} onChange={v => setF(p => ({ ...p, descricao: v }))} />
      <SelectField label="Categoria" value={f.categoria} onChange={v => setF(p => ({ ...p, categoria: v }))} options={cats} />
      <InputField label="Valor *" value={f.valor} onChange={v => setF(p => ({ ...p, valor: v }))} type="number" />
      <InputField label="Data de vencimento *" value={f.vencimento} onChange={v => setF(p => ({ ...p, vencimento: v }))} type="date" />
      <SelectField label="Recorrência" value={f.recorrencia} onChange={v => setF(p => ({ ...p, recorrencia: v as any }))} options={[{ value: "Única", label: "Única" }, { value: "Mensal", label: "Mensal" }, { value: "Trimestral", label: "Trimestral" }]} />
      <button disabled={!f.fornecedor || !f.valor} onClick={() => onSave({ id: Date.now(), fornecedorBeneficiario: f.fornecedor, descricao: f.descricao, categoria: f.categoria, valor: Number(f.valor), vencimento: f.vencimento, status: "Pendente", recorrencia: f.recorrencia })}
        className="w-full rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Registrar</button>
    </div>
  );
}

function FormFiado({ onSave }: { onSave: (c: ContaReceber) => void }) {
  const [f, setF] = useState({ cliente: "", servico: "", valorTotal: "", valorPago: "", vencimento: "", obs: "" });
  return (
    <div className="space-y-3">
      <InputField label="Cliente *" value={f.cliente} onChange={v => setF(p => ({ ...p, cliente: v }))} />
      <InputField label="Serviço realizado *" value={f.servico} onChange={v => setF(p => ({ ...p, servico: v }))} />
      <InputField label="Valor total *" value={f.valorTotal} onChange={v => setF(p => ({ ...p, valorTotal: v }))} type="number" />
      <InputField label="Entrada/sinal pago (opcional)" value={f.valorPago} onChange={v => setF(p => ({ ...p, valorPago: v }))} type="number" />
      <InputField label="Data de vencimento *" value={f.vencimento} onChange={v => setF(p => ({ ...p, vencimento: v }))} type="date" />
      <InputField label="Observações" value={f.obs} onChange={v => setF(p => ({ ...p, obs: v }))} />
      <button disabled={!f.cliente || !f.valorTotal} onClick={() => { const pago = Number(f.valorPago) || 0; onSave({ id: Date.now(), cliente: f.cliente, servico: f.servico, valorTotal: Number(f.valorTotal), valorPago: pago, vencimento: f.vencimento, status: pago > 0 ? "Parcialmente pago" : "Em aberto", observacoes: f.obs }); }}
        className="w-full rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Registrar Fiado</button>
    </div>
  );
}

function FormPagamentoFiado({ conta, format: fmt, onSave }: { conta: ContaReceber; format: (v: number) => string; onSave: (valor: number) => void }) {
  const [valor, setValor] = useState("");
  const saldo = conta.valorTotal - conta.valorPago;
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-surface2 p-3 text-sm space-y-1">
        <div className="flex justify-between"><span className="text-text3">Valor total:</span><span>{fmt(conta.valorTotal)}</span></div>
        <div className="flex justify-between"><span className="text-text3">Já pago:</span><span className="text-green-custom">{fmt(conta.valorPago)}</span></div>
        <div className="flex justify-between font-bold"><span>Saldo devedor:</span><span className="text-destructive">{fmt(saldo)}</span></div>
      </div>
      {conta.historicoPagamentos && conta.historicoPagamentos.length > 0 && (
        <div>
          <p className="text-xs text-text3 mb-1">Histórico de pagamentos</p>
          {conta.historicoPagamentos.map((h, i) => (
            <div key={i} className="flex justify-between text-xs bg-surface2 rounded px-2 py-1 mb-1"><span>{h.data}</span><span>{fmt(h.valor)}</span><span>{h.forma}</span></div>
          ))}
        </div>
      )}
      <InputField label="Valor recebido *" value={valor} onChange={setValor} type="number" />
      <button disabled={!valor || Number(valor) <= 0} onClick={() => onSave(Number(valor))}
        className="w-full rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Registrar Pagamento</button>
    </div>
  );
}

function FormDespesa({ onSave }: { onSave: (d: Despesa) => void }) {
  const [f, setF] = useState({ descricao: "", categoria: "Aluguel", fornecedor: "", valor: "", data: "", formaPgto: "Dinheiro", nrFatura: "", recorrencia: "Única" as const });
  return (
    <div className="space-y-3">
      <InputField label="Descrição *" value={f.descricao} onChange={v => setF(p => ({ ...p, descricao: v }))} />
      <SelectField label="Categoria" value={f.categoria} onChange={v => setF(p => ({ ...p, categoria: v }))} options={categoriasDespesa.map(c => ({ value: c.key, label: `${c.icon} ${c.label}` }))} />
      <InputField label="Fornecedor (opcional)" value={f.fornecedor} onChange={v => setF(p => ({ ...p, fornecedor: v }))} />
      <InputField label="Valor *" value={f.valor} onChange={v => setF(p => ({ ...p, valor: v }))} type="number" />
      <InputField label="Data *" value={f.data} onChange={v => setF(p => ({ ...p, data: v }))} type="date" />
      <SelectField label="Forma de pagamento" value={f.formaPgto} onChange={v => setF(p => ({ ...p, formaPgto: v }))} options={[{ value: "Dinheiro", label: "Dinheiro" }, { value: "Transferência", label: "Transferência" }, { value: "TPA", label: "TPA" }]} />
      <InputField label="Nº fatura/recibo (opcional)" value={f.nrFatura} onChange={v => setF(p => ({ ...p, nrFatura: v }))} />
      <SelectField label="Recorrência" value={f.recorrencia} onChange={v => setF(p => ({ ...p, recorrencia: v as any }))} options={[{ value: "Única", label: "Única" }, { value: "Mensal", label: "Mensal" }]} />
      <button disabled={!f.descricao || !f.valor} onClick={() => onSave({ id: Date.now(), descricao: f.descricao, categoria: f.categoria, fornecedor: f.fornecedor, valor: Number(f.valor), data: f.data || new Date().toISOString().slice(0, 10), formaPgto: f.formaPgto, registradoPor: "Usuário", recorrencia: f.recorrencia, nrFatura: f.nrFatura })}
        className="w-full rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Registrar Despesa</button>
    </div>
  );
}

function FormFornecedor({ onSave }: { onSave: (f: Fornecedor) => void }) {
  const [f, setF] = useState({ nome: "", categoria: "Produtos capilares", contato: "", email: "", endereco: "", nif: "", nomeContato: "", obs: "" });
  const cats = ["Produtos capilares", "Cosméticos", "Equipamentos", "Materiais de limpeza", "Outros"].map(v => ({ value: v, label: v }));
  return (
    <div className="space-y-3">
      <InputField label="Nome da empresa *" value={f.nome} onChange={v => setF(p => ({ ...p, nome: v }))} />
      <SelectField label="Categoria" value={f.categoria} onChange={v => setF(p => ({ ...p, categoria: v }))} options={cats} />
      <InputField label="Nome do contacto" value={f.nomeContato} onChange={v => setF(p => ({ ...p, nomeContato: v }))} />
      <InputField label="Telefone / WhatsApp *" value={f.contato} onChange={v => setF(p => ({ ...p, contato: v }))} />
      <InputField label="E-mail" value={f.email} onChange={v => setF(p => ({ ...p, email: v }))} />
      <InputField label="Endereço" value={f.endereco} onChange={v => setF(p => ({ ...p, endereco: v }))} />
      <InputField label="NIF" value={f.nif} onChange={v => setF(p => ({ ...p, nif: v }))} />
      <button disabled={!f.nome || !f.contato} onClick={() => onSave({ id: Date.now(), nome: f.nome, categoria: f.categoria, contato: f.contato, nif: f.nif, saldoDevedor: 0, ultimaCompra: "—", email: f.email, endereco: f.endereco, nomeContato: f.nomeContato, observacoes: f.obs })}
        className="w-full rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Cadastrar Fornecedor</button>
    </div>
  );
}

function FormCompraFornecedor({ fornecedores, onSave }: { fornecedores: Fornecedor[]; onSave: () => void }) {
  const [f, setF] = useState({ fornecedorId: String(fornecedores[0]?.id || ""), descricao: "", valorTotal: "", valorPago: "", formaPgto: "Transferência", nrFatura: "" });
  return (
    <div className="space-y-3">
      <SelectField label="Fornecedor *" value={f.fornecedorId} onChange={v => setF(p => ({ ...p, fornecedorId: v }))} options={fornecedores.map(f => ({ value: String(f.id), label: f.nome }))} />
      <InputField label="Descrição da compra *" value={f.descricao} onChange={v => setF(p => ({ ...p, descricao: v }))} />
      <InputField label="Valor total *" value={f.valorTotal} onChange={v => setF(p => ({ ...p, valorTotal: v }))} type="number" />
      <InputField label="Valor pago agora" value={f.valorPago} onChange={v => setF(p => ({ ...p, valorPago: v }))} type="number" />
      <div className="rounded-lg bg-surface2 p-3 text-sm">
        <span className="text-text3">Saldo em dívida: </span>
        <span className="font-bold text-destructive">{((Number(f.valorTotal) || 0) - (Number(f.valorPago) || 0)).toLocaleString()} Kz</span>
      </div>
      <SelectField label="Forma de pagamento" value={f.formaPgto} onChange={v => setF(p => ({ ...p, formaPgto: v }))} options={[{ value: "Dinheiro", label: "Dinheiro" }, { value: "Transferência", label: "Transferência" }, { value: "TPA", label: "TPA" }]} />
      <InputField label="Nº da fatura" value={f.nrFatura} onChange={v => setF(p => ({ ...p, nrFatura: v }))} />
      <button disabled={!f.descricao || !f.valorTotal} onClick={onSave}
        className="w-full rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Registrar Compra</button>
    </div>
  );
}

function FormAdiantamento({ profissionais, aprovadoPor, onSave }: { profissionais: string[]; aprovadoPor: string; onSave: (a: Adiantamento) => void }) {
  const [f, setF] = useState({ profissional: profissionais[0] || "", valorSolicitado: "", valorAprovado: "", mesDesconto: "", motivo: "" });
  return (
    <div className="space-y-3">
      <SelectField label="Colaborador *" value={f.profissional} onChange={v => setF(p => ({ ...p, profissional: v }))} options={profissionais.map(p => ({ value: p, label: p }))} />
      <InputField label="Valor solicitado *" value={f.valorSolicitado} onChange={v => setF(p => ({ ...p, valorSolicitado: v }))} type="number" />
      <InputField label="Valor aprovado" value={f.valorAprovado} onChange={v => setF(p => ({ ...p, valorAprovado: v }))} type="number" />
      <InputField label="Mês previsto para desconto *" value={f.mesDesconto} onChange={v => setF(p => ({ ...p, mesDesconto: v }))} placeholder="Ex: Março 2025" />
      <InputField label="Motivo" value={f.motivo} onChange={v => setF(p => ({ ...p, motivo: v }))} />
      <button disabled={!f.profissional || !f.valorSolicitado} onClick={() => onSave({ id: Date.now(), profissional: f.profissional, valorSolicitado: Number(f.valorSolicitado), valorAprovado: Number(f.valorAprovado) || 0, data: new Date().toISOString().slice(0, 10), mesDesconto: f.mesDesconto, status: Number(f.valorAprovado) > 0 ? "Aprovado — aguardando desconto" : "Pendente aprovação", aprovadoPor: Number(f.valorAprovado) > 0 ? aprovadoPor : "", motivo: f.motivo })}
        className="w-full rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Registrar Adiantamento</button>
    </div>
  );
}
