import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, AlertTriangle, Sparkles, CheckCircle, Shield, Wrench } from "lucide-react";
import { formatDateAO } from "@/lib/currency";

interface ChangelogItem {
  id: string;
  tipo: string;
  descricao: string;
  modulo_afetado: string | null;
}

interface ChangelogEntry {
  id: string;
  versao: string;
  titulo: string;
  resumo: string | null;
  data_publicacao: string;
  itens: ChangelogItem[];
}

const tipoBadge: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  "Nova funcionalidade": { label: "Nova funcionalidade", className: "bg-blue-500/15 text-blue-600", icon: Sparkles },
  "Melhoria": { label: "Melhoria", className: "bg-green-custom/15 text-green-custom", icon: CheckCircle },
  "Correcção": { label: "Correcção", className: "bg-primary/15 text-primary", icon: Wrench },
  "Segurança": { label: "Segurança", className: "bg-destructive/15 text-destructive", icon: Shield },
  "Alteração crítica": { label: "Alteração crítica", className: "bg-red-900/20 text-red-700", icon: AlertTriangle },
};

export default function ChangelogModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      setLoading(true);
      const { data: changelogs } = await supabase
        .from("changelog")
        .select("*")
        .eq("publicado", true)
        .order("data_publicacao", { ascending: false });

      if (changelogs && changelogs.length > 0) {
        const ids = changelogs.map((c) => c.id);
        const { data: itens } = await supabase
          .from("changelog_itens")
          .select("*")
          .in("changelog_id", ids);

        setEntries(
          changelogs.map((c) => ({
            id: c.id,
            versao: c.versao,
            titulo: c.titulo,
            resumo: c.resumo,
            data_publicacao: c.data_publicacao,
            itens: (itens || []).filter((i) => i.changelog_id === c.id),
          }))
        );
      } else {
        setEntries([]);
      }
      setLoading(false);
    };
    fetch();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-foreground">Novidades do Sistema</h2>
          <button onClick={onClose} className="text-text3 hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-text3 py-8">Nenhuma novidade publicada ainda.</p>
        ) : (
          <div className="space-y-8">
            {entries.map((entry) => (
              <div key={entry.id} className="border-l-2 border-primary/30 pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    v{entry.versao}
                  </span>
                  <span className="text-xs text-text3">{formatDateAO(entry.data_publicacao)}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{entry.titulo}</h3>
                {entry.resumo && <p className="text-sm text-text2 mb-3">{entry.resumo}</p>}
                <div className="space-y-2">
                  {entry.itens.map((item) => {
                    const badge = tipoBadge[item.tipo] || tipoBadge["Melhoria"];
                    const Icon = badge.icon;
                    return (
                      <div key={item.id} className="flex items-start gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}>
                          <Icon className="h-3 w-3" />
                          {badge.label}
                        </span>
                        <span className="text-sm text-foreground">{item.descricao}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
