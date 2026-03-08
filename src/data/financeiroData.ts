// ===== DADOS MOCKADOS DO MÓDULO FINANCEIRO COMPLETO =====

export interface Movimentacao {
  id: number;
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
  id: number;
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
  id: number;
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
  id: number;
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
  id: number;
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
  profissional: string;
  profissionalId: number;
  tipo: "Fixo" | "Somente comissão" | "Fixo + comissão";
  fixo: number;
  comissaoPct: number;
  atendimentosMes: number;
  receitaGeradaMes: number;
}

export interface Adiantamento {
  id: number;
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
  id: number;
  nome: string;
  categoria: string;
  unidades: number;
  preco: number;
  custo: number;
}

export interface FechamentoCaixa {
  data: string;
  fechado: boolean;
  fechadoPor?: string;
  horaFechamento?: string;
  atendimentos: { hora: string; cliente: string; servico: string; profissional: string; valor: number; formaPgto: string }[];
  saidasDia: { hora: string; descricao: string; categoria: string; valor: number }[];
  descontos: number;
  receitaProdutos: number;
}

// ===== MOVIMENTAÇÕES =====
export const movimentacoesInit: Movimentacao[] = [
  { id: 1, data: "2025-03-04", hora: "09:15", descricao: "Atendimento - Coloração Ana Paula", categoria: "Serviço", tipo: "Entrada", valor: 18000, formaPgto: "Transferência", registradoPor: "Élise Monteiro", beneficiarioOrigem: "Ana Paula Souza" },
  { id: 2, data: "2025-03-04", hora: "10:30", descricao: "Compra produtos - Fornecedor Beleza Total", categoria: "Fornecedor", tipo: "Saída", valor: 45000, formaPgto: "Transferência", registradoPor: "Carlos Menezes", beneficiarioOrigem: "Beleza Total Lda" },
  { id: 3, data: "2025-03-04", hora: "11:00", descricao: "Atendimento - Progressiva Mariana", categoria: "Serviço", tipo: "Entrada", valor: 22000, formaPgto: "TPA", registradoPor: "Élise Monteiro", beneficiarioOrigem: "Mariana Ferreira" },
  { id: 4, data: "2025-03-04", hora: "14:00", descricao: "Pagamento aluguel Março", categoria: "Aluguel", tipo: "Saída", valor: 80000, formaPgto: "Transferência", registradoPor: "Carlos Menezes", beneficiarioOrigem: "Proprietário" },
  { id: 5, data: "2025-03-03", hora: "16:20", descricao: "Adiantamento salário - Rodrigo Alves", categoria: "Adiantamento", tipo: "Saída", valor: 20000, formaPgto: "Dinheiro", registradoPor: "Élise Monteiro", beneficiarioOrigem: "Rodrigo Alves" },
  { id: 6, data: "2025-03-03", hora: "09:00", descricao: "Atendimento - Corte + Barba Diego", categoria: "Serviço", tipo: "Entrada", valor: 8000, formaPgto: "Dinheiro", registradoPor: "Rodrigo Alves", beneficiarioOrigem: "Diego Mendes" },
  { id: 7, data: "2025-03-03", hora: "11:00", descricao: "Atendimento - Manicure Beatriz", categoria: "Serviço", tipo: "Entrada", valor: 6000, formaPgto: "TPA", registradoPor: "Camile Torres", beneficiarioOrigem: "Beatriz Martins" },
  { id: 8, data: "2025-03-02", hora: "10:00", descricao: "Venda Shampoo Reconstrutor", categoria: "Venda de Produto", tipo: "Entrada", valor: 4500, formaPgto: "Dinheiro", registradoPor: "Élise Monteiro", beneficiarioOrigem: "Sofia Karinne" },
  { id: 9, data: "2025-03-02", hora: "15:00", descricao: "Material de limpeza", categoria: "Despesa Operacional", tipo: "Saída", valor: 5500, formaPgto: "Dinheiro", registradoPor: "Carlos Menezes", beneficiarioOrigem: "Loja de Limpeza" },
  { id: 10, data: "2025-03-01", hora: "09:30", descricao: "Atendimento - Hidratação Fernanda", categoria: "Serviço", tipo: "Entrada", valor: 9000, formaPgto: "Transferência", registradoPor: "Patrícia Nunes", beneficiarioOrigem: "Fernanda Ribeiro" },
  { id: 11, data: "2025-03-01", hora: "14:00", descricao: "Conta de internet", categoria: "Despesa Operacional", tipo: "Saída", valor: 8500, formaPgto: "Transferência", registradoPor: "Carlos Menezes", beneficiarioOrigem: "ISP Angola" },
  { id: 12, data: "2025-03-01", hora: "16:00", descricao: "Atendimento - Escova Camila", categoria: "Serviço", tipo: "Entrada", valor: 7000, formaPgto: "TPA", registradoPor: "Rodrigo Alves", beneficiarioOrigem: "Camila Wanderley" },
];

