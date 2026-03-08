import { estoque } from "@/data/mockData";
import { AlertTriangle, Package, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/useCurrency";

const statusStyle: Record<string, string> = {
  Normal: "badge-active",
  Baixo: "bg-primary/12 text-primary border border-primary/20",
  "Crítico": "badge-risk",
};

export default function Estoque() {
  const { format } = useCurrency();
  const criticos = estoque.filter(e => e.status === "Crítico");
  const baixos = estoque.filter(e => e.status === "Baixo");
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(criticos.length > 0 || baixos.length > 0) && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-sm font-semibold text-destructive">{criticos.length + baixos.length} itens precisam de atenção</span>
          </div>
          <div className="space-y-1">
            {criticos.map(e => <p key={e.id} className="text-xs text-destructive/80">🔴 {e.produto} — estoque: {e.estoqueAtual} (mín: {e.minimo})</p>)}
            {baixos.map(e => <p key={e.id} className="text-xs text-primary">🟡 {e.produto} — estoque: {e.estoqueAtual} (mín: {e.minimo})</p>)}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">Produtos e Insumos</h3>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Entrada de Estoque
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-xs text-text3">
            <th className="p-4 text-left">Produto</th><th className="p-4 text-left hidden md:table-cell">Categoria</th><th className="p-4 text-left">Estoque</th><th className="p-4 text-left hidden md:table-cell">Mínimo</th><th className="p-4 text-left hidden lg:table-cell">Custo Unit.</th><th className="p-4 text-left hidden lg:table-cell">Fornecedor</th><th className="p-4 text-left">Status</th>
          </tr></thead>
          <tbody>
            {estoque.map(e => (
              <tr key={e.id} className="border-b border-border/50 hover:bg-surface2/50">
                <td className="p-4 font-medium text-foreground flex items-center gap-2"><Package className="h-4 w-4 text-text3" />{e.produto}</td>
                <td className="p-4 text-text2 hidden md:table-cell">{e.categoria}</td>
                <td className="p-4 text-foreground font-semibold">{e.estoqueAtual}</td>
                <td className="p-4 text-text3 hidden md:table-cell">{e.minimo}</td>
                <td className="p-4 text-text2 hidden lg:table-cell">{format(e.custoUnit)}</td>
                <td className="p-4 text-text2 hidden lg:table-cell">{e.fornecedor}</td>
                <td className="p-4"><span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyle[e.status]}`}>{e.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold text-foreground mb-5">Entrada de Estoque</h3>
            <div className="space-y-4">
              <div><label className="mb-1.5 block text-sm text-text2">Produto</label><select className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none">{estoque.map(e => <option key={e.id}>{e.produto}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1.5 block text-sm text-text2">Quantidade</label><input type="number" defaultValue={10} className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none" /></div>
                <div><label className="mb-1.5 block text-sm text-text2">Custo Unit.</label><input type="number" defaultValue={45} className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none" /></div>
              </div>
              <div><label className="mb-1.5 block text-sm text-text2">Fornecedor</label><input className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1.5 block text-sm text-text2">Validade</label><input type="date" className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none" /></div>
                <div><label className="mb-1.5 block text-sm text-text2">Nº Nota Fiscal</label><input className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:outline-none" /></div>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-border px-4 py-2.5 text-sm text-text2 hover:bg-surface2">Cancelar</button>
              <button onClick={() => { setShowModal(false); toast.success("Estoque atualizado! ✅"); }} className="rounded-lg gold-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
