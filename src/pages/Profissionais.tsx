import { useState } from "react";
import { profissionais as profInit } from "@/data/mockData";
import KanbanBoard from "@/components/KanbanBoard";
import { Star, Plus, X, Trash2, Edit } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";

const statusStyle: Record<string, string> = {
  "Disponível": "badge-active",
  "Em atendimento": "badge-vip",
  "Folga": "badge-inactive",
};

const habilidadesOpcoes = [
  "Coloração", "Progressiva", "Hidratação", "Corte Masculino", "Corte Feminino",
  "Escova", "Manicure + Pedicure", "Nail Art", "Limpeza de Pele", "Hidratação Facial",
  "Massagem", "Design de Sobrancelha", "Depilação", "Maquiagem", "Penteado",
  "Barba", "Botox Capilar", "Cauterização",
];

const emojis = ["💆", "✂️", "💅", "🌿", "💇", "🧖", "💄", "🪒"];

interface Prof {
  id: number;
  nome: string;
  cargo: string;
  emoji: string;
  receita: number;
  atendimentos: number;
  avaliacao: number;
  servicos: string[];
  status: "Disponível" | "Em atendimento" | "Folga";
  cor: string;
}

const escala = [
  { prof: "Élise", seg: "09-18", ter: "09-18", qua: "09-18", qui: "Folga", sex: "09-18" },
  { prof: "Rodrigo", seg: "09-18", ter: "09-18", qua: "Folga", qui: "09-18", sex: "09-18" },
  { prof: "Camile", seg: "09-18", ter: "09-18", qua: "09-18", qui: "09-18", sex: "09-15" },
  { prof: "Patrícia", seg: "10-17", ter: "Folga", qua: "10-17", qui: "10-17", sex: "10-17" },
];

export default function Profissionais() {
  const { format } = useCurrency();
  const { toast } = useToast();
  const [profList, setProfList] = useState<Prof[]>(profInit);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const emptyForm = { nome: "", cargo: "", emoji: "💆", servicos: [] as string[], status: "Disponível" as "Disponível" | "Em atendimento" | "Folga" };
  const [form, setForm] = useState(emptyForm);

  const openNew = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p: Prof) => {
    setEditId(p.id);
    setForm({ nome: p.nome, cargo: p.cargo, emoji: p.emoji, servicos: [...p.servicos], status: p.status });
    setShowModal(true);
  };

  const toggleHab = (h: string) => {
    setForm(f => ({ ...f, servicos: f.servicos.includes(h) ? f.servicos.filter(s => s !== h) : [...f.servicos, h] }));
  };

  const save = () => {
    if (!form.nome.trim() || !form.cargo.trim()) return;
    if (editId) {
      setProfList(prev => prev.map(p => p.id === editId ? { ...p, ...form } : p));
      toast({ title: "Profissional atualizado" });
    } else {
      const novo: Prof = { id: Date.now(), ...form, receita: 0, atendimentos: 0, avaliacao: 0, cor: "gold" };
      setProfList(prev => [...prev, novo]);
      toast({ title: "Profissional adicionado" });
    }
    setShowModal(false);
  };

  const remove = (id: number) => {
    setProfList(prev => prev.filter(p => p.id !== id));
    toast({ title: "Profissional removido" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-foreground">Equipe</h2>
        <button onClick={openNew} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Novo Profissional
        </button>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {profList.map(p => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-5 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{p.emoji}</span>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">{p.nome}</h3>
                  <p className="text-xs text-text3">{p.cargo}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-text3 hover:bg-surface2 hover:text-foreground"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(p.id)} className="rounded-lg p-1.5 text-text3 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium mb-4 ${statusStyle[p.status]}`}>{p.status}</span>
            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div><p className="text-lg font-bold text-primary font-display">{format(p.receita)}</p><p className="text-[10px] text-text3">Receita</p></div>
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
            {profList.map(p => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-surface2/50">
                <td className="p-4 font-medium text-foreground">{p.nome}</td>
                <td className="p-4 text-text2">{p.atendimentos}</td>
                <td className="p-4 text-foreground">{format(p.receita)}</td>
                <td className="p-4 text-text2">40%</td>
                <td className="p-4 font-semibold text-green-custom">{format(p.receita * 0.4)}</td>
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
                    <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${d === "Folga" ? "bg-rose-custom/12 text-rose-custom" : "bg-green-custom/10 text-green-custom"}`}>{d}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <KanbanBoard />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">{editId ? "Editar Profissional" : "Novo Profissional"}</h2>
              <button onClick={() => setShowModal(false)} className="text-text3 hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text3 mb-1 block">Nome *</label>
                <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-text3 mb-1 block">Cargo / Especialidade *</label>
                <input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} placeholder="Ex: Colorista Sênior, Barbeiro" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-text3 mb-1 block">Emoji / Avatar</label>
                <div className="flex gap-2 flex-wrap">
                  {emojis.map(e => (
                    <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))} className={`text-2xl p-1.5 rounded-lg ${form.emoji === e ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-surface2"}`}>{e}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-text3 mb-1 block">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                  <option value="Disponível">Disponível</option>
                  <option value="Em atendimento">Em atendimento</option>
                  <option value="Folga">Folga</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-text3 mb-2 block">Habilidades / Serviços</label>
                <div className="flex flex-wrap gap-2">
                  {habilidadesOpcoes.map(h => (
                    <button key={h} onClick={() => toggleHab(h)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${form.servicos.includes(h) ? "bg-primary/20 text-primary ring-1 ring-primary/30" : "bg-surface2 text-text3 hover:text-foreground"}`}>{h}</button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={save} className="w-full rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">{editId ? "Salvar Alterações" : "Adicionar Profissional"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
