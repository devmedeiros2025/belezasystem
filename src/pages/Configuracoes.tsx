import { useState, useEffect } from "react";
import { Building2, Palette, Bell, Link as LinkIcon, Users, Globe, Sun, Moon, Shield } from "lucide-react";
import { useCurrency, moedas } from "@/hooks/useCurrency";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const tabs = [
  { id: "negocio", label: "Meu Negócio", icon: Building2 },
  { id: "aparencia", label: "Aparência / Regional", icon: Palette },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "integracoes", label: "Integrações", icon: LinkIcon },
  { id: "permissoes", label: "Permissões", icon: Shield },
] as const;

const integracoes = [
  { nome: "WhatsApp Business", status: "Conectado", emoji: "💬" },
  { nome: "Instagram", status: "Conectado", emoji: "📸" },
  { nome: "Google Agenda", status: "Não conectado", emoji: "📅" },
  { nome: "PIX Automático", status: "Conectado", emoji: "💰" },
];

type Recurso = {
  key: string;
  label: string;
  desc: string;
};

const recursosDisponiveis: Recurso[] = [
  { key: "dashboard_completo", label: "Dashboard Completo", desc: "Acesso a todos os KPIs e gráficos" },
  { key: "agenda_ver", label: "Ver Agenda", desc: "Visualizar todos os agendamentos" },
  { key: "agenda_editar_todos", label: "Editar Agenda", desc: "Criar/editar agendamentos de todos" },
  { key: "clientes_ver", label: "Ver Clientes", desc: "Visualizar lista e perfil de clientes" },
  { key: "clientes_editar", label: "Editar Clientes", desc: "Criar, editar e remover clientes" },
  { key: "financeiro_completo", label: "Financeiro", desc: "Acesso completo ao módulo financeiro" },
  { key: "comissoes", label: "Comissões", desc: "Ver e gerir comissões de profissionais" },
  { key: "estoque", label: "Ver Estoque", desc: "Visualizar produtos em estoque" },
  { key: "estoque_editar", label: "Editar Estoque", desc: "Adicionar/remover itens de estoque" },
  { key: "fidelidade", label: "Fidelidade", desc: "Gerir programas de fidelidade" },
  { key: "avaliacoes", label: "Avaliações", desc: "Ver avaliações dos clientes" },
  { key: "configuracoes", label: "Configurações", desc: "Acesso ao painel de configurações" },
];

const perfisEditaveis = [
  { role: "colaborador" as const, label: "Colaborador" },
  { role: "financeiro" as const, label: "Financeiro" },
];

const permissoesPadrao: Record<string, string[]> = {
  colaborador: ["agenda_ver", "clientes_ver", "clientes_editar", "estoque", "fidelidade", "avaliacoes"],
  financeiro: ["dashboard_completo", "agenda_ver", "clientes_ver", "financeiro_completo", "comissoes"],
};