// ===== CONTAS A PAGAR =====
export const contasAPagarInit: ContaPagar[] = [
  { id: 1, fornecedorBeneficiario: "Proprietário do Imóvel", descricao: "Aluguel Abril", categoria: "Aluguel", valor: 80000, vencimento: "2025-04-01", status: "Pendente", recorrencia: "Mensal" },
  { id: 2, fornecedorBeneficiario: "Banco TPA", descricao: "Fatura TPA - Março", categoria: "Administrativo", valor: 8500, vencimento: "2025-03-06", status: "Vencida" },
  { id: 3, fornecedorBeneficiario: "Beleza Total Lda", descricao: "Fornecedor Beleza Total - Produtos capilares", categoria: "Fornecedor", valor: 45000, vencimento: "2025-03-15", status: "Pendente" },
  { id: 4, fornecedorBeneficiario: "ISP Angola", descricao: "Internet + Telefone Março", categoria: "Utilidades", valor: 8500, vencimento: "2025-03-10", status: "Pendente", recorrencia: "Mensal" },
  { id: 5, fornecedorBeneficiario: "EDEL", descricao: "Conta de luz Março", categoria: "Utilidades", valor: 18000, vencimento: "2025-03-12", status: "Pendente", recorrencia: "Mensal" },
  { id: 6, fornecedorBeneficiario: "EquipSalon", descricao: "Parcela equipamento secador", categoria: "Equipamento", valor: 40000, vencimento: "2025-03-20", status: "Pendente", recorrencia: "Mensal" },
  { id: 7, fornecedorBeneficiario: "Proprietário do Imóvel", descricao: "Aluguel Março", categoria: "Aluguel", valor: 80000, vencimento: "2025-03-01", status: "Paga", dataPagamento: "2025-03-01", formaPgto: "Transferência" },
];

// ===== CONTAS A RECEBER =====
export const contasAReceberInit: ContaReceber[] = [
  { id: 1, cliente: "Beatriz Martins", servico: "Coloração completa", valorTotal: 25000, valorPago: 10000, vencimento: "2025-03-10", status: "Parcialmente pago", dataServico: "2025-02-28", historicoPagamentos: [{ data: "2025-02-28", valor: 10000, forma: "Dinheiro" }] },
  { id: 2, cliente: "Diego Mendes", servico: "Corte + Barba + Hidratação", valorTotal: 12000, valorPago: 0, vencimento: "2025-03-08", status: "Vencido", dataServico: "2025-03-01" },
  { id: 3, cliente: "Sofia Karinne", servico: "Progressiva + Hidratação", valorTotal: 35000, valorPago: 20000, vencimento: "2025-03-15", status: "Parcialmente pago", dataServico: "2025-03-05", historicoPagamentos: [{ data: "2025-03-05", valor: 20000, forma: "TPA" }] },
  { id: 4, cliente: "Camila Wanderley", servico: "Pacote mensal coloração", valorTotal: 45000, valorPago: 45000, vencimento: "2025-03-01", status: "Quitado", dataServico: "2025-02-15", historicoPagamentos: [{ data: "2025-02-15", valor: 25000, forma: "Transferência" }, { data: "2025-03-01", valor: 20000, forma: "TPA" }] },
  { id: 5, cliente: "Ana Paula Souza", servico: "Escova + Manicure", valorTotal: 14000, valorPago: 0, vencimento: "2025-03-20", status: "Em aberto", dataServico: "2025-03-04" },
];

