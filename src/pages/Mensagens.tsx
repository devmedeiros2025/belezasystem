import { useState } from "react";
import { mensagens } from "@/data/mockData";
import { Search, Send } from "lucide-react";

const canais = ["Todos", "WhatsApp", "Instagram", "SMS"] as const;
const templates = [
  "Lembrete de agendamento amanhã às {horário}",
  "Obrigada pela visita! Avalie seu atendimento 🌟",
  "Seu agendamento foi confirmado ✅",
  "Estamos com promoção especial esta semana!",
];

export default function Mensagens() {
  const [selectedId, setSelectedId] = useState(mensagens[0].id);
  const [canal, setCanal] = useState<typeof canais[number]>("Todos");
  const [msg, setMsg] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const filtered = canal === "Todos" ? mensagens : mensagens.filter(m => m.canal === canal);
  const selected = mensagens.find(m => m.id === selectedId)!;

  return (
    <div className="flex h-[calc(100vh-140px)] rounded-xl border border-border bg-card overflow-hidden">
      {/* List */}
      <div className="w-full max-w-xs border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text3" />
            <input placeholder="Buscar..." className="w-full rounded-lg border border-border bg-surface2 pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-text3 focus:border-primary/50 focus:outline-none" />
          </div>
          <div className="flex gap-1">
            {canais.map(c => (
              <button key={c} onClick={() => setCanal(c)} className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${canal === c ? "bg-primary/20 text-primary" : "text-text3 hover:text-foreground"}`}>{c}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              className={`w-full flex items-center gap-3 p-3 text-left border-b border-border/50 transition-colors ${selectedId === m.id ? "bg-primary/5" : "hover:bg-surface2"}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gold-gradient text-xs font-bold text-primary-foreground">{m.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate">{m.nome}</span>
                  <span className="text-[10px] text-text3 shrink-0 ml-2">{m.hora}</span>
                </div>
                <p className="truncate text-xs text-text3 mt-0.5">{m.preview}</p>
              </div>
              {m.naoLido && <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full gold-gradient text-xs font-bold text-primary-foreground">{selected.avatar}</div>
            <div>
              <p className="text-sm font-medium text-foreground">{selected.nome}</p>
              <p className="text-[11px] text-text3">{selected.canal}</p>
            </div>
          </div>
          <button className="text-xs text-primary hover:underline">Ver Perfil</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {selected.mensagens.map(m => (
            <div key={m.id} className={`flex ${m.tipo === "enviada" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                m.tipo === "enviada"
                  ? "bg-primary/20 text-foreground rounded-br-md"
                  : "bg-surface2 text-foreground rounded-bl-md"
              }`}>
                {"auto" in m && m.auto && <span className="text-[10px] text-text3 block mb-1">🤖 Automático</span>}
                <p>{m.texto}</p>
                <p className="text-[10px] text-text3 mt-1 text-right">{m.hora}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-3">
          {showTemplates && (
            <div className="mb-3 flex flex-wrap gap-2">
              {templates.map((t, i) => (
                <button key={i} onClick={() => { setMsg(t); setShowTemplates(false); }} className="rounded-full border border-border bg-surface2 px-3 py-1.5 text-xs text-text2 hover:border-primary/40 hover:text-primary transition-colors">{t}</button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setShowTemplates(!showTemplates)} className="rounded-lg border border-border px-3 py-2 text-xs text-text3 hover:bg-surface2">Templates</button>
            <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Digite sua mensagem..." className="flex-1 rounded-lg border border-border bg-surface2 px-3 py-2 text-sm text-foreground placeholder:text-text3 focus:border-primary/50 focus:outline-none" />
            <button className="rounded-lg gold-gradient px-4 py-2 text-primary-foreground"><Send className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
