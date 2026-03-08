import { useState } from "react";
import { servicos, profissionais } from "@/data/mockData";
import { Clock, DollarSign, Edit, Plus } from "lucide-react";

const categorias = ["Cabelo", "Estética", "Unhas", "Barba", "Spa & Bem-estar"] as const;

export default function Servicos() {
  const [cat, setCat] = useState<typeof categorias[number]>("Cabelo");

  const filtered = servicos.filter(s => s.categoria === cat);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto">
          {categorias.map(c => (
            <button key={c} onClick={() => setCat(c)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${cat === c ? "bg-primary/20 text-primary" : "text-text3 hover:text-foreground hover:bg-surface2"}`}>{c}</button>
          ))}
        </div>
        <button className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Novo Serviço
        </button>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(s => (
          <div key={s.id} className="rounded-xl border border-border bg-card p-5 card-hover">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-display text-lg font-semibold text-foreground">{s.nome}</h3>
              <button className="rounded-lg p-1.5 text-text3 hover:bg-surface2 hover:text-foreground"><Edit className="h-4 w-4" /></button>
            </div>
            <div className="flex items-center gap-4 text-sm text-text2 mb-4">
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-text3" />{s.duracao} min</span>
              <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-text3" />R$ {s.preco}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {profissionais.slice(0, 3).map(p => (
                  <div key={p.id} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-surface2 text-xs">{p.emoji}</div>
                ))}
              </div>
              <div className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${s.ativo ? "badge-active" : "badge-inactive"}`}>
                {s.ativo ? "Ativo" : "Inativo"}
              </div>
            </div>
            <p className="mt-3 text-xs text-text3">{s.contagem} atendimentos</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-text3 col-span-full text-center py-10">Nenhum serviço nesta categoria</p>}
      </div>
    </div>
  );
}