// ===== DESPESAS =====
export const despesasInit: Despesa[] = [
  { id: 1, data: "2025-03-04", descricao: "Pagamento aluguel Março", categoria: "Aluguel", valor: 80000, formaPgto: "Transferência", registradoPor: "Carlos Menezes", recorrencia: "Mensal" },
  { id: 2, data: "2025-03-03", descricao: "Conta de energia EDEL", categoria: "Utilidades", valor: 18000, formaPgto: "Transferência", registradoPor: "Carlos Menezes", recorrencia: "Mensal", nrFatura: "EDEL-2025-0312" },
  { id: 3, data: "2025-03-02", descricao: "Material de limpeza escritório", categoria: "Manutenção", valor: 5500, formaPgto: "Dinheiro", registradoPor: "Carlos Menezes", recorrencia: "Única" },
  { id: 4, data: "2025-03-01", descricao: "Internet + Telefone ISP", categoria: "Utilidades", valor: 8500, formaPgto: "Transferência", registradoPor: "Carlos Menezes", recorrencia: "Mensal", nrFatura: "ISP-2025-0301" },
  { id: 5, data: "2025-03-01", descricao: "Campanha Instagram - Março", categoria: "Marketing", valor: 15000, formaPgto: "Transferência", registradoPor: "Élise Monteiro", recorrencia: "Mensal" },
  { id: 6, data: "2025-02-28", descricao: "Manutenção cadeira hidráulica", categoria: "Manutenção", valor: 6000, formaPgto: "Dinheiro", registradoPor: "Carlos Menezes", recorrencia: "Única" },
  { id: 7, data: "2025-02-27", descricao: "Transporte fornecedor", categoria: "Transporte", valor: 3500, formaPgto: "Dinheiro", registradoPor: "Carlos Menezes", recorrencia: "Única" },
  { id: 8, data: "2025-02-25", descricao: "Seguro do espaço", categoria: "Administrativo", valor: 11000, formaPgto: "Transferência", registradoPor: "Carlos Menezes", recorrencia: "Mensal" },
];

// ===== FORNECEDORES =====
export const fornecedoresInit: Fornecedor[] = [
  { id: 1, nome: "Beleza Total Lda", categoria: "Produtos capilares", contato: "923 456 789", nif: "5417023LA041", saldoDevedor: 45000, ultimaCompra: "04 Mar 2025", email: "belezatotal@email.ao", endereco: "Rua da Samba, 45 - Luanda", nomeContato: "João Silva", historicoCompras: [{ data: "2025-03-04", descricao: "Shampoos e máscaras", valor: 45000, pago: 0 }, { data: "2025-02-10", descricao: "Colorações Wella", valor: 32000, pago: 32000 }] },
  { id: 2, nome: "ProNails Angola", categoria: "Materiais de unhas", contato: "912 345 678", nif: "5418111LA042", saldoDevedor: 0, ultimaCompra: "20 Fev 2025", email: "pronails@email.ao", endereco: "Av. 4 de Fevereiro, 120 - Luanda", nomeContato: "Maria Santos", historicoCompras: [{ data: "2025-02-20", descricao: "Esmaltes gel UV + base", valor: 18000, pago: 18000 }] },
  { id: 3, nome: "EquipSalon", categoria: "Equipamentos", contato: "934 567 890", nif: "5419222LA043", saldoDevedor: 120000, ultimaCompra: "10 Jan 2025", email: "equipsalon@email.ao", endereco: "Zona Industrial, Viana - Luanda", nomeContato: "Pedro Campos", historicoCompras: [{ data: "2025-01-10", descricao: "Secador profissional + lavatório", valor: 200000, pago: 80000 }] },
];

