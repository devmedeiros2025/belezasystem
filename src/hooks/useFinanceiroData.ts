import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ===== TYPES (DB-backed, UUID ids) =====
export interface Movimentacao {
  id: string;
  data: string;
  hora: string;
  descricao: string;
  categoria: string;
  tipo: "Entrada" | "Saída";
  valor: number;
  formaPgto: "Dinheiro" | "Transferência" | "TPA";
  registradoPor: string;
  beneficiarioOrigem?: string;
  observacoes?: string;
  referencia?: string;
}

export interface ContaPagar {
  id: string;
  fornecedorBeneficiario: string;
  descricao: string;
  categoria: string;
  valor: number;
  vencimento: string;
  status: "Pendente" | "Vencida" | "Paga" | "Paga com atraso";
  recorrencia?: "Única" | "Mensal" | "Trimestral";
  dataPagamento?: string;
  formaPgto?: string;
}

export interface ContaReceber {
  id: string;
  cliente: string;
  servico: string;
  valorTotal: number;
  valorPago: number;
  vencimento: string;
  status: "Em aberto" | "Parcialmente pago" | "Quitado" | "Vencido";
  dataServico?: string;
  observacoes?: string;
  historicoPagamentos?: { data: string; valor: number; forma: string }[];
}

export interface Despesa {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  fornecedor?: string;
  valor: number;
  formaPgto: string;
  comprovante?: string;
  registradoPor: string;
  recorrencia: "Única" | "Mensal";
  nrFatura?: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  categoria: string;
  contato: string;
  nif: string;
  saldoDevedor: number;
  ultimaCompra: string;
  email?: string;
  endereco?: string;
  nomeContato?: string;
  observacoes?: string;
  historicoCompras?: { data: string; descricao: string; valor: number; pago: number }[];
}

export interface SalarioConfig {
  id: string;
  profissional: string;
  profissionalId: string | null;
  tipo: "Fixo" | "Somente comissão" | "Fixo + comissão";
  fixo: number;
  comissaoPct: number;
  atendimentosMes: number;
  receitaGeradaMes: number;
}

export interface Adiantamento {
  id: string;
  data: string;
  profissional: string;
  valorSolicitado: number;
  valorAprovado: number;
  aprovadoPor: string;
  mesDesconto: string;
  status: "Aprovado — aguardando desconto" | "Descontado no salário" | "Pendente aprovação";
  motivo?: string;
}

export interface ProdutoVendido {
  id: string;
  nome: string;
  categoria: string;
  unidades: number;
  preco: number;
  custo: number;
}

export interface FechamentoCaixa {
  id?: string;
  data: string;
  fechado: boolean;
  fechadoPor?: string;
  horaFechamento?: string;
  descontos: number;
  receitaProdutos: number;
}

