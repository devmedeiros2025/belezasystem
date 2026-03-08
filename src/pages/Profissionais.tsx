import { profissionais } from "@/data/mockData";
import { Star, Calendar, Clock } from "lucide-react";

const statusStyle: Record<string, string> = {
  "Disponível": "badge-active",
  "Em atendimento": "badge-vip",
  "Folga": "badge-inactive",
};

const escala = [
  { prof: "Élise", seg: "09-18", ter: "09-18", qua: "09-18", qui: "Folga", sex: "09-18" },
  { prof: "Rodrigo", seg: "09-18", ter: "09-18", qua: "Folga", qui: "09-18", sex: "09-18" },
  { prof: "Camile", seg: "09-18", ter: "09-18", qua: "09-18", qui: "09-18", sex: "09-15" },
  { prof: "Patrícia", seg: "10-17", ter: "Folga", qua: "10-17", qui: "10-17", sex: "10-17" },
];

export default function Profissionais() {
  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {profissionais.map(p => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-5 card-hover">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{p.emoji}</span>
              <div>
                <h3 className="font-display text-base font-semibold text-foreground">{p.nome}</h3>
                <p className="text-xs text-text3">{p.cargo}</p>
              </div>
            </div>
            <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium mb-4 ${statusStyle[p.status]}`}>{p.status}</span>
            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div><p className="text-lg font-bold text-primary font-display">R$ {(p.receita / 1000).toFixed(1)}k</p><p className="text-[10px] text-text3">Receita</p></div>
              <div><p className="text-lg font-bold text-foreground font-display">{p.atendimentos}</p><p className="text-[10px] text-text3">Atend.</p></div>
              <div><p className="text-lg font-bold text-primary font-display flex items-center justify-center gap-0.5"><Star className="h-3 w-3" />{p.avaliacao}</p><p className="text-[10px] text-text3">Nota</p></div>
            </div>
            <div className="flex flex-wrap gap-1">
              {p.servicos.map(s => <span key={s} className="rounded-full bg-surface2 px-2 py-0.5 text-[10px] text-text2">{s}</span>)}
            </div>
          </div>
        ))}
      </div>

      {/* Comissões */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <div className="p-5 border-b border-border"><h3 className="font-display text-lg font-semibold text-foreground">Comissões</h3></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-xs text-text3"><th className="p-4 text-left">Profissional</th><th className="p-4 text-left">Atendimentos</th><th className="p-4 text-left">Receita</th><th className="p-4 text-left">% Comissão</th><th className="p-4 text-left">A Receber</th></tr></thead>
          <tbody>
            {profissionais.map(p => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-surface2/50">
                <td className="p-4 font-medium text-foreground">{p.nome}</td>
                <td className="p-4 text-text2">{p.atendimentos}</td>
                <td className="p-4 text-foreground">R$ {p.receita.toLocaleString()}</td>
                <td className="p-4 text-text2">40%</td>
                <td className="p-4 font-semibold text-green-custom">R$ {(p.receita * 0.4).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Escala */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <div className="p-5 border-b border-border"><h3 className="font-display text-lg font-semibold text-foreground">Escala Semanal</h3></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-xs text-text3"><th className="p-4 text-left">Profissional</th><th className="p-4">Seg</th><th className="p-4">Ter</th><th className="p-4">Qua</th><th className="p-4">Qui</th><th className="p-4">Sex</th></tr></thead>
          <tbody>
            {escala.map(e => (
              <tr key={e.prof} className="border-b border-border/50">
                <td className="p-4 font-medium text-foreground">{e.prof}</td>
                {[e.seg, e.ter, e.qua, e.qui, e.sex].map((d, i) => (
                  <td key={i} className="p-4 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${d === "Folga" ? "bg-rose-custom/20 text-rose-custom" : "bg-green-custom/10 text-green-custom"}`}>{d}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
