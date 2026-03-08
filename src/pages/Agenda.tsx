import { useState, useCallback, useMemo } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import { agendamentos as agendamentosInit, profissionais } from "@/data/mockData";
import { ChevronLeft, ChevronRight, X, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { startOfWeek, addDays, addWeeks, subWeeks, format, isToday } from "date-fns";
import { pt } from "date-fns/locale";

const diasAbrev: Record<string, string> = {
  "segunda-feira": "Seg",
  "terça-feira": "Ter",
  "quarta-feira": "Qua",
  "quinta-feira": "Qui",
  "sexta-feira": "Sex",
};

function getWeekDays(baseDate: Date) {
  const monday = startOfWeek(baseDate, { weekStartsOn: 1 });
  return Array.from({ length: 5 }, (_, i) => {
    const date = addDays(monday, i);
    const dayName = format(date, "EEEE", { locale: pt });
    return {
      nome: diasAbrev[dayName] || format(date, "EEE", { locale: pt }),
      num: date.getDate(),
      date,
      isToday: isToday(date),
    };
  });
}

function formatWeekRange(days: ReturnType<typeof getWeekDays>) {
  const first = days[0].date;
  const last = days[days.length - 1].date;
  const sameMonth = first.getMonth() === last.getMonth();
  if (sameMonth) {
    return `${first.getDate()} – ${format(last, "d MMM yyyy", { locale: pt })}`;
  }
  return `${format(first, "d MMM", { locale: pt })} – ${format(last, "d MMM yyyy", { locale: pt })}`;
}
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
  const [selected, setSelected] = useState<typeof agendamentosInit[0] | null>(null);
  const [items, setItems] = useState([...agendamentosInit]);
  const [dragId, setDragId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ dia: string; hora: string } | null>(null);
  const [weekBase, setWeekBase] = useState(new Date());

  const diasSemana = useMemo(() => getWeekDays(weekBase), [weekBase]);
  const weekLabel = useMemo(() => formatWeekRange(diasSemana), [diasSemana]);

  const goToPrevWeek = useCallback(() => setWeekBase(prev => subWeeks(prev, 1)), []);
  const goToNextWeek = useCallback(() => setWeekBase(prev => addWeeks(prev, 1)), []);
  const goToCurrentWeek = useCallback(() => setWeekBase(new Date()), []);

  const handleDragStart = useCallback((e: React.DragEvent, id: number) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    // Make drag image semi-transparent
    const el = e.currentTarget as HTMLElement;
    setTimeout(() => el.style.opacity = "0.4", 0);
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = "1";
    setDragId(null);
    setDropTarget(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dia: string, hora: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget({ dia, hora });
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dia: string, hora: string) => {
    e.preventDefault();
    setDropTarget(null);
    if (dragId === null) return;

    // Check if slot is occupied by another item
    const occupied = items.find(a => a.dia === dia && a.hora === hora && a.id !== dragId);
    if (occupied) {
      toast.error("Este horário já está ocupado!");
      setDragId(null);
      return;
    }

    setItems(prev => prev.map(item => {
      if (item.id === dragId) {
        const changed = item.dia !== dia || item.hora !== hora;
        if (changed) {
          toast.success(`${item.clienteNome} movido para ${dia} às ${hora}`);
        }
        return { ...item, dia, hora };
      }
      return item;
    }));
    setDragId(null);
  }, [dragId, items]);

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
          <button onClick={goToPrevWeek} className="rounded-lg p-2 text-text3 hover:bg-surface2 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={goToCurrentWeek} className="text-sm font-medium text-foreground hover:text-primary transition-colors min-w-[160px] text-center">
            {weekLabel}
          </button>
          <button onClick={goToNextWeek} className="rounded-lg p-2 text-text3 hover:bg-surface2 transition-colors"><ChevronRight className="h-4 w-4" /></button>
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
            {diasSemana.map((d, i) => {
              const isToday = i === 0;
              return (
                <div key={d.nome} className={`border-b border-l border-border px-3 py-3 text-center ${isToday ? "bg-primary/8" : ""}`}>
                  <span className={`block text-[11px] uppercase tracking-wider font-medium ${isToday ? "text-primary" : "text-text3"}`}>
                    {d.nome}
                  </span>
                  <span className={`mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold ${isToday ? "gold-gradient text-primary-foreground" : "text-foreground"}`}>
                    {d.num}
                  </span>
                </div>
              );
            })}

            {horarios.map((h) => (
              <>
                <div key={h} className="border-b border-border p-2 text-right text-xs text-text3 pr-3 pt-3">{h}</div>
                {diasSemana.map((d) => {
                  const ag = items.find(a => a.dia === d.nome && a.hora === h);
                  const isOver = dropTarget?.dia === d.nome && dropTarget?.hora === h;
                  const isDraggingThis = ag && dragId === ag.id;

                  return (
                    <div
                      key={`${d.nome}-${h}`}
                      className={`border-b border-l border-border p-1.5 min-h-[52px] relative transition-colors duration-150 ${
                        isOver && !ag ? "bg-primary/10 ring-2 ring-inset ring-primary/30 rounded-md" : ""
                      } ${isOver && ag && dragId !== ag.id ? "bg-destructive/10 ring-2 ring-inset ring-destructive/30 rounded-md" : ""}`}
                      onDragOver={(e) => handleDragOver(e, d.nome, h)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, d.nome, h)}
                    >
                      {h === "10:00" && d.nome === "Seg" && (
                        <div className="absolute left-0 right-0 top-1/2 border-t border-destructive/60 z-10">
                          <span className="absolute -top-2.5 left-1 text-[9px] text-destructive font-medium">Agora</span>
                        </div>
                      )}
                      {ag ? (
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, ag.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelected(ag)}
                          className={`w-full rounded-lg border-l-[3px] px-2 py-1.5 text-left text-xs transition-all hover:scale-[1.02] cursor-grab active:cursor-grabbing ${corMap[ag.cor]} ${isDraggingThis ? "opacity-40" : ""}`}
                        >
                          <div className="flex items-start gap-1">
                            <GripVertical className="h-3 w-3 mt-0.5 text-text3/50 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{ag.clienteNome}</p>
                              <p className="text-text3 truncate">{ag.servico}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={`h-full w-full rounded-lg border border-dashed transition-colors ${
                          isOver ? "border-primary/40" : "border-transparent hover:border-primary/20"
                        } cursor-pointer`} />
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
      <KanbanBoard />
    </div>
  );
}