// ===== SALÁRIOS & COMISSÕES =====
export const salariosConfig: SalarioConfig[] = [
  { profissional: "Élise Monteiro", profissionalId: 1, tipo: "Fixo + comissão", fixo: 80000, comissaoPct: 15, atendimentosMes: 62, receitaGeradaMes: 280000 },
  { profissional: "Rodrigo Alves", profissionalId: 2, tipo: "Somente comissão", fixo: 0, comissaoPct: 40, atendimentosMes: 78, receitaGeradaMes: 195000 },
  { profissional: "Camile Torres", profissionalId: 3, tipo: "Somente comissão", fixo: 0, comissaoPct: 35, atendimentosMes: 94, receitaGeradaMes: 156000 },
  { profissional: "Patrícia Nunes", profissionalId: 4, tipo: "Fixo + comissão", fixo: 60000, comissaoPct: 20, atendimentosMes: 41, receitaGeradaMes: 123000 },
];

// ===== ADIANTAMENTOS =====
export const adiantamentosInit: Adiantamento[] = [
  { id: 1, profissional: "Rodrigo Alves", valorSolicitado: 20000, valorAprovado: 20000, data: "2025-03-03", mesDesconto: "Março 2025", status: "Aprovado — aguardando desconto", aprovadoPor: "Élise Monteiro", motivo: "Despesa pessoal urgente" },
  { id: 2, profissional: "Camile Torres", valorSolicitado: 15000, valorAprovado: 15000, data: "2025-02-15", mesDesconto: "Fevereiro 2025", status: "Descontado no salário", aprovadoPor: "Élise Monteiro", motivo: "Medicamentos" },
  { id: 3, profissional: "Patrícia Nunes", valorSolicitado: 25000, valorAprovado: 0, data: "2025-03-06", mesDesconto: "Março 2025", status: "Pendente aprovação", aprovadoPor: "", motivo: "Reparação veículo" },
];

// ===== PRODUTOS VENDIDOS =====
export const produtosVendidosInit: ProdutoVendido[] = [
  { id: 1, nome: "Shampoo Reconstrutor 300ml", categoria: "Capilar", unidades: 18, preco: 4500, custo: 2200 },
  { id: 2, nome: "Máscara Hidratação Intensa", categoria: "Capilar", unidades: 12, preco: 6800, custo: 3100 },
  { id: 3, nome: "Óleo Finalizador", categoria: "Capilar", unidades: 9, preco: 5200, custo: 2400 },
  { id: 4, nome: "Esmalte Gel UV", categoria: "Unhas", unidades: 24, preco: 1800, custo: 600 },
  { id: 5, nome: "Creme para Barba", categoria: "Barba", unidades: 7, preco: 3500, custo: 1400 },
  { id: 6, nome: "Condicionador Profissional 500ml", categoria: "Capilar", unidades: 15, preco: 3800, custo: 1800 },
  { id: 7, nome: "Kit Manicure Gel", categoria: "Unhas", unidades: 6, preco: 8500, custo: 4200 },
  { id: 8, nome: "Spray Finalizador Térmico", categoria: "Capilar", unidades: 11, preco: 4200, custo: 1900 },
];