export default function Configuracoes() {
  const [tab, setTab] = useState<string>("negocio");
  const { moeda, formato, setMoeda, setFormato } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const { podeAcessar } = useAuth();

  // Permission management state
  const [permissoesCustom, setPermissoesCustom] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem("beautycrm-permissoes");
    return saved ? JSON.parse(saved) : permissoesPadrao;
  });
  const [perfilSelecionado, setPerfilSelecionado] = useState<string>("colaborador");

  useEffect(() => {
    localStorage.setItem("beautycrm-permissoes", JSON.stringify(permissoesCustom));
  }, [permissoesCustom]);

  const togglePermissao = (recurso: string) => {
    setPermissoesCustom((prev) => {
      const current = prev[perfilSelecionado] || [];
      const updated = current.includes(recurso)
        ? current.filter((r) => r !== recurso)
        : [...current, recurso];
      return { ...prev, [perfilSelecionado]: updated };
    });
  };

  const resetPermissoes = () => {
    setPermissoesCustom((prev) => ({
      ...prev,
      [perfilSelecionado]: permissoesPadrao[perfilSelecionado] || [],
    }));
    toast.success("Permissões restauradas ao padrão");
  };

  // Notifications state
  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    "Lembrete 24h antes": true,
    "Mensagem pós-atendimento": true,
    "Mensagem de aniversário": true,
    "Reativação de inativos (60 dias)": true,
    "Novo agendamento": true,
    "Cancelamento": true,
  });

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg ${
              tab === t.id
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Meu Negócio */}
      {tab === "negocio" && (
        <div className="max-w-2xl space-y-4">
          {[
            { label: "Nome do Negócio", value: "Studio Élise", type: "text" },
            { label: "Tipo", value: "Salão de Beleza", type: "text" },
            { label: "Endereço", value: "Rua das Flores, 123 — Luanda, Angola", type: "text" },
            { label: "Telefone", value: "+244 923 456 789", type: "text" },
            { label: "NIF", value: "5000123456", type: "text" },
          ].map((f) => (
            <div key={f.label}>
              <label className="mb-1.5 block text-sm text-muted-foreground">{f.label}</label>
              <input
                defaultValue={f.value}
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
              />
            </div>
          ))}
          <button className="rounded-lg gold-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground mt-2">
            Salvar Alterações
          </button>
        </div>
      )}

      {/* Aparência / Regional */}
      {tab === "aparencia" && (
        <div className="max-w-2xl space-y-8">
          {/* Theme Toggle */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              {theme === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
              Tema do Sistema
            </h4>
            <div className="flex gap-3">
              <button
                onClick={() => theme !== "light" && toggleTheme()}
                className={`flex flex-col items-center gap-3 rounded-xl border p-5 transition-colors min-w-[120px] ${
                  theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                  <Sun className="h-6 w-6 text-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">Claro</span>
              </button>
              <button
                onClick={() => theme !== "dark" && toggleTheme()}
                className={`flex flex-col items-center gap-3 rounded-xl border p-5 transition-colors min-w-[120px] ${
                  theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                  <Moon className="h-6 w-6 text-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">Escuro</span>
              </button>
            </div>
          </div>

          {/* Currency */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Moeda Principal do Sistema
            </h4>
            <div className="space-y-2">
              {moedas.map((m) => (
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
                  <span className="text-muted-foreground">—</span>
                  <span className="text-muted-foreground">{m.name}</span>
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
              {[
                { id: "pt" as const, label: "1.000,00", desc: "(padrão pt-BR / Angola)" },
                { id: "en" as const, label: "1,000.00", desc: "(padrão en-US)" },
              ].map((f) => (
                <label
                  key={f.id}
                  className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    formato === f.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="formato"
                    checked={formato === f.id}
                    onChange={() => setFormato(f.id)}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <span className="text-foreground">{f.label}</span>
                  <span className="text-muted-foreground">{f.desc}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notificações */}
      {tab === "notificacoes" && (
        <div className="max-w-2xl space-y-4">
          {Object.entries(notifs).map(([n, active]) => (
            <div key={n} className="flex items-center justify-between rounded-lg bg-card border border-border p-4">
              <span className="text-sm text-foreground">{n}</span>
              <Switch
                checked={active}
                onCheckedChange={(checked) => setNotifs((prev) => ({ ...prev, [n]: checked }))}
              />
            </div>
          ))}
        </div>
      )}

      {/* Integrações */}
      {tab === "integracoes" && (
        <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
          {integracoes.map((i) => (
            <div key={i.nome} className="rounded-xl border border-border bg-card p-5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{i.emoji}</span>
                <h4 className="text-sm font-medium text-foreground">{i.nome}</h4>
              </div>
              <span
                className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  i.status === "Conectado" ? "badge-active" : "badge-inactive"
                }`}
              >
                {i.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Permissões */}
      {tab === "permissoes" && (
        <div className="max-w-3xl space-y-6">
          <div>
            <h4 className="text-sm font-medium text-foreground mb-1">Gerir Permissões por Perfil</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Defina quais funcionalidades cada perfil de colaborador pode acessar.
            </p>

            {/* Profile selector */}
            <div className="flex gap-2 mb-6">
              {perfisEditaveis.map((p) => (
                <button
                  key={p.role}
                  onClick={() => setPerfilSelecionado(p.role)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    perfilSelecionado === p.role
                      ? "gold-gradient text-primary-foreground"
                      : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Permission grid */}
            <div className="space-y-2">
              {recursosDisponiveis.map((r) => {
                const isActive = (permissoesCustom[perfilSelecionado] || []).includes(r.key);
                return (
                  <div
                    key={r.key}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.label}</p>
                      <p className="text-xs text-muted-foreground">{r.desc}</p>
                    </div>
                    <Switch checked={isActive} onCheckedChange={() => togglePermissao(r.key)} />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={resetPermissoes}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Restaurar Padrão
              </button>
              <button
                onClick={() => toast.success("Permissões salvas com sucesso!")}
                className="rounded-lg gold-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Salvar Permissões
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
