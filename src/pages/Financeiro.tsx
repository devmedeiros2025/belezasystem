import { useState, useMemo, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";
import { useFinanceiroData } from "@/hooks/useFinanceiroData";
import { AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Plus, ArrowUpCircle, ArrowDownCircle,
  Wallet, CreditCard, Receipt, Users, AlertTriangle, Bell, Eye, Pencil, Trash2,
  Check, ShoppingBag, Truck, Calendar, ClipboardList, Building2, FileText,
  BarChart3, Package, ChevronDown, ChevronUp, Download, Filter, Loader2,
} from "lucide-react";
import {
  Modal, ConfirmDialog, KpiCard, StatusBadge, SearchInput,
  usePagination, PaginationControls, PeriodFilter, StatusFilter,
  EmptyState, TabContent, TableWrapper, MobileCard, MobileCardRow,
  type PeriodoFilter,
} from "@/components/financeiro/FinanceiroUI";
import {
  FormEntradaSaida, FormContaPagar, FormPagarConta, FormFiado,
  FormPagamentoFiado, FormDespesa, FormFornecedor, FormCompraFornecedor,
  FormAdiantamento, FormPagarSalario,
} from "@/components/financeiro/FinanceiroForms";
import {
  receitaDespesasMensal, formaPagamentoData,
  fluxoCaixaDiario, topServicosReceita, categoriasDespesa, dreData,
  despesasMensalTrend, contasPagarMensalTrend,
} from "@/data/financeiroData";

const COLORS = ["hsl(35 50% 50%)", "hsl(183 50% 40%)", "hsl(350 55% 57%)", "hsl(270 40% 55%)", "hsl(150 50% 40%)", "hsl(200 50% 50%)", "hsl(60 50% 45%)", "hsl(310 40% 50%)"];
const tooltipStyle = { backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(280 20% 90%)", borderRadius: 8, color: "hsl(320 30% 10%)" };

type TabKey = "visao-geral" | "fluxo-caixa" | "entradas-saidas" | "contas-pagar" | "contas-receber" | "despesas" | "fornecedores" | "salarios" | "fechamento" | "dre" | "produtos";
type SubTabSalario = "salarios" | "comissoes" | "adiantamentos";

export default function Financeiro() {
  const { perfil, usuarioLogado } = useAuth();
  const { format } = useCurrency();
  const { toast } = useToast();
  const userName = usuarioLogado?.nome || "Usuário";

  const fin = useFinanceiroData();
  const {
    loading, movimentacoes, contasPagar, contasReceber, despesas,
    fornecedores, salariosConfig, adiantamentos, produtosVendidos, fechamento,
    addMovimentacao, deleteMovimentacao,
    addContaPagar, updateContaPagar, deleteContaPagar,
    addContaReceber, registrarPagamentoCR, deleteContaReceber,
    addDespesa, deleteDespesa,
    addFornecedor, registrarCompraFornecedor, deleteFornecedor,
    addAdiantamento, updateAdiantamentoStatus,
    fecharCaixa,
  } = fin;

  const [tab, setTab] = useState<TabKey>("visao-geral");
  const [periodoGlobal, setPeriodoGlobal] = useState<PeriodoFilter>("mes");

  // Modal states
  const [modalEntrada, setModalEntrada] = useState(false);
  const [modalSaida, setModalSaida] = useState(false);
  const [modalContaPagar, setModalContaPagar] = useState(false);
  const [modalFiado, setModalFiado] = useState(false);
  const [modalPagamento, setModalPagamento] = useState<string | null>(null);
  const [modalDespesa, setModalDespesa] = useState(false);
  const [modalFornecedor, setModalFornecedor] = useState(false);
  const [modalCompraFornecedor, setModalCompraFornecedor] = useState(false);
  const [modalSalario, setModalSalario] = useState<string | null>(null);
  const [modalAdiantamento, setModalAdiantamento] = useState(false);
  const [modalPagarConta, setModalPagarConta] = useState<string | null>(null);
  const [modalViewMov, setModalViewMov] = useState<typeof movimentacoes[0] | null>(null);

  // Confirm dialog
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string } | null>(null);

  // Sub-tab & filters
  const [subTabSalario, setSubTabSalario] = useState<SubTabSalario>("salarios");
  const [catDespesaFilter, setCatDespesaFilter] = useState<string | null>(null);
  const [expandedFornecedor, setExpandedFornecedor] = useState<string | null>(null);
  const [fechamentoData, setFechamentoData] = useState(new Date().toISOString().slice(0, 10));
  const [dreMes, setDreMes] = useState("Março 2025");

  // Search states
  const [searchMov, setSearchMov] = useState("");
  const [searchCP, setSearchCP] = useState("");
  const [searchCR, setSearchCR] = useState("");
  const [searchDesp, setSearchDesp] = useState("");
  const [searchForn, setSearchForn] = useState("");

  // Status filters
  const [statusCP, setStatusCP] = useState<string | null>(null);
  const [statusCR, setStatusCR] = useState<string | null>(null);
  const [tipoMov, setTipoMov] = useState<string | null>(null);

  const [periodoFluxo, setPeriodoFluxo] = useState<PeriodoFilter>("mes");

  // ===== MEMOIZED KPIs =====
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const weekAhead = useMemo(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), []);

  const { totalEntradas, totalSaidas, lucroLiquido, saldoCaixa } = useMemo(() => {
    const totalEntradas = movimentacoes.filter(m => m.tipo === "Entrada").reduce((a, m) => a + m.valor, 0);
    const totalSaidas = movimentacoes.filter(m => m.tipo === "Saída").reduce((a, m) => a + m.valor, 0);
    const lucroLiquido = totalEntradas - totalSaidas;
    return { totalEntradas, totalSaidas, lucroLiquido, saldoCaixa: lucroLiquido + 150000 };
  }, [movimentacoes]);

  const { contasVencidasCount, contasVenceBreve } = useMemo(() => ({
    contasVencidasCount: contasPagar.filter(c => c.status === "Vencida").length,
    contasVenceBreve: contasPagar.filter(c => c.status === "Pendente" && c.vencimento <= weekAhead).length,
  }), [contasPagar, weekAhead]);

  const comissoesPendentes = useMemo(() => salariosConfig.filter(s => s.comissaoPct > 0).length, [salariosConfig]);
  const adiantNaoDescontado = useMemo(() => adiantamentos.filter(a => a.status === "Aprovado — aguardando desconto").length, [adiantamentos]);
  const contasReceberVencidas = useMemo(() => contasReceber.filter(c => c.status === "Vencido").length, [contasReceber]);

  // Filtered data
  const movFiltered = useMemo(() => {
    let items = movimentacoes;
    if (searchMov) items = items.filter(m => m.descricao.toLowerCase().includes(searchMov.toLowerCase()) || m.categoria.toLowerCase().includes(searchMov.toLowerCase()) || (m.beneficiarioOrigem || "").toLowerCase().includes(searchMov.toLowerCase()));
    if (tipoMov) items = items.filter(m => m.tipo === tipoMov);
    return items;
  }, [movimentacoes, searchMov, tipoMov]);

  const cpFiltered = useMemo(() => {
    let items = contasPagar;
    if (searchCP) items = items.filter(c => c.fornecedorBeneficiario.toLowerCase().includes(searchCP.toLowerCase()) || c.descricao.toLowerCase().includes(searchCP.toLowerCase()));
    if (statusCP) items = items.filter(c => c.status === statusCP);
    return items;
  }, [contasPagar, searchCP, statusCP]);

  const crFiltered = useMemo(() => {
    let items = contasReceber;
    if (searchCR) items = items.filter(c => c.cliente.toLowerCase().includes(searchCR.toLowerCase()) || c.servico.toLowerCase().includes(searchCR.toLowerCase()));
    if (statusCR) items = items.filter(c => c.status === statusCR);
    return items;
  }, [contasReceber, searchCR, statusCR]);

  const despFiltradas = useMemo(() => {
    let items = despesas;
    if (catDespesaFilter) items = items.filter(d => d.categoria === catDespesaFilter);
    if (searchDesp) items = items.filter(d => d.descricao.toLowerCase().includes(searchDesp.toLowerCase()) || d.categoria.toLowerCase().includes(searchDesp.toLowerCase()));
    return items;
  }, [despesas, catDespesaFilter, searchDesp]);

  const fornFiltered = useMemo(() => {
    if (!searchForn) return fornecedores;
    return fornecedores.filter(f => f.nome.toLowerCase().includes(searchForn.toLowerCase()) || f.categoria.toLowerCase().includes(searchForn.toLowerCase()));
  }, [fornecedores, searchForn]);

  // Pagination
  const movPag = usePagination(movFiltered);
  const cpPag = usePagination(cpFiltered);
  const crPag = usePagination(crFiltered);
  const dePag = usePagination(despFiltradas);

  // Helper
  const saved = useCallback((msg: string) => toast({ title: msg }), [toast]);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return;
    const { type, id } = confirmDelete;
    if (type === "mov") { await deleteMovimentacao(id); saved("Movimentação excluída"); }
    if (type === "cp") { await deleteContaPagar(id); saved("Conta excluída"); }
    if (type === "cr") { await deleteContaReceber(id); saved("Conta a receber excluída"); }
    if (type === "desp") { await deleteDespesa(id); saved("Despesa excluída"); }
    if (type === "forn") { await deleteFornecedor(id); saved("Fornecedor excluído"); }
  }, [confirmDelete, deleteMovimentacao, deleteContaPagar, deleteContaReceber, deleteDespesa, deleteFornecedor, saved]);

  // Export columns (static — outside render cycle)
  const movExportCols = useMemo(() => [
    { header: "Data", key: "data" }, { header: "Hora", key: "hora" }, { header: "Descrição", key: "descricao" },
    { header: "Tipo", key: "tipo" }, { header: "Categoria", key: "categoria" },
    { header: "Valor", key: "valorFmt" }, { header: "Forma Pgto", key: "formaPgto" },
  ], []);
  const movExportData = useMemo(() => movFiltered.map(m => ({ ...m, valorFmt: format(m.valor) })), [movFiltered, format]);

  // Tabs config
  const tabs = useMemo<{ key: TabKey; label: string; icon: any; badge?: number }[]>(() => [
    { key: "visao-geral", label: "Visão Geral", icon: BarChart3 },
    { key: "fluxo-caixa", label: "Fluxo de Caixa", icon: TrendingUp },
    { key: "entradas-saidas", label: "Entradas & Saídas", icon: ArrowUpCircle },
    { key: "contas-pagar", label: "Contas a Pagar", icon: ArrowDownCircle, badge: contasVencidasCount },
    { key: "contas-receber", label: "Contas a Receber", icon: Receipt, badge: contasReceberVencidas },
    { key: "despesas", label: "Despesas", icon: CreditCard },
    { key: "fornecedores", label: "Fornecedores", icon: Truck },
    { key: "salarios", label: "Salários & Comissões", icon: Users },
    { key: "fechamento", label: "Fechamento de Caixa", icon: ClipboardList },
    { key: "dre", label: "DRE", icon: FileText },
    { key: "produtos", label: "Produtos Vendidos", icon: Package },
  ], [contasVencidasCount, contasReceberVencidas]);

  // Fechamento - memoized daily closing data
  const {
    fcAtendimentos, fcSaidas,
    fcReceitaServicos, fcReceitaProdutos, fcDescontos, fcReceitaLiquida,
    fcDespesasDia, fcSaldoDia, fcDinheiro, fcTransferencia, fcTPA, fcTotal,
  } = useMemo(() => {
    const todayMov = movimentacoes.filter(m => m.data === today);
    const fcAtendimentos = todayMov.filter(m => m.tipo === "Entrada");
    const fcSaidas = todayMov.filter(m => m.tipo === "Saída");
    const fcReceitaServicos = fcAtendimentos.reduce((a, m) => a + m.valor, 0);
    const fcReceitaProdutos = fechamento.receitaProdutos;
    const fcDescontos = fechamento.descontos;
    const fcReceitaLiquida = fcReceitaServicos + fcReceitaProdutos - fcDescontos;
    const fcDespesasDia = fcSaidas.reduce((a, m) => a + m.valor, 0);
    const fcSaldoDia = fcReceitaLiquida - fcDespesasDia;
    const fcDinheiro = fcAtendimentos.filter(a => a.formaPgto === "Dinheiro").reduce((a, m) => a + m.valor, 0);
    const fcTransferencia = fcAtendimentos.filter(a => a.formaPgto === "Transferência").reduce((a, m) => a + m.valor, 0);
    const fcTPA = fcAtendimentos.filter(a => a.formaPgto === "TPA").reduce((a, m) => a + m.valor, 0);
    return { fcAtendimentos, fcSaidas, fcReceitaServicos, fcReceitaProdutos, fcDescontos, fcReceitaLiquida, fcDespesasDia, fcSaldoDia, fcDinheiro, fcTransferencia, fcTPA, fcTotal: fcDinheiro + fcTransferencia + fcTPA };
  }, [movimentacoes, today, fechamento.receitaProdutos, fechamento.descontos]);

  // DRE computed (memoized)
  const d = dreData;
  const { receitaBruta, receitaLiquida, totalDespOp, totalDespPessoal, lucroOperacional, margemLiquida } = useMemo(() => {
    const receitaBruta = d.servicosPrestados + d.vendaProdutos;
    const receitaLiquida = receitaBruta - d.descontosConcedidos;
    const totalDespOp = Object.values(d.despesasOperacionais).reduce((a, v) => a + v, 0);
    const totalDespPessoal = Object.values(d.despesasPessoal).reduce((a, v) => a + v, 0);
    const lucroOperacional = receitaLiquida - totalDespOp - totalDespPessoal - d.compraFornecedores;
    const margemLiquida = ((lucroOperacional / receitaBruta) * 100).toFixed(1);
    return { receitaBruta, receitaLiquida, totalDespOp, totalDespPessoal, lucroOperacional, margemLiquida };
  }, []);

  // Produtos computed (memoized)
  const { totalVendidoKz, totalCustoKz, totalUnidades, produtoMaisVendido, margemMedia } = useMemo(() => ({
    totalVendidoKz: produtosVendidos.reduce((a, p) => a + p.preco * p.unidades, 0),
    totalCustoKz: produtosVendidos.reduce((a, p) => a + p.custo * p.unidades, 0),
    totalUnidades: produtosVendidos.reduce((a, p) => a + p.unidades, 0),
    produtoMaisVendido: [...produtosVendidos].sort((a, b) => b.unidades - a.unidades)[0],
    margemMedia: produtosVendidos.length > 0
      ? (produtosVendidos.reduce((a, p) => a + ((p.preco - p.custo) / p.preco) * 100, 0) / produtosVendidos.length).toFixed(1)
      : "0",
  }), [produtosVendidos]);

  // Redirect non-authorized
  if (perfil === "Colaborador") return <Navigate to="/dashboard" replace />;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ALERTAS GLOBAIS */}
      <div className="space-y-2">
        {contasVencidasCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive cursor-pointer hover:bg-destructive/15 transition-colors" onClick={() => { setTab("contas-pagar"); setStatusCP("Vencida"); }}>
            <Bell className="h-4 w-4 animate-pulse" /> 🔴 {contasVencidasCount} conta(s) vencida(s) — clique para ver
          </div>
        )}
        {contasVenceBreve > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm text-primary cursor-pointer hover:bg-primary/15 transition-colors" onClick={() => { setTab("contas-pagar"); setStatusCP("Pendente"); }}>
            <Bell className="h-4 w-4" /> 🟡 {contasVenceBreve} conta(s) vencem nos próximos 7 dias
          </div>
        )}
        {comissoesPendentes > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm text-primary cursor-pointer hover:bg-primary/15 transition-colors" onClick={() => { setTab("salarios"); setSubTabSalario("comissoes"); }}>
            <Bell className="h-4 w-4" /> 🟡 {comissoesPendentes} profissional(is) com comissão pendente
          </div>
        )}
        {adiantNaoDescontado > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-gold/10 px-4 py-2.5 text-sm text-primary cursor-pointer hover:bg-gold/15 transition-colors" onClick={() => { setTab("salarios"); setSubTabSalario("adiantamentos"); }}>
            <Bell className="h-4 w-4" /> 🟠 {adiantNaoDescontado} adiantamento(s) não descontado(s)
          </div>
        )}
        {contasReceberVencidas > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive cursor-pointer hover:bg-destructive/15 transition-colors" onClick={() => { setTab("contas-receber"); setStatusCR("Vencido"); }}>
            <Bell className="h-4 w-4" /> 🔴 {contasReceberVencidas} fiado(s) vencido(s) — clique para ver
          </div>
        )}
      </div>

      {/* FILTRO GLOBAL DE PERÍODO */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm text-text3">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Período:</span>
        </div>
        <PeriodFilter value={periodoGlobal} onChange={setPeriodoGlobal} />
      </div>

      {/* TABS */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-1 scrollbar-thin">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`relative flex items-center gap-2 whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-medium transition-all ${
              tab === t.key 
                ? "bg-primary/10 text-primary border-b-2 border-primary" 
                : "text-text3 hover:text-foreground hover:bg-surface2"
            }`}>
            <t.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(" ")[0]}</span>
            {t.badge !== undefined && t.badge > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ==================== ABA 1: VISÃO GERAL ==================== */}
        {tab === "visao-geral" && (
          <TabContent tabKey="visao-geral">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiCard label="Receita do Mês" value={format(totalEntradas)} icon={TrendingUp} color="bg-green-custom/10 text-green-custom" />
              <KpiCard label="Despesas do Mês" value={format(totalSaidas)} icon={TrendingDown} color="bg-destructive/10 text-destructive" />
              <KpiCard label="Lucro Líquido" value={format(lucroLiquido)} icon={DollarSign} color={lucroLiquido >= 0 ? "bg-green-custom/10 text-green-custom" : "bg-destructive/10 text-destructive"} />
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
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => format(value)} />
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
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => format(value)} />
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
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => format(value)} />
                  <Bar dataKey="receita" fill="hsl(35 50% 50%)" radius={[0,4,4,0]} name="Receita" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabContent>
        )}

        {/* ==================== ABA 2: FLUXO DE CAIXA ==================== */}
        {tab === "fluxo-caixa" && (
          <TabContent tabKey="fluxo-caixa">
            <PeriodFilter value={periodoFluxo} onChange={setPeriodoFluxo} />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <KpiCard label="Total Entradas" value={format(totalEntradas)} icon={ArrowUpCircle} color="bg-green-custom/10 text-green-custom" />
              <KpiCard label="Total Saídas" value={format(totalSaidas)} icon={ArrowDownCircle} color="bg-destructive/10 text-destructive" />
              <KpiCard label="Saldo do Período" value={format(lucroLiquido)} icon={Wallet} color={lucroLiquido >= 0 ? "bg-green-custom/10 text-green-custom" : "bg-destructive/10 text-destructive"} />
              <KpiCard label="Maior Entrada" value={format(Math.max(...movimentacoes.filter(m=>m.tipo==="Entrada").map(m=>m.valor), 0))} icon={TrendingUp} color="bg-green-custom/10 text-green-custom" />
              <KpiCard label="Maior Saída" value={format(Math.max(...movimentacoes.filter(m=>m.tipo==="Saída").map(m=>m.valor), 0))} icon={TrendingDown} color="bg-destructive/10 text-destructive" />
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
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => format(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="entradas" stroke="hsl(150 50% 40%)" fill="url(#colorEnt)" strokeWidth={2} name="Entradas" />
                  <Area type="monotone" dataKey="saidas" stroke="hsl(350 55% 57%)" fill="url(#colorSai)" strokeWidth={2} name="Saídas" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <TableWrapper 
              title="Movimentações"
              actions={<SearchInput value={searchMov} onChange={setSearchMov} placeholder="Pesquisar movimentações..." />}
              exportProps={{ title: "Fluxo de Caixa", fileName: "fluxo-caixa", columns: movExportCols, data: movExportData }}
            >
              <table className="w-full text-sm hidden md:table">
                <thead><tr className="border-b border-border text-xs text-text3">
                  <th className="p-3 text-left">Data</th><th className="p-3 text-left">Hora</th><th className="p-3 text-left">Descrição</th>
                  <th className="p-3 text-left">Categoria</th><th className="p-3 text-left">Entrada</th><th className="p-3 text-left">Saída</th><th className="p-3 text-left">Saldo Acum.</th>
                </tr></thead>
                <tbody>
                  {(() => { let saldo = 0; return movPag.paginated.map(m => { saldo += m.tipo === "Entrada" ? m.valor : -m.valor; return (
                    <tr key={m.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                      <td className="p-3 text-text3">{m.data}</td><td className="p-3 text-text3">{m.hora}</td>
                      <td className="p-3 text-foreground">{m.descricao}</td>
                      <td className="p-3 text-text2">{m.categoria}</td>
                      <td className="p-3 text-green-custom font-medium">{m.tipo === "Entrada" ? format(m.valor) : "—"}</td>
                      <td className="p-3 text-destructive font-medium">{m.tipo === "Saída" ? format(m.valor) : "—"}</td>
                      <td className={`p-3 font-semibold ${saldo >= 0 ? "text-green-custom" : "text-destructive"}`}>{format(Math.abs(saldo))}</td>
                    </tr>); }); })()}
                </tbody>
              </table>
              <div className="md:hidden space-y-2 p-3">
                {(() => { let saldo = 0; return movPag.paginated.map(m => { saldo += m.tipo === "Entrada" ? m.valor : -m.valor; return (
                  <MobileCard key={m.id}>
                    <div className="flex justify-between items-start">
                      <div><p className="font-medium text-foreground text-sm">{m.descricao}</p><p className="text-xs text-text3">{m.data} · {m.hora}</p></div>
                      <StatusBadge status={m.tipo} />
                    </div>
                    <MobileCardRow label="Valor" value={<span className={m.tipo === "Entrada" ? "text-green-custom" : "text-destructive"}>{format(m.valor)}</span>} />
                    <MobileCardRow label="Saldo Acum." value={<span className={saldo >= 0 ? "text-green-custom" : "text-destructive"}>{format(Math.abs(saldo))}</span>} />
                  </MobileCard>
                ); }); })()}
              </div>
              <PaginationControls {...movPag} />
            </TableWrapper>
          </TabContent>
        )}

        {/* ==================== ABA 3: ENTRADAS & SAÍDAS ==================== */}
        {tab === "entradas-saidas" && (
          <TabContent tabKey="entradas-saidas">
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setModalEntrada(true)} className="flex items-center gap-2 rounded-lg bg-green-custom px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                <Plus className="h-4 w-4" /> Nova Entrada
              </button>
              <button onClick={() => setModalSaida(true)} className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90 transition-opacity">
                <Plus className="h-4 w-4" /> Nova Saída
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <SearchInput value={searchMov} onChange={setSearchMov} placeholder="Pesquisar por descrição, categoria..." />
              </div>
              <StatusFilter value={tipoMov} onChange={setTipoMov} options={[
                { value: "Entrada", label: "Entradas" },
                { value: "Saída", label: "Saídas" },
              ]} />
            </div>

            <TableWrapper 
              title="Todas as Movimentações"
              exportProps={{ title: "Entradas & Saídas", fileName: "entradas-saidas", columns: movExportCols, data: movExportData }}
            >
              <table className="w-full text-sm hidden md:table">
                <thead><tr className="border-b border-border text-xs text-text3">
                  <th className="p-3 text-left">Data</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Descrição</th>
                  <th className="p-3 text-left">Categoria</th><th className="p-3 text-left">Beneficiário/Origem</th>
                  <th className="p-3 text-left">Valor</th><th className="p-3 text-left">Forma Pgto</th><th className="p-3 text-left">Registrado por</th><th className="p-3 text-left">Ações</th>
                </tr></thead>
                <tbody>
                  {movPag.paginated.length === 0 ? (
                    <tr><td colSpan={9}><EmptyState icon={ArrowUpCircle} title="Nenhuma movimentação encontrada" description="Ajuste os filtros ou registre uma nova entrada/saída" /></td></tr>
                  ) : movPag.paginated.map(m => (
                    <tr key={m.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                      <td className="p-3 text-text3">{m.data}</td>
                      <td className="p-3"><StatusBadge status={m.tipo} /></td>
                      <td className="p-3 text-foreground">{m.descricao}</td>
                      <td className="p-3 text-text2">{m.categoria}</td>
                      <td className="p-3 text-text2">{m.beneficiarioOrigem || "—"}</td>
                      <td className={`p-3 font-semibold ${m.tipo === "Entrada" ? "text-green-custom" : "text-destructive"}`}>{format(m.valor)}</td>
                      <td className="p-3 text-text2">{m.formaPgto}</td>
                      <td className="p-3 text-text3">{m.registradoPor}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button onClick={() => setModalViewMov(m)} className="rounded p-1 hover:bg-surface2 transition-colors" title="Ver detalhes"><Eye className="h-3.5 w-3.5 text-text3" /></button>
                          <button onClick={() => setConfirmDelete({ type: "mov", id: m.id })} className="rounded p-1 hover:bg-destructive/10 transition-colors" title="Excluir"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="md:hidden space-y-2 p-3">
                {movPag.paginated.map(m => (
                  <MobileCard key={m.id}>
                    <div className="flex justify-between items-start">
                      <div><p className="font-medium text-foreground text-sm">{m.descricao}</p><p className="text-xs text-text3">{m.data} · {m.registradoPor}</p></div>
                      <StatusBadge status={m.tipo} />
                    </div>
                    <MobileCardRow label="Valor" value={<span className={m.tipo === "Entrada" ? "text-green-custom" : "text-destructive"}>{format(m.valor)}</span>} />
                    <MobileCardRow label="Forma" value={m.formaPgto} />
                    <div className="flex justify-end gap-2 pt-1">
                      <button onClick={() => setModalViewMov(m)} className="text-xs text-primary">Ver</button>
                      <button onClick={() => setConfirmDelete({ type: "mov", id: m.id })} className="text-xs text-destructive">Excluir</button>
                    </div>
                  </MobileCard>
                ))}
              </div>
              <PaginationControls {...movPag} />
            </TableWrapper>
          </TabContent>
        )}

        {/* ==================== ABA 4: CONTAS A PAGAR ==================== */}
        {tab === "contas-pagar" && (
          <TabContent tabKey="contas-pagar">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiCard label="A vencer hoje" value={String(contasPagar.filter(c => c.vencimento === today && c.status === "Pendente").length)} icon={Calendar} color="bg-primary/10 text-primary" />
              <KpiCard label="A vencer esta semana" value={String(contasPagar.filter(c => c.status === "Pendente" && c.vencimento <= weekAhead).length)} icon={AlertTriangle} color="bg-gold/10 text-primary" />
              <KpiCard label="Vencidas" value={String(contasVencidasCount)} icon={Bell} color="bg-destructive/10 text-destructive" />
              <KpiCard label="Pagas este mês" value={String(contasPagar.filter(c => c.status === "Paga" || c.status === "Paga com atraso").length)} icon={Check} color="bg-green-custom/10 text-green-custom" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5 card-hover">
                <h3 className="font-display text-sm font-semibold text-foreground mb-3">Evolução Mensal — Contas a Pagar</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={contasPagarMensalTrend}>
                    <defs>
                      <linearGradient id="cpTotalGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(35 50% 50%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(35 50% 50%)" stopOpacity={0} /></linearGradient>
                      <linearGradient id="cpPagasGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(150 50% 40%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(150 50% 40%)" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 90%)" />
                    <XAxis dataKey="mes" tick={{ fill: "hsl(280 15% 60%)", fontSize: 11 }} axisLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => format(value)} />
                    <Legend />
                    <Area type="monotone" dataKey="total" name="Total" stroke="hsl(35 50% 50%)" fill="url(#cpTotalGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="pagas" name="Pagas" stroke="hsl(150 50% 40%)" fill="url(#cpPagasGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 card-hover">
                <h3 className="font-display text-sm font-semibold text-foreground mb-3">Vencidas vs Pendentes — Tendência</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={contasPagarMensalTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 90%)" />
                    <XAxis dataKey="mes" tick={{ fill: "hsl(280 15% 60%)", fontSize: 11 }} axisLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => format(value)} />
                    <Legend />
                    <Bar dataKey="vencidas" name="Vencidas" fill="hsl(350 55% 57%)" radius={[4,4,0,0]} />
                    <Bar dataKey="pendentes" name="Pendentes" fill="hsl(35 50% 50%)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button onClick={() => setModalContaPagar(true)} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                <Plus className="h-4 w-4" /> Nova Conta a Pagar
              </button>
              <div className="flex-1 min-w-[200px]">
                <SearchInput value={searchCP} onChange={setSearchCP} placeholder="Pesquisar contas..." />
              </div>
            </div>
            
            <StatusFilter value={statusCP} onChange={setStatusCP} options={[
              { value: "Pendente", label: "Pendentes" }, { value: "Vencida", label: "Vencidas" },
              { value: "Paga", label: "Pagas" }, { value: "Paga com atraso", label: "Pagas com atraso" },
            ]} />

            <TableWrapper exportProps={{
              title: "Contas a Pagar", fileName: "contas-pagar",
              columns: [{ header: "Beneficiário", key: "fornecedorBeneficiario" }, { header: "Descrição", key: "descricao" }, { header: "Valor", key: "valorFmt" }, { header: "Vencimento", key: "vencimento" }, { header: "Status", key: "status" }],
              data: cpFiltered.map(c => ({ ...c, valorFmt: format(c.valor) }))
            }}>
              <table className="w-full text-sm hidden md:table">
                <thead><tr className="border-b border-border text-xs text-text3">
                  <th className="p-3 text-left">Fornecedor/Beneficiário</th><th className="p-3 text-left">Descrição</th>
                  <th className="p-3 text-left">Valor</th><th className="p-3 text-left">Vencimento</th><th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Recorrência</th><th className="p-3 text-left">Ações</th>
                </tr></thead>
                <tbody>
                  {cpPag.paginated.length === 0 ? (
                    <tr><td colSpan={7}><EmptyState icon={ArrowDownCircle} title="Nenhuma conta encontrada" /></td></tr>
                  ) : cpPag.paginated.map(c => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                      <td className="p-3 text-foreground">{c.fornecedorBeneficiario}</td>
                      <td className="p-3 text-text2">{c.descricao}</td>
                      <td className="p-3 font-semibold text-foreground">{format(c.valor)}</td>
                      <td className="p-3 text-text3">{c.vencimento}</td>
                      <td className="p-3"><StatusBadge status={c.status} /></td>
                      <td className="p-3 text-text3">{c.recorrencia || "—"}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {(c.status === "Pendente" || c.status === "Vencida") && (
                            <button onClick={() => setModalPagarConta(c.id)} className="rounded px-2 py-1 text-[11px] bg-green-custom/10 text-green-custom hover:bg-green-custom/20 transition-colors">Pagar</button>
                          )}
                          <button onClick={() => setConfirmDelete({ type: "cp", id: c.id })} className="rounded p-1 hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="md:hidden space-y-2 p-3">
                {cpPag.paginated.map(c => (
                  <MobileCard key={c.id}>
                    <div className="flex justify-between items-start">
                      <div><p className="font-medium text-foreground text-sm">{c.fornecedorBeneficiario}</p><p className="text-xs text-text3">{c.descricao}</p></div>
                      <StatusBadge status={c.status} />
                    </div>
                    <MobileCardRow label="Valor" value={<span className="font-bold">{format(c.valor)}</span>} />
                    <MobileCardRow label="Vencimento" value={c.vencimento} />
                    {(c.status === "Pendente" || c.status === "Vencida") && (
                      <button onClick={() => setModalPagarConta(c.id)} className="w-full rounded-lg bg-green-custom/10 py-1.5 text-xs text-green-custom font-medium mt-1">Pagar</button>
                    )}
                  </MobileCard>
                ))}
              </div>
              <PaginationControls {...cpPag} />
            </TableWrapper>
          </TabContent>
        )}

        {/* ==================== ABA 5: CONTAS A RECEBER ==================== */}
        {tab === "contas-receber" && (
          <TabContent tabKey="contas-receber">
            <div className="flex flex-wrap gap-3 items-center">
              <button onClick={() => setModalFiado(true)} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                <Plus className="h-4 w-4" /> Novo Fiado
              </button>
              <div className="flex-1 min-w-[200px]">
                <SearchInput value={searchCR} onChange={setSearchCR} placeholder="Pesquisar fiados..." />
              </div>
            </div>
            <StatusFilter value={statusCR} onChange={setStatusCR} options={[
              { value: "Em aberto", label: "Em aberto" }, { value: "Parcialmente pago", label: "Parcial" },
              { value: "Quitado", label: "Quitado" }, { value: "Vencido", label: "Vencido" },
            ]} />
            <TableWrapper exportProps={{
              title: "Contas a Receber", fileName: "contas-receber",
              columns: [{ header: "Cliente", key: "cliente" }, { header: "Serviço", key: "servico" }, { header: "Total", key: "totalFmt" }, { header: "Pago", key: "pagoFmt" }, { header: "Status", key: "status" }],
              data: crFiltered.map(c => ({ ...c, totalFmt: format(c.valorTotal), pagoFmt: format(c.valorPago) }))
            }}>
              <table className="w-full text-sm hidden md:table">
                <thead><tr className="border-b border-border text-xs text-text3">
                  <th className="p-3 text-left">Cliente</th><th className="p-3 text-left">Serviço</th>
                  <th className="p-3 text-left">Valor Total</th><th className="p-3 text-left">Pago</th><th className="p-3 text-left">Saldo</th>
                  <th className="p-3 text-left">Vencimento</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Ações</th>
                </tr></thead>
                <tbody>
                  {crPag.paginated.length === 0 ? (
                    <tr><td colSpan={8}><EmptyState icon={Receipt} title="Nenhuma conta a receber" /></td></tr>
                  ) : crPag.paginated.map(c => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                      <td className="p-3 text-foreground">{c.cliente}</td>
                      <td className="p-3 text-text2">{c.servico}</td>
                      <td className="p-3 font-medium text-foreground">{format(c.valorTotal)}</td>
                      <td className="p-3 text-green-custom">{format(c.valorPago)}</td>
                      <td className="p-3 text-destructive font-bold">{format(c.valorTotal - c.valorPago)}</td>
                      <td className="p-3 text-text3">{c.vencimento}</td>
                      <td className="p-3"><StatusBadge status={c.status} /></td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {c.status !== "Quitado" && (
                            <button onClick={() => setModalPagamento(c.id)} className="rounded px-2 py-1 text-[11px] bg-green-custom/10 text-green-custom hover:bg-green-custom/20 transition-colors">Receber</button>
                          )}
                          <button onClick={() => setConfirmDelete({ type: "cr", id: c.id })} className="rounded p-1 hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="md:hidden space-y-2 p-3">
                {crPag.paginated.map(c => (
                  <MobileCard key={c.id}>
                    <div className="flex justify-between items-start">
                      <div><p className="font-medium text-foreground text-sm">{c.cliente}</p><p className="text-xs text-text3">{c.servico}</p></div>
                      <StatusBadge status={c.status} />
                    </div>
                    <MobileCardRow label="Total" value={format(c.valorTotal)} />
                    <MobileCardRow label="Pago" value={<span className="text-green-custom">{format(c.valorPago)}</span>} />
                    <MobileCardRow label="Saldo" value={<span className="text-destructive font-bold">{format(c.valorTotal - c.valorPago)}</span>} />
                    {c.status !== "Quitado" && (
                      <button onClick={() => setModalPagamento(c.id)} className="w-full rounded-lg bg-green-custom/10 py-1.5 text-xs text-green-custom font-medium mt-1">Registrar Pagamento</button>
                    )}
                  </MobileCard>
                ))}
              </div>
              <PaginationControls {...crPag} />
            </TableWrapper>
          </TabContent>
        )}

        {/* ==================== ABA 6: DESPESAS ==================== */}
        {tab === "despesas" && (
          <TabContent tabKey="despesas">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setCatDespesaFilter(null)} className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${!catDespesaFilter ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-surface2 text-text3 hover:bg-surface3"}`}>Todas</button>
                  {categoriasDespesa.map(c => (
                    <button key={c.key} onClick={() => setCatDespesaFilter(catDespesaFilter === c.key ? null : c.key)}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${catDespesaFilter === c.key ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-surface2 text-text3 hover:bg-surface3"}`}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setModalDespesa(true)} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                    <Plus className="h-4 w-4" /> Nova Despesa
                  </button>
                  <div className="flex-1 min-w-[200px]">
                    <SearchInput value={searchDesp} onChange={setSearchDesp} placeholder="Pesquisar despesas..." />
                  </div>
                </div>
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
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => format(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-5 card-hover">
                <h3 className="font-display text-sm font-semibold text-foreground mb-3">Evolução Total de Despesas — 6 meses</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={despesasMensalTrend}>
                    <defs>
                      <linearGradient id="despTotalGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(350 55% 57%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(350 55% 57%)" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 90%)" />
                    <XAxis dataKey="mes" tick={{ fill: "hsl(280 15% 60%)", fontSize: 11 }} axisLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => format(value)} />
                    <Area type="monotone" dataKey="total" name="Total Despesas" stroke="hsl(350 55% 57%)" fill="url(#despTotalGrad)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(350 55% 57%)" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 card-hover">
                <h3 className="font-display text-sm font-semibold text-foreground mb-3">Despesas por Categoria — Comparativo Mensal</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={despesasMensalTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(280 20% 90%)" />
                    <XAxis dataKey="mes" tick={{ fill: "hsl(280 15% 60%)", fontSize: 11 }} axisLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => format(value)} />
                    <Legend />
                    <Bar dataKey="aluguel" name="Aluguel" fill="hsl(35 50% 50%)" radius={[2,2,0,0]} stackId="a" />
                    <Bar dataKey="produtos" name="Produtos" fill="hsl(183 50% 40%)" radius={[0,0,0,0]} stackId="a" />
                    <Bar dataKey="utilidades" name="Utilidades" fill="hsl(270 40% 55%)" radius={[0,0,0,0]} stackId="a" />
                    <Bar dataKey="marketing" name="Marketing" fill="hsl(150 50% 40%)" radius={[0,0,0,0]} stackId="a" />
                    <Bar dataKey="outros" name="Outros" fill="hsl(200 50% 50%)" radius={[2,2,0,0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <TableWrapper exportProps={{
              title: "Despesas", fileName: "despesas",
              columns: [{ header: "Data", key: "data" }, { header: "Descrição", key: "descricao" }, { header: "Categoria", key: "categoria" }, { header: "Valor", key: "valorFmt" }, { header: "Forma Pgto", key: "formaPgto" }],
              data: despFiltradas.map(d => ({ ...d, valorFmt: format(d.valor) }))
            }}>
              <table className="w-full text-sm hidden md:table">
                <thead><tr className="border-b border-border text-xs text-text3">
                  <th className="p-3 text-left">Data</th><th className="p-3 text-left">Descrição</th><th className="p-3 text-left">Categoria</th>
                  <th className="p-3 text-left">Fornecedor</th><th className="p-3 text-left">Valor</th>
                  <th className="p-3 text-left">Forma Pgto</th><th className="p-3 text-left">Registrado por</th><th className="p-3 text-left">Ações</th>
                </tr></thead>
                <tbody>
                  {dePag.paginated.length === 0 ? (
                    <tr><td colSpan={8}><EmptyState icon={CreditCard} title="Nenhuma despesa encontrada" /></td></tr>
                  ) : dePag.paginated.map(dItem => (
                    <tr key={dItem.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                      <td className="p-3 text-text3">{dItem.data}</td><td className="p-3 text-foreground">{dItem.descricao}</td>
                      <td className="p-3 text-text2">{dItem.categoria}</td><td className="p-3 text-text3">{dItem.fornecedor || "—"}</td>
                      <td className="p-3 font-semibold text-destructive">{format(dItem.valor)}</td><td className="p-3 text-text3">{dItem.formaPgto}</td>
                      <td className="p-3 text-text3">{dItem.registradoPor}</td>
                      <td className="p-3"><div className="flex gap-1">
                        <button onClick={() => setConfirmDelete({ type: "desp", id: dItem.id })} className="rounded p-1 hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="md:hidden space-y-2 p-3">
                {dePag.paginated.map(dItem => (
                  <MobileCard key={dItem.id}>
                    <div className="flex justify-between items-start">
                      <div><p className="font-medium text-foreground text-sm">{dItem.descricao}</p><p className="text-xs text-text3">{dItem.data} · {dItem.categoria}</p></div>
                      <span className="font-bold text-destructive text-sm">{format(dItem.valor)}</span>
                    </div>
                    <MobileCardRow label="Forma Pgto" value={dItem.formaPgto} />
                    <MobileCardRow label="Registrado por" value={dItem.registradoPor} />
                  </MobileCard>
                ))}
              </div>
              <PaginationControls {...dePag} />
            </TableWrapper>
          </TabContent>
        )}

        {/* ==================== ABA 7: FORNECEDORES ==================== */}
        {tab === "fornecedores" && (
          <TabContent tabKey="fornecedores">
            <div className="flex flex-wrap gap-3 items-center">
              <button onClick={() => setModalFornecedor(true)} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                <Plus className="h-4 w-4" /> Novo Fornecedor
              </button>
              <button onClick={() => setModalCompraFornecedor(true)} className="flex items-center gap-2 rounded-lg bg-surface2 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface3 transition-colors">
                <ShoppingBag className="h-4 w-4" /> Registrar Compra
              </button>
              <div className="flex-1 min-w-[200px]">
                <SearchInput value={searchForn} onChange={setSearchForn} placeholder="Pesquisar fornecedor..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 mb-2">
              <KpiCard label="Total Fornecedores" value={String(fornecedores.length)} icon={Building2} color="bg-primary/10 text-primary" />
              <KpiCard label="Saldo Devedor Total" value={format(fornecedores.reduce((a, f) => a + f.saldoDevedor, 0))} icon={AlertTriangle} color="bg-destructive/10 text-destructive" />
              <KpiCard label="Sem Dívida" value={String(fornecedores.filter(f => f.saldoDevedor === 0).length)} icon={Check} color="bg-green-custom/10 text-green-custom" />
            </div>

            <div className="space-y-3">
              {fornFiltered.length === 0 ? (
                <EmptyState icon={Truck} title="Nenhum fornecedor encontrado" />
              ) : fornFiltered.map(fItem => (
                <div key={fItem.id} className="rounded-xl border border-border bg-card card-hover">
                  <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedFornecedor(expandedFornecedor === fItem.id ? null : fItem.id)}>
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-primary/10 p-2.5"><Building2 className="h-5 w-5 text-primary" /></div>
                      <div>
                        <p className="font-medium text-foreground">{fItem.nome}</p>
                        <p className="text-xs text-text3">{fItem.categoria} · {fItem.contato}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-text3">Saldo devedor</p>
                        <p className={`font-display text-lg font-bold ${fItem.saldoDevedor > 0 ? "text-destructive" : "text-green-custom"}`}>{format(fItem.saldoDevedor)}</p>
                      </div>
                      {expandedFornecedor === fItem.id ? <ChevronUp className="h-4 w-4 text-text3" /> : <ChevronDown className="h-4 w-4 text-text3" />}
                    </div>
                  </div>
                  {expandedFornecedor === fItem.id && (
                    <div className="border-t border-border p-5 space-y-3">
                      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 text-sm">
                        <div><p className="text-xs text-text3">NIF</p><p className="text-foreground">{fItem.nif}</p></div>
                        <div><p className="text-xs text-text3">E-mail</p><p className="text-foreground">{fItem.email || "—"}</p></div>
                        <div><p className="text-xs text-text3">Endereço</p><p className="text-foreground">{fItem.endereco || "—"}</p></div>
                        <div><p className="text-xs text-text3">Última compra</p><p className="text-foreground">{fItem.ultimaCompra}</p></div>
                      </div>
                      {fItem.historicoCompras && fItem.historicoCompras.length > 0 && (
                        <div>
                          <p className="text-xs text-text3 mb-2 font-medium">Histórico de compras</p>
                          <div className="space-y-1">
                            {fItem.historicoCompras.map((h, i) => (
                              <div key={i} className="flex items-center justify-between rounded-lg bg-surface2 px-3 py-2 text-xs">
                                <span className="text-text3">{h.data}</span>
                                <span className="text-foreground flex-1 ml-3">{h.descricao}</span>
                                <span className="text-foreground font-medium ml-3">{format(h.valor)}</span>
                                <span className={`ml-3 ${h.pago >= h.valor ? "text-green-custom" : "text-destructive"}`}>{h.pago >= h.valor ? "✓ Pago" : `Deve ${format(h.valor - h.pago)}`}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <button onClick={() => setConfirmDelete({ type: "forn", id: fItem.id })} className="text-xs text-destructive hover:underline">Excluir fornecedor</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabContent>
        )}

        {/* ==================== ABA 8: SALÁRIOS & COMISSÕES ==================== */}
        {tab === "salarios" && (
          <TabContent tabKey="salarios">
            <div className="flex gap-1 border-b border-border pb-1 mb-4">
              {(["salarios", "comissoes", "adiantamentos"] as SubTabSalario[]).map(st => (
                <button key={st} onClick={() => setSubTabSalario(st)}
                  className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${subTabSalario === st ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-text3 hover:text-foreground"}`}>
                  {st === "salarios" ? "Salários" : st === "comissoes" ? "Comissões" : "Adiantamentos"}
                </button>
              ))}
            </div>

            {subTabSalario === "salarios" && (
              <>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-4">
                  <KpiCard label="Folha Total" value={format(salariosConfig.reduce((a, s) => { const c = Math.round(s.receitaGeradaMes * s.comissaoPct / 100); return a + s.fixo + c; }, 0))} icon={Users} color="bg-primary/10 text-primary" />
                  <KpiCard label="Comissões Totais" value={format(salariosConfig.reduce((a, s) => a + Math.round(s.receitaGeradaMes * s.comissaoPct / 100), 0))} icon={TrendingUp} color="bg-green-custom/10 text-green-custom" />
                  <KpiCard label="Adiantamentos" value={format(adiantamentos.filter(a => a.status === "Aprovado — aguardando desconto").reduce((a, ad) => a + ad.valorAprovado, 0))} icon={AlertTriangle} color="bg-destructive/10 text-destructive" />
                  <KpiCard label="Profissionais" value={String(salariosConfig.length)} icon={Users} color="bg-teal-custom/10 text-teal-custom" />
                </div>

                <TableWrapper exportProps={{
                  title: "Folha de Pagamento", fileName: "folha-pagamento",
                  columns: [{ header: "Profissional", key: "profissional" }, { header: "Tipo", key: "tipo" }, { header: "Base", key: "baseFmt" }, { header: "Comissão", key: "comFmt" }, { header: "Total", key: "totalFmt" }],
                  data: salariosConfig.map(s => {
                    const c = Math.round(s.receitaGeradaMes * s.comissaoPct / 100);
                    const ad = adiantamentos.filter(a => a.profissional === s.profissional && a.status === "Aprovado — aguardando desconto").reduce((a, ad) => a + ad.valorAprovado, 0);
                    return { profissional: s.profissional, tipo: s.tipo, baseFmt: format(s.fixo), comFmt: format(c), totalFmt: format(s.fixo + c - ad) };
                  })
                }}>
                  <table className="w-full text-sm hidden md:table">
                    <thead><tr className="border-b border-border text-xs text-text3">
                      <th className="p-3 text-left">Profissional</th><th className="p-3 text-left">Tipo Remuneração</th>
                      <th className="p-3 text-left">Valor Base</th><th className="p-3 text-left">Comissão (%)</th>
                      <th className="p-3 text-left">Comissão (Kz)</th><th className="p-3 text-left">Adiant. a descontar</th>
                      <th className="p-3 text-left">Total Líquido</th><th className="p-3 text-left">Ações</th>
                    </tr></thead>
                    <tbody>
                      {salariosConfig.map(s => {
                        const comissao = Math.round(s.receitaGeradaMes * s.comissaoPct / 100);
                        const adDesc = adiantamentos.filter(a => a.profissional === s.profissional && a.status === "Aprovado — aguardando desconto").reduce((a, ad) => a + ad.valorAprovado, 0);
                        const totalLiq = s.fixo + comissao - adDesc;
                        return (
                          <tr key={s.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                            <td className="p-3 font-medium text-foreground">{s.profissional}</td>
                            <td className="p-3"><StatusBadge status={s.tipo} /></td>
                            <td className="p-3 text-foreground">{format(s.fixo)}</td>
                            <td className="p-3 text-text2">{s.comissaoPct}%</td>
                            <td className="p-3 text-green-custom">{format(comissao)}</td>
                            <td className="p-3 text-destructive">{adDesc > 0 ? `-${format(adDesc)}` : "—"}</td>
                            <td className="p-3 font-bold text-foreground">{format(totalLiq)}</td>
                            <td className="p-3">
                              <button onClick={() => setModalSalario(s.profissional)} className="rounded px-2 py-1 text-[11px] gold-gradient text-primary-foreground font-medium">Pagar</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="md:hidden space-y-2 p-3">
                    {salariosConfig.map(s => {
                      const comissao = Math.round(s.receitaGeradaMes * s.comissaoPct / 100);
                      const adDesc = adiantamentos.filter(a => a.profissional === s.profissional && a.status === "Aprovado — aguardando desconto").reduce((a, ad) => a + ad.valorAprovado, 0);
                      return (
                        <MobileCard key={s.id}>
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-foreground">{s.profissional}</p>
                            <StatusBadge status={s.tipo} />
                          </div>
                          <MobileCardRow label="Base" value={format(s.fixo)} />
                          <MobileCardRow label="Comissão" value={<span className="text-green-custom">{format(comissao)}</span>} />
                          <MobileCardRow label="Total" value={<span className="font-bold">{format(s.fixo + comissao - adDesc)}</span>} />
                          <button onClick={() => setModalSalario(s.profissional)} className="w-full rounded-lg gold-gradient py-1.5 text-xs font-medium text-primary-foreground mt-1">Pagar</button>
                        </MobileCard>
                      );
                    })}
                  </div>
                </TableWrapper>
              </>
            )}

            {subTabSalario === "comissoes" && (
              <TableWrapper title="Comissões do Mês">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-xs text-text3">
                    <th className="p-3 text-left">Profissional</th><th className="p-3 text-left">Atendimentos</th>
                    <th className="p-3 text-left">Receita Gerada</th><th className="p-3 text-left">% Comissão</th><th className="p-3 text-left">Valor Comissão</th>
                  </tr></thead>
                  <tbody>
                    {salariosConfig.filter(s => s.comissaoPct > 0).map(s => (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                        <td className="p-3 font-medium text-foreground">{s.profissional}</td>
                        <td className="p-3 text-text2">{s.atendimentosMes}</td>
                        <td className="p-3 text-foreground">{format(s.receitaGeradaMes)}</td>
                        <td className="p-3 text-text2">{s.comissaoPct}%</td>
                        <td className="p-3 text-green-custom font-bold">{format(Math.round(s.receitaGeradaMes * s.comissaoPct / 100))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrapper>
            )}

            {subTabSalario === "adiantamentos" && (
              <>
                <div className="flex justify-end">
                  <button onClick={() => setModalAdiantamento(true)} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                    <Plus className="h-4 w-4" /> Novo Adiantamento
                  </button>
                </div>
                <TableWrapper title="Adiantamentos">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border text-xs text-text3">
                      <th className="p-3 text-left">Data</th><th className="p-3 text-left">Colaborador</th>
                      <th className="p-3 text-left">Solicitado</th><th className="p-3 text-left">Aprovado</th>
                      <th className="p-3 text-left">Desconto em</th><th className="p-3 text-left">Status</th>
                    </tr></thead>
                    <tbody>
                      {adiantamentos.map(a => (
                        <tr key={a.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                          <td className="p-3 text-text3">{a.data}</td>
                          <td className="p-3 font-medium text-foreground">{a.profissional}</td>
                          <td className="p-3 text-foreground">{format(a.valorSolicitado)}</td>
                          <td className="p-3 text-primary font-medium">{format(a.valorAprovado)}</td>
                          <td className="p-3 text-text3">{a.mesDesconto}</td>
                          <td className="p-3"><StatusBadge status={a.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrapper>
              </>
            )}
          </TabContent>
        )}

        {/* ==================== ABA 9: FECHAMENTO DE CAIXA ==================== */}
        {tab === "fechamento" && (
          <TabContent tabKey="fechamento">
            <div className="flex items-center gap-3">
              <label className="text-sm text-text3 font-medium">Data:</label>
              <input type="date" value={fechamentoData} onChange={e => setFechamentoData(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiCard label="Atendimentos" value={String(fcAtendimentos.length)} icon={Users} color="bg-primary/10 text-primary" />
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
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="rounded-lg bg-surface2 p-4 text-center"><p className="text-xs text-text3">Dinheiro</p><p className="font-display text-xl font-bold text-foreground">{format(fcDinheiro)}</p></div>
                <div className="rounded-lg bg-surface2 p-4 text-center"><p className="text-xs text-text3">Transferência</p><p className="font-display text-xl font-bold text-foreground">{format(fcTransferencia)}</p></div>
                <div className="rounded-lg bg-surface2 p-4 text-center"><p className="text-xs text-text3">TPA (cartão)</p><p className="font-display text-xl font-bold text-foreground">{format(fcTPA)}</p></div>
                <div className="rounded-lg bg-primary/10 p-4 text-center border border-primary/20"><p className="text-xs text-primary font-medium">Total</p><p className="font-display text-xl font-bold text-primary">{format(fcTotal)}</p></div>
              </div>
            </div>

            <TableWrapper title="Entradas do Dia">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-xs text-text3">
                  <th className="p-3 text-left">Hora</th><th className="p-3 text-left">Descrição</th><th className="p-3 text-left">Categoria</th>
                  <th className="p-3 text-left">Valor</th><th className="p-3 text-left">Forma Pgto</th>
                </tr></thead>
                <tbody>
                  {fcAtendimentos.map((a) => (
                    <tr key={a.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                      <td className="p-3 text-text3">{a.hora}</td><td className="p-3 text-foreground">{a.descricao}</td>
                      <td className="p-3 text-text2">{a.categoria}</td>
                      <td className="p-3 font-semibold text-green-custom">{format(a.valor)}</td><td className="p-3 text-text3">{a.formaPgto}</td>
                    </tr>
                  ))}
                  <tr className="bg-surface2 font-bold">
                    <td colSpan={3} className="p-3 text-foreground text-right">Total Entradas:</td>
                    <td className="p-3 text-green-custom">{format(fcReceitaServicos)}</td><td />
                  </tr>
                </tbody>
              </table>
            </TableWrapper>

            <TableWrapper title="Saídas do Dia">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-xs text-text3">
                  <th className="p-3 text-left">Hora</th><th className="p-3 text-left">Descrição</th><th className="p-3 text-left">Categoria</th><th className="p-3 text-left">Valor</th>
                </tr></thead>
                <tbody>
                  {fcSaidas.map((s) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                      <td className="p-3 text-text3">{s.hora}</td><td className="p-3 text-foreground">{s.descricao}</td>
                      <td className="p-3 text-text2">{s.categoria}</td><td className="p-3 font-semibold text-destructive">{format(s.valor)}</td>
                    </tr>
                  ))}
                  <tr className="bg-surface2 font-bold">
                    <td colSpan={3} className="p-3 text-foreground text-right">Total Saídas:</td>
                    <td className="p-3 text-destructive">{format(fcDespesasDia)}</td>
                  </tr>
                </tbody>
              </table>
            </TableWrapper>

            {!fechamento.fechado ? (
              <button onClick={async () => { await fecharCaixa(userName); saved("✓ Caixa do dia fechado com sucesso"); }}
                className="w-full rounded-lg gold-gradient px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-95 transition-opacity">
                Fechar Caixa do Dia
              </button>
            ) : (
              <div className="rounded-lg bg-green-custom/10 px-4 py-3 text-center text-sm text-green-custom font-medium">
                ✓ Caixa fechado por {fechamento.fechadoPor} às {fechamento.horaFechamento}
              </div>
            )}
          </TabContent>
        )}

        {/* ==================== ABA 10: DRE ==================== */}
        {tab === "dre" && (
          <TabContent tabKey="dre">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="text-sm text-text3 font-medium">Período:</label>
                <select value={dreMes} onChange={e => setDreMes(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Janeiro 2025</option><option>Fevereiro 2025</option><option>Março 2025</option>
                </select>
              </div>
              <button onClick={() => saved("PDF do DRE gerado com sucesso")} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                <Download className="h-4 w-4" /> Exportar PDF
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 font-mono text-sm space-y-4">
              <h3 className="font-display text-lg font-bold text-foreground text-center mb-2">DRE — Demonstrativo de Resultado do Exercício</h3>
              <p className="text-center text-xs text-text3 mb-6">{dreMes}</p>

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
          </TabContent>
        )}

        {/* ==================== ABA 11: PRODUTOS VENDIDOS ==================== */}
        {tab === "produtos" && (
          <TabContent tabKey="produtos">
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
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => format(value)} />
                  <Bar dataKey="receita" fill="hsl(35 50% 50%)" radius={[0,4,4,0]} name="Receita" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <TableWrapper exportProps={{
              title: "Produtos Vendidos", fileName: "produtos-vendidos",
              columns: [{ header: "Produto", key: "nome" }, { header: "Categoria", key: "categoria" }, { header: "Unidades", key: "unidades" }, { header: "Receita", key: "receitaFmt" }, { header: "Margem", key: "margem" }],
              data: produtosVendidos.map(p => ({ ...p, receitaFmt: format(p.preco * p.unidades), margem: `${((p.preco - p.custo) / p.preco * 100).toFixed(1)}%` }))
            }}>
              <table className="w-full text-sm hidden md:table">
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
                      <tr key={p.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
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
                  <tr className="bg-surface2 font-bold">
                    <td colSpan={2} className="p-3 text-foreground">Totais</td>
                    <td className="p-3 text-foreground">{totalUnidades}</td>
                    <td className="p-3" />
                    <td className="p-3 text-green-custom">{format(totalVendidoKz)}</td>
                    <td className="p-3 text-destructive">{format(totalCustoKz)}</td>
                    <td className="p-3 text-primary">{margemMedia}%</td>
                  </tr>
                </tbody>
              </table>
              <div className="md:hidden space-y-2 p-3">
                {produtosVendidos.map(p => (
                  <MobileCard key={p.id}>
                    <div className="flex justify-between items-start">
                      <div><p className="font-medium text-foreground text-sm">{p.nome}</p><p className="text-xs text-text3">{p.categoria} · {p.unidades} un.</p></div>
                      <span className="font-bold text-green-custom">{format(p.preco * p.unidades)}</span>
                    </div>
                    <MobileCardRow label="Preço unit." value={format(p.preco)} />
                    <MobileCardRow label="Custo unit." value={<span className="text-destructive">{format(p.custo)}</span>} />
                    <MobileCardRow label="Margem" value={<span className="text-primary font-medium">{((p.preco - p.custo) / p.preco * 100).toFixed(1)}%</span>} />
                  </MobileCard>
                ))}
              </div>
            </TableWrapper>
          </TabContent>
        )}
      </AnimatePresence>

      {/* ==================== MODAIS ==================== */}
      <Modal open={modalEntrada} onClose={() => setModalEntrada(false)} title="Nova Entrada">
        <FormEntradaSaida tipo="Entrada" registradoPor={userName} onSave={async (m) => { await addMovimentacao(m); setModalEntrada(false); saved("Entrada registrada com sucesso"); }} />
      </Modal>

      <Modal open={modalSaida} onClose={() => setModalSaida(false)} title="Nova Saída">
        <FormEntradaSaida tipo="Saída" registradoPor={userName} onSave={async (m) => { await addMovimentacao(m); setModalSaida(false); saved("Saída registrada com sucesso"); }} />
      </Modal>

      <Modal open={modalContaPagar} onClose={() => setModalContaPagar(false)} title="Nova Conta a Pagar">
        <FormContaPagar onSave={async (c) => { await addContaPagar(c); setModalContaPagar(false); saved("Conta a pagar registrada"); }} />
      </Modal>

      <Modal open={modalPagarConta !== null} onClose={() => setModalPagarConta(null)} title="Registrar Pagamento">
        {modalPagarConta !== null && (() => {
          const conta = contasPagar.find(c => c.id === modalPagarConta);
          if (!conta) return null;
          return (
            <FormPagarConta 
              conta={conta} 
              format={format} 
              onSave={async (dataPgto, formaPgto) => {
                const isAtrasada = conta.status === "Vencida";
                await updateContaPagar(conta.id, { status: isAtrasada ? "Paga com atraso" : "Paga", dataPagamento: dataPgto, formaPgto });
                setModalPagarConta(null);
                saved(`Conta "${conta.descricao}" marcada como paga`);
              }} 
            />
          );
        })()}
      </Modal>

      <Modal open={modalFiado} onClose={() => setModalFiado(false)} title="Registrar Fiado">
        <FormFiado onSave={async (c) => { await addContaReceber(c); setModalFiado(false); saved("Fiado registrado com sucesso"); }} />
      </Modal>

      <Modal open={modalPagamento !== null} onClose={() => setModalPagamento(null)} title="Registrar Pagamento">
        {modalPagamento !== null && (() => {
          const conta = contasReceber.find(c => c.id === modalPagamento);
          if (!conta) return null;
          return (
            <FormPagamentoFiado
              conta={conta}
              format={format}
              onSave={async (valor, formaPgto) => {
                await registrarPagamentoCR(conta.id, valor, formaPgto);
                setModalPagamento(null);
                saved("Pagamento registrado com sucesso");
              }}
            />
          );
        })()}
      </Modal>

      <Modal open={modalDespesa} onClose={() => setModalDespesa(false)} title="Nova Despesa">
        <FormDespesa registradoPor={userName} onSave={async (dItem) => { await addDespesa(dItem); setModalDespesa(false); saved("Despesa registrada"); }} />
      </Modal>

      <Modal open={modalFornecedor} onClose={() => setModalFornecedor(false)} title="Novo Fornecedor">
        <FormFornecedor onSave={async (f) => { await addFornecedor(f); setModalFornecedor(false); saved("Fornecedor cadastrado"); }} />
      </Modal>

      <Modal open={modalCompraFornecedor} onClose={() => setModalCompraFornecedor(false)} title="Registrar Compra / Pagamento">
        <FormCompraFornecedor 
          fornecedores={fornecedores} 
          format={format}
          onSave={async (fornecedorId, descricao, valorTotal, valorPago) => { 
            await registrarCompraFornecedor(fornecedorId, descricao, valorTotal, valorPago);
            setModalCompraFornecedor(false); 
            saved("Compra registrada com sucesso"); 
          }} 
        />
      </Modal>

      <Modal open={modalSalario !== null} onClose={() => setModalSalario(null)} title="Registrar Pagamento de Salário">
        {modalSalario && (() => {
          const s = salariosConfig.find(x => x.profissional === modalSalario);
          if (!s) return null;
          const comissao = Math.round(s.receitaGeradaMes * s.comissaoPct / 100);
          const adiantDesc = adiantamentos.filter(a => a.profissional === s.profissional && a.status === "Aprovado — aguardando desconto").reduce((a, ad) => a + ad.valorAprovado, 0);
          return (
            <FormPagarSalario
              profissional={s.profissional}
              fixo={s.fixo}
              comissao={comissao}
              adiantamentos={adiantDesc}
              format={format}
              onSave={async () => {
                await updateAdiantamentoStatus(s.profissional, "Descontado no salário");
                setModalSalario(null);
                saved(`Salário de ${s.profissional} pago: ${format(s.fixo + comissao - adiantDesc)}`);
              }}
            />
          );
        })()}
      </Modal>

      <Modal open={modalAdiantamento} onClose={() => setModalAdiantamento(false)} title="Novo Adiantamento">
        <FormAdiantamento
          profissionais={salariosConfig.map(s => s.profissional)}
          aprovadoPor={userName}
          onSave={async (a) => { await addAdiantamento(a); setModalAdiantamento(false); saved("Adiantamento registrado"); }}
        />
      </Modal>

      {/* View Movimentação Detail */}
      <Modal open={modalViewMov !== null} onClose={() => setModalViewMov(null)} title="Detalhes da Movimentação">
        {modalViewMov && (
          <div className="space-y-3">
            <div className="rounded-lg bg-surface2 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text3">Descrição:</span><span className="text-foreground font-medium">{modalViewMov.descricao}</span></div>
              <div className="flex justify-between"><span className="text-text3">Data/Hora:</span><span>{modalViewMov.data} às {modalViewMov.hora}</span></div>
              <div className="flex justify-between"><span className="text-text3">Tipo:</span><StatusBadge status={modalViewMov.tipo} /></div>
              <div className="flex justify-between"><span className="text-text3">Categoria:</span><span>{modalViewMov.categoria}</span></div>
              <div className="flex justify-between"><span className="text-text3">Valor:</span><span className={`font-bold ${modalViewMov.tipo === "Entrada" ? "text-green-custom" : "text-destructive"}`}>{format(modalViewMov.valor)}</span></div>
              <div className="flex justify-between"><span className="text-text3">Forma Pgto:</span><span>{modalViewMov.formaPgto}</span></div>
              {modalViewMov.beneficiarioOrigem && <div className="flex justify-between"><span className="text-text3">Beneficiário/Origem:</span><span>{modalViewMov.beneficiarioOrigem}</span></div>}
              <div className="flex justify-between"><span className="text-text3">Registrado por:</span><span>{modalViewMov.registradoPor}</span></div>
              {modalViewMov.observacoes && <div className="flex justify-between"><span className="text-text3">Observações:</span><span>{modalViewMov.observacoes}</span></div>}
              {modalViewMov.referencia && <div className="flex justify-between"><span className="text-text3">Referência:</span><span>{modalViewMov.referencia}</span></div>}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Confirmar exclusão"
        message="Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        variant="danger"
      />
    </div>
  );
}
