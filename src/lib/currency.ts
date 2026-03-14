/**
 * Utilitários de moeda e pagamento — padrão Angola (Kwanza)
 */

export const FORMAS_PAGAMENTO = [
  "Numerário",
  "TPA",
  "Transferência bancária",
  "Multicaixa Express",
  "Referência Multicaixa",
] as const;

export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export const FORMAS_PAGAMENTO_OPTIONS = FORMAS_PAGAMENTO.map((f) => ({
  value: f,
  label: f,
}));

/**
 * Formata um valor numérico como Kwanza angolano.
 * Exemplo: formatKz(1250) → "Kz 1.250,00"
 */
export function formatKz(valor: number): string {
  const formatted = valor.toLocaleString("pt-AO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Kz ${formatted}`;
}

/**
 * Converte string com vírgula decimal para número.
 * Ex: "1.250,50" → 1250.50
 */
export function parseKzInput(value: string): number {
  const cleaned = value.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Formata data no padrão DD/MM/AAAA
 */
export function formatDateAO(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("pt-AO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
