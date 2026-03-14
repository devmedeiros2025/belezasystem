import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { formatKz } from "@/lib/currency";

interface CotacaoData {
  USD: number;
  BRL: number;
  CNY: number;
  lastUpdate: string;
  prevUSD?: number;
  prevBRL?: number;
  prevCNY?: number;
}

const FALLBACK: CotacaoData = {
  USD: 917.0,
  BRL: 175.8,
  CNY: 128.5,
  lastUpdate: new Date().toISOString(),
};

const MOEDAS_DISPLAY = [
  { code: "USD" as const, flag: "🇺🇸", label: "USD" },
  { code: "BRL" as const, flag: "🇧🇷", label: "BRL" },
  { code: "CNY" as const, flag: "🇨🇳", label: "CNY" },
];

export default function CambioWidget() {
  const [cotacoes, setCotacoes] = useState<CotacaoData>(FALLBACK);
  const [loading, setLoading] = useState(false);
  const [conversorValor, setConversorValor] = useState("");
  const [conversorMoeda, setConversorMoeda] = useState<"USD" | "BRL" | "CNY">("USD");

  const fetchCotacoes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      const rates = data.rates;
      // AOA is the ISO code for Kwanza
      const aoa = rates.AOA || 917;
      const brlToAoa = aoa / (rates.BRL || 5.2);
      const cnyToAoa = aoa / (rates.CNY || 7.15);

      setCotacoes((prev) => ({
        prevUSD: prev.USD,
        prevBRL: prev.BRL,
        prevCNY: prev.CNY,
        USD: Math.round(aoa * 100) / 100,
        BRL: Math.round(brlToAoa * 100) / 100,
        CNY: Math.round(cnyToAoa * 100) / 100,
        lastUpdate: new Date().toISOString(),
      }));
    } catch {
      // Keep existing or use fallback
      setCotacoes((prev) => ({
        ...FALLBACK,
        prevUSD: prev.USD,
        prevBRL: prev.BRL,
        prevCNY: prev.CNY,
        lastUpdate: new Date().toISOString(),
      }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCotacoes();
    const interval = setInterval(fetchCotacoes, 30 * 60 * 1000); // 30 min
    return () => clearInterval(interval);
  }, [fetchCotacoes]);

  const getVariacao = (current: number, prev?: number) => {
    if (!prev || prev === 0) return null;
    const pct = ((current - prev) / prev) * 100;
    if (Math.abs(pct) < 0.01) return null;
    return { pct: Math.abs(pct).toFixed(2), subiu: pct > 0 };
  };

  const lastUpdateFormatted = (() => {
    try {
      return new Date(cotacoes.lastUpdate).toLocaleTimeString("pt-AO", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Luanda",
      });
    } catch {
      return "--:--";
    }
  })();

  const convertido = (() => {
    const val = parseFloat(conversorValor.replace(",", "."));
    if (isNaN(val) || val <= 0) return null;
    return val * cotacoes[conversorMoeda];
  })();

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card/80 px-4 py-2 text-xs">
      {/* Cotações */}
      {MOEDAS_DISPLAY.map((m) => {
        const taxa = cotacoes[m.code];
        const prev = cotacoes[`prev${m.code}` as keyof CotacaoData] as number | undefined;
        const variacao = getVariacao(taxa, prev);

        return (
          <div key={m.code} className="flex items-center gap-1.5">
            <span>{m.flag}</span>
            <span className="font-medium text-foreground">{m.label}</span>
            <span className="text-text2">→</span>
            <span className="font-semibold text-foreground">
              {formatKz(taxa)}
            </span>
            {variacao && (
              <span className={variacao.subiu ? "text-destructive" : "text-green-custom"}>
                {variacao.subiu ? "▲" : "▼"} {variacao.pct}%
              </span>
            )}
          </div>
        );
      })}

      {/* Hora */}
      <span className="text-text3">UTC+1 {lastUpdateFormatted}</span>

      {/* Conversor inline */}
      <div className="flex items-center gap-1.5 ml-auto">
        <input
          type="text"
          value={conversorValor}
          onChange={(e) => setConversorValor(e.target.value)}
          placeholder="0,00"
          className="w-20 rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <select
          value={conversorMoeda}
          onChange={(e) => setConversorMoeda(e.target.value as "USD" | "BRL" | "CNY")}
          className="rounded border border-border bg-background px-1 py-1 text-xs text-foreground focus:outline-none"
        >
          <option value="USD">USD</option>
          <option value="BRL">BRL</option>
          <option value="CNY">CNY</option>
        </select>
        <span className="text-text3">→</span>
        <span className="font-semibold text-primary min-w-[80px]">
          {convertido !== null ? formatKz(convertido) : "Kz 0,00"}
        </span>
      </div>

      {/* Actualizar */}
      <button
        onClick={fetchCotacoes}
        disabled={loading}
        className="rounded p-1 text-text3 hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
        title="Actualizar cotações"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
