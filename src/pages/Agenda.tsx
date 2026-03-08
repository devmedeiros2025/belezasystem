import { useState } from "react";
import { agendamentos, profissionais } from "@/data/mockData";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";

const dias = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const horarios = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const views = ["Dia", "Semana", "Mês"] as const;

const corMap: Record<string, string> = {
  gold: "border-l-primary bg-primary/10",
  teal: "border-l-teal-custom bg-teal-custom/10",
  rose: "border-l-rose-custom bg-rose-custom/10",
  purple: "border-l-purple-custom bg-purple-custom/10",
};

const dotMap: Record<string, string> = {
  gold: "bg-primary",
  teal: "bg-teal-custom",
  rose: "bg-rose-custom",
  purple: "bg-purple-custom",
};

export default function Agenda() {
  const [view, setView] = useState<typeof views[number]>("Semana");
  const [selected, setSelected] = useState<typeof agendamentos[0] | null>(null);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {views.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                view === v ? "bg-primary/20 text-primary" : "text-text3 hover:text-foreground hover:bg-surface2"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-lg p-2 text-text3 hover:bg-surface2"><ChevronLeft className="h-4 w-4" /></button>
          <span className="text-sm font-medium text-foreground">3 – 7 Mar 2025</span>
          <button className="rounded-lg p-2 text-text3 hover:bg-surface2"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {profissionais.map((p) => (
          <div key={p.id} className="flex items-center gap-2 text-xs text-text2">
            <span className={`h-2.5 w-2.5 rounded-full ${dotMap[p.cor]}`} />
            {p.nome}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid" style={{ gridTemplateColumns: "70px repeat(5, 1fr)" }}>
            <div className="border-b border-border p-3" />
            {dias.map((d, i) => (
              <div key={d} className={`border-b border-l border-border p-3 text-center text-sm font-semibold ${i === 0 ? "text-primary bg-primary/5" : "text-text2"}`}>
                {d}
              </div>
            ))}

            {horarios.map((h) => (
              <>
                <div key={h} className="border-b border-border p-2 text-right text-xs text-text3 pr-3 pt-3">{h}</div>
                {dias.map((d) => {
                  const ag = agendamentos.find(a => a.dia === d && a.hora === h);
                  return (
                    <div key={`${d}-${h}`} className="border-b border-l border-border p-1.5 min-h-[52px] relative">
                      {h === "10:00" && d === "Seg" && (
                        <div className="absolute left-0 right-0 top-1/2 border-t border-destructive/60 z-10">
                          <span className="absolute -top-2.5 left-1 text-[9px] text-destructive font-medium">Agora</span>
                        </div>
                      )}
                      {ag ? (
                        <button
                          onClick={() => setSelected(ag)}
                          className={`w-full rounded-lg border-l-[3px] px-2 py-1.5 text-left text-xs transition-all hover:scale-[1.02] ${corMap[ag.cor]}`}
                        >
                          <p className="font-medium text-foreground">{ag.clienteNome}</p>
                          <p className="text-text3">{ag.servico}</p>
                        </button>
                      ) : (
                        <div className="h-full w-full rounded-lg border border-dashed border-transparent hover:border-primary/20 cursor-pointer transition-colors" />
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-card border-l border-border h-full p-6 overflow-y-auto animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-semibold text-foreground">Detalhes</h3>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-text3 hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full gold-gradient text-sm font-bold text-primary-foreground">
                {selected.clienteNome.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-foreground">{selected.clienteNome}</p>
                <p className="text-sm text-text3">{selected.servico}</p>
              </div>
            </div>
            <div className="space-y-4 mb-8">
              {[
                ["Profissional", selected.profissional],
                ["Dia", selected.dia],
                ["Horário", selected.hora],
                ["Duração", `${selected.duracao} min`],
                ["Status", selected.status],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-text3">{k}</span>
                  <span className={`font-medium ${v === "Pendente" ? "text-primary" : v === "Confirmado" ? "text-green-custom" : "text-foreground"}`}>{v}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { toast.success("Confirmado!"); setSelected(null); }} className="rounded-lg gold-gradient px-3 py-2.5 text-sm font-semibold text-primary-foreground">Confirmar</button>
              <button className="rounded-lg border border-border px-3 py-2.5 text-sm text-text2 hover:bg-surface2">Remarcar</button>
              <button className="rounded-lg border border-destructive/30 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10">Cancelar</button>
              <button className="rounded-lg bg-green-custom/20 px-3 py-2.5 text-sm font-medium text-green-custom hover:bg-green-custom/30">Checkout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