// ===== FECHAMENTO DE CAIXA =====
export const fechamentoCaixaInit: FechamentoCaixa = {
  data: "2025-03-04",
  fechado: false,
  atendimentos: [
    { hora: "09:15", cliente: "Ana Paula Souza", servico: "Coloração", profissional: "Élise Monteiro", valor: 18000, formaPgto: "Transferência" },
    { hora: "11:00", cliente: "Mariana Ferreira", servico: "Progressiva", profissional: "Élise Monteiro", valor: 22000, formaPgto: "TPA" },
    { hora: "10:00", cliente: "Diego Mendes", servico: "Corte + Barba", profissional: "Rodrigo Alves", valor: 8000, formaPgto: "Dinheiro" },
    { hora: "14:00", cliente: "Camila Wanderley", servico: "Escova Modeladora", profissional: "Rodrigo Alves", valor: 7000, formaPgto: "TPA" },
    { hora: "15:00", cliente: "Beatriz Martins", servico: "Manicure + Pedicure", profissional: "Camile Torres", valor: 6000, formaPgto: "Dinheiro" },
    { hora: "16:00", cliente: "Fernanda Ribeiro", servico: "Limpeza de Pele", profissional: "Patrícia Nunes", valor: 12000, formaPgto: "Transferência" },
  ],
  saidasDia: [
    { hora: "10:30", descricao: "Compra produtos Beleza Total", categoria: "Fornecedor", valor: 45000 },
    { hora: "14:00", descricao: "Pagamento aluguel Março", categoria: "Aluguel", valor: 80000 },
  ],
  descontos: 3000,
  receitaProdutos: 4500,
};

// ===== DADOS DE GRÁFICOS =====
export const receitaDespesasMensal = [
  { mes: "Out", receita: 420000, despesas: 285000, lucro: 135000 },
  { mes: "Nov", receita: 445000, despesas: 310000, lucro: 135000 },
  { mes: "Dez", receita: 520000, despesas: 340000, lucro: 180000 },
  { mes: "Jan", receita: 380000, despesas: 290000, lucro: 90000 },
  { mes: "Fev", receita: 456000, despesas: 318000, lucro: 138000 },
  { mes: "Mar", receita: 468000, despesas: 385500, lucro: 82500 },
];

export const formaPagamentoData = [
  { name: "Dinheiro", value: 45000 },
  { name: "Transferência", value: 87500 },
  { name: "TPA (cartão)", value: 32000 },
];

export const fluxoCaixaDiario = [
  { dia: "01", entradas: 16000, saidas: 8500 },
  { dia: "02", entradas: 4500, saidas: 5500 },
  { dia: "03", entradas: 14000, saidas: 20000 },
  { dia: "04", entradas: 40000, saidas: 125000 },
  { dia: "05", entradas: 22000, saidas: 3000 },
  { dia: "06", entradas: 18000, saidas: 4500 },
  { dia: "07", entradas: 15000, saidas: 2000 },
];

export const topServicosReceita = [
  { nome: "Coloração", receita: 142000 },
  { nome: "Progressiva / Botox", receita: 98000 },
  { nome: "Corte Feminino", receita: 68000 },
  { nome: "Manicure + Pedicure", receita: 48000 },
  { nome: "Hidratação Capilar", receita: 42000 },
];

// ===== CATEGORIAS DE DESPESAS (com ícones) =====
export const categoriasDespesa = [
  { key: "Aluguel", label: "Aluguel", icon: "🏠" },
  { key: "Utilidades", label: "Utilidades", icon: "💡" },
  { key: "Produtos/Insumos", label: "Produtos/Insumos", icon: "🛒" },
  { key: "Manutenção", label: "Manutenção", icon: "🔧" },
  { key: "Marketing", label: "Marketing", icon: "📱" },
  { key: "Transporte", label: "Transporte", icon: "🚗" },
  { key: "Administrativo", label: "Administrativo", icon: "📋" },
  { key: "Outras", label: "Outras", icon: "➕" },
];

// ===== DRE DATA =====
export const dreData = {
  servicosPrestados: 420000,
  vendaProdutos: 48000,
  descontosConcedidos: 12000,
  despesasOperacionais: {
    aluguel: 80000,
    aguaEnergia: 18000,
    internetTelefone: 8500,
    marketing: 15000,
    manutencao: 6000,
    outros: 11000,
  },
  despesasPessoal: {
    salarios: 140000,
    comissoes: 87000,
    adiantamentos: 20000,
  },
  compraFornecedores: 32000,
};