export function useFinanceiroData() {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [salariosConfig, setSalariosConfig] = useState<SalarioConfig[]>([]);
  const [adiantamentos, setAdiantamentos] = useState<Adiantamento[]>([]);
  const [produtosVendidos, setProdutosVendidos] = useState<ProdutoVendido[]>([]);
  const [fechamento, setFechamento] = useState<FechamentoCaixa>({ data: new Date().toISOString().slice(0, 10), fechado: false, descontos: 0, receitaProdutos: 0 });
  const [loading, setLoading] = useState(true);

  // ===== FETCH ALL =====
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [movRes, cpRes, crRes, dRes, fRes, scRes, adRes, pvRes, fcRes] = await Promise.all([
      supabase.from("movimentacoes").select("*").order("data", { ascending: false }).order("hora", { ascending: false }),
      supabase.from("contas_pagar").select("*").order("vencimento"),
      supabase.from("contas_receber").select("*, contas_receber_pagamentos(*)").order("vencimento"),
      supabase.from("despesas").select("*").order("data", { ascending: false }),
      supabase.from("fornecedores").select("*, fornecedor_compras(*)").order("nome"),
      supabase.from("salarios_config").select("*").order("profissional"),
      supabase.from("adiantamentos").select("*").order("data", { ascending: false }),
      supabase.from("produtos_vendidos").select("*").order("nome"),
      supabase.from("fechamentos_caixa").select("*").eq("data", new Date().toISOString().slice(0, 10)).limit(1),
    ]);

    if (movRes.data) setMovimentacoes(movRes.data.map(mapMov));
    if (cpRes.data) setContasPagar(cpRes.data.map(mapCP));
    if (crRes.data) setContasReceber(crRes.data.map(mapCR));
    if (dRes.data) setDespesas(dRes.data.map(mapDesp));
    if (fRes.data) setFornecedores(fRes.data.map(mapForn));
    if (scRes.data) setSalariosConfig(scRes.data.map(mapSC));
    if (adRes.data) setAdiantamentos(adRes.data.map(mapAd));
    if (pvRes.data) setProdutosVendidos(pvRes.data.map(mapPV));
    if (fcRes.data && fcRes.data.length > 0) {
      const fc = fcRes.data[0];
      setFechamento({ id: fc.id, data: fc.data, fechado: fc.fechado, fechadoPor: fc.fechado_por || undefined, horaFechamento: fc.hora_fechamento || undefined, descontos: Number(fc.descontos), receitaProdutos: Number(fc.receita_produtos) });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ===== MAPPERS =====
  const mapMov = (r: any): Movimentacao => ({
    id: r.id, data: r.data, hora: r.hora?.substring(0, 5) || "", descricao: r.descricao,
    categoria: r.categoria, tipo: r.tipo as any, valor: Number(r.valor),
    formaPgto: r.forma_pgto as any, registradoPor: r.registrado_por,
    beneficiarioOrigem: r.beneficiario_origem, observacoes: r.observacoes, referencia: r.referencia,
  });

  const mapCP = (r: any): ContaPagar => ({
    id: r.id, fornecedorBeneficiario: r.fornecedor_beneficiario, descricao: r.descricao,
    categoria: r.categoria, valor: Number(r.valor), vencimento: r.vencimento,
    status: r.status as any, recorrencia: r.recorrencia as any,
    dataPagamento: r.data_pagamento, formaPgto: r.forma_pgto,
  });

  const mapCR = (r: any): ContaReceber => ({
    id: r.id, cliente: r.cliente, servico: r.servico,
    valorTotal: Number(r.valor_total), valorPago: Number(r.valor_pago),
    vencimento: r.vencimento, status: r.status as any,
    dataServico: r.data_servico, observacoes: r.observacoes,
    historicoPagamentos: (r.contas_receber_pagamentos || []).map((p: any) => ({
      data: p.data, valor: Number(p.valor), forma: p.forma,
    })),
  });

  const mapDesp = (r: any): Despesa => ({
    id: r.id, data: r.data, descricao: r.descricao, categoria: r.categoria,
    fornecedor: r.fornecedor, valor: Number(r.valor), formaPgto: r.forma_pgto,
    comprovante: r.comprovante, registradoPor: r.registrado_por,
    recorrencia: r.recorrencia as any, nrFatura: r.nr_fatura,
  });

  const mapForn = (r: any): Fornecedor => ({
    id: r.id, nome: r.nome, categoria: r.categoria, contato: r.contato,
    nif: r.nif || "", saldoDevedor: Number(r.saldo_devedor),
    ultimaCompra: r.ultima_compra || "—", email: r.email, endereco: r.endereco,
    nomeContato: r.nome_contato, observacoes: r.observacoes,
    historicoCompras: (r.fornecedor_compras || []).map((c: any) => ({
      data: c.data, descricao: c.descricao, valor: Number(c.valor), pago: Number(c.pago),
    })),
  });

  const mapSC = (r: any): SalarioConfig => ({
    id: r.id, profissional: r.profissional, profissionalId: r.profissional_id,
    tipo: r.tipo as any, fixo: Number(r.fixo), comissaoPct: Number(r.comissao_pct),
    atendimentosMes: r.atendimentos_mes, receitaGeradaMes: Number(r.receita_gerada_mes),
  });

  const mapAd = (r: any): Adiantamento => ({
    id: r.id, data: r.data, profissional: r.profissional,
    valorSolicitado: Number(r.valor_solicitado), valorAprovado: Number(r.valor_aprovado),
    aprovadoPor: r.aprovado_por, mesDesconto: r.mes_desconto,
    status: r.status as any, motivo: r.motivo,
  });

  const mapPV = (r: any): ProdutoVendido => ({
    id: r.id, nome: r.nome, categoria: r.categoria,
    unidades: r.unidades, preco: Number(r.preco), custo: Number(r.custo),
  });

  // ===== CRUD: MOVIMENTACOES =====
  const addMovimentacao = async (m: Omit<Movimentacao, "id">) => {
    const { data, error } = await supabase.from("movimentacoes").insert({
      data: m.data, hora: m.hora + ":00", descricao: m.descricao, categoria: m.categoria,
      tipo: m.tipo, valor: m.valor, forma_pgto: m.formaPgto, registrado_por: m.registradoPor,
      beneficiario_origem: m.beneficiarioOrigem, observacoes: m.observacoes, referencia: m.referencia,
    }).select().single();
    if (error) { toast.error("Erro ao salvar movimentação"); return null; }
    const mapped = mapMov(data);
    setMovimentacoes(prev => [mapped, ...prev]);
    return mapped;
  };

  const deleteMovimentacao = async (id: string) => {
    const { error } = await supabase.from("movimentacoes").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    setMovimentacoes(prev => prev.filter(x => x.id !== id));
  };

  // ===== CRUD: CONTAS A PAGAR =====
  const addContaPagar = async (c: Omit<ContaPagar, "id">) => {
    const { data, error } = await supabase.from("contas_pagar").insert({
      fornecedor_beneficiario: c.fornecedorBeneficiario, descricao: c.descricao,
      categoria: c.categoria, valor: c.valor, vencimento: c.vencimento,
      status: c.status, recorrencia: c.recorrencia,
    }).select().single();
    if (error) { toast.error("Erro ao salvar conta"); return null; }
    const mapped = mapCP(data);
    setContasPagar(prev => [mapped, ...prev]);
    return mapped;
  };

  const updateContaPagar = async (id: string, updates: Partial<Record<string, any>>) => {
    const dbUpdates: any = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.dataPagamento) dbUpdates.data_pagamento = updates.dataPagamento;
    if (updates.formaPgto) dbUpdates.forma_pgto = updates.formaPgto;
    const { error } = await supabase.from("contas_pagar").update(dbUpdates).eq("id", id);
    if (error) { toast.error("Erro ao atualizar conta"); return; }
    setContasPagar(prev => prev.map(x => x.id === id ? { ...x, ...updates } as ContaPagar : x));
  };

  const deleteContaPagar = async (id: string) => {
    const { error } = await supabase.from("contas_pagar").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    setContasPagar(prev => prev.filter(x => x.id !== id));
  };

  // ===== CRUD: CONTAS A RECEBER =====
  const addContaReceber = async (c: Omit<ContaReceber, "id">) => {
    const { data, error } = await supabase.from("contas_receber").insert({
      cliente: c.cliente, servico: c.servico, valor_total: c.valorTotal,
      valor_pago: c.valorPago, vencimento: c.vencimento, status: c.status,
      data_servico: c.dataServico, observacoes: c.observacoes,
    }).select().single();
    if (error) { toast.error("Erro ao salvar conta a receber"); return null; }
    // If there's an initial payment, register it
    if (c.valorPago > 0 && c.historicoPagamentos?.length) {
      const hp = c.historicoPagamentos[0];
      await supabase.from("contas_receber_pagamentos").insert({
        conta_receber_id: data.id, data: hp.data, valor: hp.valor, forma: hp.forma,
      });
    }
    const mapped: ContaReceber = { ...mapCR(data), historicoPagamentos: c.historicoPagamentos || [] };
    setContasReceber(prev => [mapped, ...prev]);
    return mapped;
  };

  const registrarPagamentoCR = async (id: string, valor: number, formaPgto: string) => {
    const conta = contasReceber.find(c => c.id === id);
    if (!conta) return;
    const novoPago = conta.valorPago + valor;
    const newStatus = novoPago >= conta.valorTotal ? "Quitado" : "Parcialmente pago";
    const dataHoje = new Date().toISOString().slice(0, 10);

    const [updateRes, insertRes] = await Promise.all([
      supabase.from("contas_receber").update({ valor_pago: novoPago, status: newStatus }).eq("id", id),
      supabase.from("contas_receber_pagamentos").insert({ conta_receber_id: id, data: dataHoje, valor, forma: formaPgto }),
    ]);
    if (updateRes.error || insertRes.error) { toast.error("Erro ao registrar pagamento"); return; }

    setContasReceber(prev => prev.map(c => {
      if (c.id !== id) return c;
      return {
        ...c, valorPago: novoPago, status: newStatus as any,
        historicoPagamentos: [...(c.historicoPagamentos || []), { data: dataHoje, valor, forma: formaPgto }],
      };
    }));
  };

  const deleteContaReceber = async (id: string) => {
    const { error } = await supabase.from("contas_receber").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    setContasReceber(prev => prev.filter(x => x.id !== id));
  };

  // ===== CRUD: DESPESAS =====
  const addDespesa = async (d: Omit<Despesa, "id">) => {
    const { data, error } = await supabase.from("despesas").insert({
      data: d.data, descricao: d.descricao, categoria: d.categoria,
      fornecedor: d.fornecedor, valor: d.valor, forma_pgto: d.formaPgto,
      registrado_por: d.registradoPor, recorrencia: d.recorrencia, nr_fatura: d.nrFatura,
    }).select().single();
    if (error) { toast.error("Erro ao salvar despesa"); return null; }
    const mapped = mapDesp(data);
    setDespesas(prev => [mapped, ...prev]);
    return mapped;
  };

  const deleteDespesa = async (id: string) => {
    const { error } = await supabase.from("despesas").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    setDespesas(prev => prev.filter(x => x.id !== id));
  };

  // ===== CRUD: FORNECEDORES =====
  const addFornecedor = async (f: Omit<Fornecedor, "id">) => {
    const { data, error } = await supabase.from("fornecedores").insert({
      nome: f.nome, categoria: f.categoria, contato: f.contato, nif: f.nif,
      saldo_devedor: f.saldoDevedor, email: f.email, endereco: f.endereco,
      nome_contato: f.nomeContato, observacoes: f.observacoes,
    }).select().single();
    if (error) { toast.error("Erro ao salvar fornecedor"); return null; }
    const mapped: Fornecedor = { ...mapForn(data), historicoCompras: [] };
    setFornecedores(prev => [...prev, mapped]);
    return mapped;
  };

  const registrarCompraFornecedor = async (fornecedorId: string, descricao: string, valorTotal: number, valorPago: number) => {
    const dataHoje = new Date().toISOString().slice(0, 10);
    const forn = fornecedores.find(f => f.id === fornecedorId);
    if (!forn) return;
    const novoSaldo = forn.saldoDevedor + valorTotal - valorPago;

    const [compraRes, updateRes] = await Promise.all([
      supabase.from("fornecedor_compras").insert({
        fornecedor_id: fornecedorId, data: dataHoje, descricao, valor: valorTotal, pago: valorPago,
      }),
      supabase.from("fornecedores").update({
        saldo_devedor: novoSaldo, ultima_compra: new Date().toLocaleDateString("pt-BR"),
      }).eq("id", fornecedorId),
    ]);
    if (compraRes.error || updateRes.error) { toast.error("Erro ao registrar compra"); return; }

    setFornecedores(prev => prev.map(f => {
      if (f.id !== fornecedorId) return f;
      return {
        ...f, saldoDevedor: novoSaldo,
        ultimaCompra: new Date().toLocaleDateString("pt-BR"),
        historicoCompras: [...(f.historicoCompras || []), { data: dataHoje, descricao, valor: valorTotal, pago: valorPago }],
      };
    }));
  };

  const deleteFornecedor = async (id: string) => {
    const { error } = await supabase.from("fornecedores").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    setFornecedores(prev => prev.filter(x => x.id !== id));
  };

  // ===== CRUD: ADIANTAMENTOS =====
  const addAdiantamento = async (a: Omit<Adiantamento, "id">) => {
    const { data, error } = await supabase.from("adiantamentos").insert({
      data: a.data, profissional: a.profissional, valor_solicitado: a.valorSolicitado,
      valor_aprovado: a.valorAprovado, aprovado_por: a.aprovadoPor,
      mes_desconto: a.mesDesconto, status: a.status, motivo: a.motivo,
    }).select().single();
    if (error) { toast.error("Erro ao salvar adiantamento"); return null; }
    const mapped = mapAd(data);
    setAdiantamentos(prev => [...prev, mapped]);
    return mapped;
  };

  const updateAdiantamentoStatus = async (profissional: string, newStatus: string) => {
    const toUpdate = adiantamentos.filter(a => a.profissional === profissional && a.status === "Aprovado — aguardando desconto");
    for (const a of toUpdate) {
      await supabase.from("adiantamentos").update({ status: newStatus }).eq("id", a.id);
    }
    setAdiantamentos(prev => prev.map(a =>
      a.profissional === profissional && a.status === "Aprovado — aguardando desconto"
        ? { ...a, status: newStatus as any } : a
    ));
  };

  // ===== FECHAMENTO =====
  const fecharCaixa = async (userName: string) => {
    const dataHoje = new Date().toISOString().slice(0, 10);
    const horaAgora = new Date().toTimeString().slice(0, 5);
    if (fechamento.id) {
      await supabase.from("fechamentos_caixa").update({ fechado: true, fechado_por: userName, hora_fechamento: horaAgora }).eq("id", fechamento.id);
    } else {
      const { data } = await supabase.from("fechamentos_caixa").insert({ data: dataHoje, fechado: true, fechado_por: userName, hora_fechamento: horaAgora, descontos: fechamento.descontos, receita_produtos: fechamento.receitaProdutos }).select().single();
      if (data) setFechamento(prev => ({ ...prev, id: data.id }));
    }
    setFechamento(prev => ({ ...prev, fechado: true, fechadoPor: userName, horaFechamento: horaAgora }));
  };

  return {
    loading,
    movimentacoes, setMovimentacoes, addMovimentacao, deleteMovimentacao,
    contasPagar, setContasPagar, addContaPagar, updateContaPagar, deleteContaPagar,
    contasReceber, setContasReceber, addContaReceber, registrarPagamentoCR, deleteContaReceber,
    despesas, setDespesas, addDespesa, deleteDespesa,
    fornecedores, setFornecedores, addFornecedor, registrarCompraFornecedor, deleteFornecedor,
    salariosConfig, setSalariosConfig,
    adiantamentos, setAdiantamentos, addAdiantamento, updateAdiantamentoStatus,
    produtosVendidos, setProdutosVendidos,
    fechamento, setFechamento, fecharCaixa,
    refetch: fetchAll,
  };
}
