import { useState } from "react";
import { Building2, Palette, Bell, Link as LinkIcon, Users, Globe, Sparkles } from "lucide-react";
import { useCurrency, moedas, MoedaCode, FormatoNumerico } from "@/hooks/useCurrency";
import ChangelogModal from "@/components/ChangelogModal";

const tabs = [
  { id: "negocio", label: "Meu Negócio", icon: Building2 },
  { id: "aparencia", label: "Aparência / Regional", icon: Palette },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "integracoes", label: "Integrações", icon: LinkIcon },
  { id: "usuarios", label: "Utilizadores", icon: Users },
] as const;

const integracoes = [
  { nome: "WhatsApp Business", status: "Conectado", emoji: "💬" },
  { nome: "Instagram", status: "Conectado", emoji: "📸" },
  { nome: "Google Agenda", status: "Não conectado", emoji: "📅" },
  { nome: "PIX Automático", status: "Conectado", emoji: "💰" },
];

const usuarios = [
  { nome: "Juliana Moraes", perfil: "Proprietário", email: "juliana@studio.com" },
  { nome: "Clara Mendes", perfil: "Gerente", email: "clara@studio.com" },
  { nome: "Ana Recepção", perfil: "Recepcionista", email: "ana@studio.com" },
  { nome: "Élise Monteiro", perfil: "Profissional", email: "elise@studio.com" },
];

export default function Configuracoes() {
  const [tab, setTab] = useState<string>("negocio");
  const { moeda, formato, setMoeda, setFormato } = useCurrency();
  const [changelogOpen, setChangelogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg ${
              tab === t.id ? "text-primary border-b-2 border-primary bg-primary/5" : "text-text3 hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === "negocio" && (
        <div className="max-w-2xl space-y-4">
          {[
            { label: "Nome do Negócio", value: "Studio Élise", type: "text" },
            { label: "Tipo", value: "Salão de Beleza", type: "text" },
            { label: "Endereço", value: "Rua das Flores, 123 — Luanda, Angola", type: "text" },
            { label: "Telefone", value: "+244 923 456 789", type: "text" },
            { label: "NIF", value: "5000123456", type: "text" },
          ].map(f => (
            <div key={f.label}>
              <label className="mb-1.5 block text-sm text-text2">{f.label}</label>
              <input defaultValue={f.value} className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
            </div>
          ))}
          <button className="rounded-lg gold-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground mt-2">Salvar Alterações</button>
        </div>
      )}

      {tab === "aparencia" && (
        <div className="max-w-2xl space-y-8">
          {/* Color Theme */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Cor de Destaque</h4>
            <div className="flex gap-3">
              {[
                { name: "Dourado", color: "bg-primary" },
                { name: "Rosé", color: "bg-rose-custom" },
                { name: "Teal", color: "bg-teal-custom" },
                { name: "Lavanda", color: "bg-purple-custom" },
              ].map(c => (
                <button key={c.name} className={`flex flex-col items-center gap-2 rounded-lg border border-border p-4 hover:border-primary/40 transition-colors ${c.name === "Dourado" ? "border-primary" : ""}`}>
                  <div className={`h-8 w-8 rounded-full ${c.color}`} />
                  <span className="text-xs text-text2">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Moeda Principal do Sistema
            </h4>
            <div className="space-y-2">
              {moedas.map(m => (
                <label
                  key={m.code}
                  className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    moeda === m.code ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="moeda"
                    checked={moeda === m.code}
                    onChange={() => setMoeda(m.code)}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <span className="font-semibold text-foreground">{m.symbol}</span>
                  <span className="text-text2">—</span>
                  <span className="text-text2">{m.name}</span>
                  {m.code === "KZ" && (
                    <span className="ml-auto text-xs text-primary font-medium">(padrão)</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Number Format */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Formato Numérico</h4>
            <div className="space-y-2">
              <label
                className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  formato === "pt" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <input
                  type="radio"
                  name="formato"
                  checked={formato === "pt"}
                  onChange={() => setFormato("pt")}
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                <span className="text-foreground">1.000,00</span>
                <span className="text-text3">(padrão pt-BR / Angola)</span>
              </label>
              <label
                className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  formato === "en" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <input
                  type="radio"
                  name="formato"
                  checked={formato === "en"}
                  onChange={() => setFormato("en")}
                  className="h-4 w-4 text-primary focus:ring-primary"
                />
                <span className="text-foreground">1,000.00</span>
                <span className="text-text3">(padrão en-US)</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {tab === "notificacoes" && (
        <div className="max-w-2xl space-y-4">
          {["Lembrete 24h antes", "Mensagem pós-atendimento", "Mensagem de aniversário", "Reativação de inativos (60 dias)", "Novo agendamento", "Cancelamento"].map(n => (
            <div key={n} className="flex items-center justify-between rounded-lg bg-surface2 p-4">
              <span className="text-sm text-foreground">{n}</span>
              <div className="h-6 w-11 rounded-full bg-green-custom/30 p-0.5 cursor-pointer"><div className="h-5 w-5 rounded-full bg-green-custom translate-x-5" /></div>
            </div>
          ))}
        </div>
      )}

      {tab === "integracoes" && (
        <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
          {integracoes.map(i => (
            <div key={i.nome} className="rounded-xl border border-border bg-card p-5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{i.emoji}</span>
                <h4 className="text-sm font-medium text-foreground">{i.nome}</h4>
              </div>
              <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${i.status === "Conectado" ? "badge-active" : "badge-inactive"}`}>{i.status}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "usuarios" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setChangelogOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Novidades do sistema
            </button>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-x-auto max-w-3xl">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-text3"><th className="p-4 text-left">Nome</th><th className="p-4 text-left">Email</th><th className="p-4 text-left">Perfil</th></tr></thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.email} className="border-b border-border/50 hover:bg-surface2/50">
                    <td className="p-4 font-medium text-foreground">{u.nome}</td>
                    <td className="p-4 text-text2">{u.email}</td>
                    <td className="p-4"><span className="rounded-full bg-surface2 px-2.5 py-1 text-[11px] text-text2">{u.perfil}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ChangelogModal open={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </div>
  );
}
