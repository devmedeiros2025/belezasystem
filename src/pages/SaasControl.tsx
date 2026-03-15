import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield, Users, LogIn, LogOut, Activity, RefreshCw, Search,
  Calendar, Clock, Monitor, Trash2, ArrowLeft, Wifi, WifiOff,
  Filter
} from "lucide-react";
import { toast } from "sonner";

interface SessionLog {
  id: string;
  user_id: string;
  email: string | null;
  nome: string | null;
  evento: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface UserStatus {
  user_id: string;
  email: string;
  nome: string;
  ultimo_login: string;
  total_logins: number;
  online: boolean;
}

const tabs = [
  { id: "tempo-real", label: "Tempo Real", icon: Activity },
  { id: "historico", label: "Histórico", icon: Clock },
  { id: "usuarios", label: "Utilizadores", icon: Users },
] as const;

export default function SaasControl() {
  const { perfil, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>("tempo-real");
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEvento, setFiltroEvento] = useState<"todos" | "login" | "logout">("todos");

  // Redirect non-super_admin silently to 404
  useEffect(() => {
    if (!authLoading && perfil !== "SuperAdmin") {
      navigate("/404", { replace: true });
    }
  }, [authLoading, perfil, navigate]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (!error && data) {
      setSessions(data as SessionLog[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (perfil === "SuperAdmin") {
      fetchSessions();
    }
  }, [perfil, fetchSessions]);

  // Realtime subscription
  useEffect(() => {
    if (perfil !== "SuperAdmin") return;

    const channel = supabase
      .channel("saas-control-sessions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_sessions" },
        (payload) => {
          setSessions((prev) => [payload.new as SessionLog, ...prev].slice(0, 500));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [perfil]);

  if (authLoading || perfil !== "SuperAdmin") return null;

  // Derive user statuses
  const userStatusMap = new Map<string, UserStatus>();
  sessions.forEach((s) => {
    const existing = userStatusMap.get(s.user_id);
    if (!existing) {
      userStatusMap.set(s.user_id, {
        user_id: s.user_id,
        email: s.email || "—",
        nome: s.nome || "—",
        ultimo_login: s.evento === "login" ? s.created_at : "",
        total_logins: s.evento === "login" ? 1 : 0,
        online: s.evento === "login", // last event determines status
      });
    } else {
      if (s.evento === "login") existing.total_logins++;
    }
  });
  const userStatuses = Array.from(userStatusMap.values());
  const onlineCount = userStatuses.filter((u) => u.online).length;

  // Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    const matchSearch =
      !search ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.nome?.toLowerCase().includes(search.toLowerCase());
    const matchEvento = filtroEvento === "todos" || s.evento === filtroEvento;
    return matchSearch && matchEvento;
  });

  const filteredUsers = userStatuses.filter(
    (u) =>
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.nome.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("pt-AO", {
        day: "2-digit", month: "2-digit", year: "numeric",
      });
    } catch { return "—"; }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("pt-AO", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false, timeZone: "Africa/Luanda",
      });
    } catch { return "—"; }
  };

  const clearHistory = async () => {
    const { error } = await supabase.from("user_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      toast.error("Erro ao limpar histórico");
    } else {
      setSessions([]);
      toast.success("Histórico limpo");
    }
  };

  const getBrowserFromUA = (ua: string | null) => {
    if (!ua) return "Desconhecido";
    if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Edg")) return "Edge";
    return "Outro";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/superadmin")}
                className="rounded-lg p-2 text-text3 hover:text-foreground hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">SaaS Control</h1>
                <p className="text-xs text-text3">Monitorização de acessos e sessões</p>
              </div>
            </div>
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="h-4 w-4 text-green-custom" />
              <span className="text-xs text-text3">Online Agora</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{onlineCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs text-text3">Total Utilizadores</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{userStatuses.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <LogIn className="h-4 w-4 text-teal-custom" />
              <span className="text-xs text-text3">Logins Hoje</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {sessions.filter((s) => s.evento === "login" && formatDate(s.created_at) === formatDate(new Date().toISOString())).length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-amber-custom" />
              <span className="text-xs text-text3">Total Eventos</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg ${
                tab === t.id
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-text3 hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por e-mail ou nome..."
              className="w-full rounded-lg border border-border bg-input pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-text3 focus:border-primary/50 focus:outline-none"
            />
          </div>
          {tab !== "usuarios" && (
            <div className="flex items-center gap-1">
              <Filter className="h-4 w-4 text-text3" />
              {(["todos", "login", "logout"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroEvento(f)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    filtroEvento === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-text2 hover:bg-muted/80"
                  }`}
                >
                  {f === "todos" ? "Todos" : f === "login" ? "Entradas" : "Saídas"}
                </button>
              ))}
            </div>
          )}
          {tab === "historico" && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar histórico
            </button>
          )}
        </div>

        {/* Content */}
        {tab === "tempo-real" && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text2">Actividade em tempo real</h3>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                {filteredSessions.length === 0 ? (
                  <div className="p-8 text-center text-text3 text-sm">
                    Nenhuma actividade registada
                  </div>
                ) : (
                  filteredSessions.slice(0, 50).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-surface2/50 transition-colors"
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          s.evento === "login"
                            ? "bg-green-custom/10 text-green-custom"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {s.evento === "login" ? (
                          <LogIn className="h-4 w-4" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {s.nome || s.email || "Utilizador"}
                        </p>
                        <p className="text-xs text-text3 truncate">{s.email}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text3">
                        <span className="hidden sm:inline">
                          <Monitor className="inline h-3 w-3 mr-1" />
                          {getBrowserFromUA(s.user_agent)}
                        </span>
                        <span>
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {formatDate(s.created_at)}
                        </span>
                        <span>
                          <Clock className="inline h-3 w-3 mr-1" />
                          {formatTime(s.created_at)}
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          s.evento === "login"
                            ? "bg-green-custom/10 text-green-custom"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {s.evento === "login" ? "ENTRADA" : "SAÍDA"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "historico" && (
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-text3">
                  <th className="p-4 text-left">Evento</th>
                  <th className="p-4 text-left">Utilizador</th>
                  <th className="p-4 text-left">E-mail</th>
                  <th className="p-4 text-left">Navegador</th>
                  <th className="p-4 text-left">Data</th>
                  <th className="p-4 text-left">Hora</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-text3">
                      Nenhum registo encontrado
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((s) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-surface2/50">
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            s.evento === "login"
                              ? "bg-green-custom/10 text-green-custom"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {s.evento === "login" ? <LogIn className="h-3 w-3" /> : <LogOut className="h-3 w-3" />}
                          {s.evento === "login" ? "ENTRADA" : "SAÍDA"}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-foreground">{s.nome || "—"}</td>
                      <td className="p-4 text-text2">{s.email || "—"}</td>
                      <td className="p-4 text-text3">{getBrowserFromUA(s.user_agent)}</td>
                      <td className="p-4 text-text3">{formatDate(s.created_at)}</td>
                      <td className="p-4 text-text3">{formatTime(s.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "usuarios" && (
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-text3">
                  <th className="p-4 text-left">Estado</th>
                  <th className="p-4 text-left">Nome</th>
                  <th className="p-4 text-left">E-mail</th>
                  <th className="p-4 text-left">Último Login</th>
                  <th className="p-4 text-left">Total Logins</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-text3">
                      Nenhum utilizador encontrado
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.user_id} className="border-b border-border/50 hover:bg-surface2/50">
                      <td className="p-4">
                        <span className="flex items-center gap-1.5">
                          {u.online ? (
                            <Wifi className="h-3.5 w-3.5 text-green-custom" />
                          ) : (
                            <WifiOff className="h-3.5 w-3.5 text-text3" />
                          )}
                          <span
                            className={`text-[10px] font-semibold ${
                              u.online ? "text-green-custom" : "text-text3"
                            }`}
                          >
                            {u.online ? "ONLINE" : "OFFLINE"}
                          </span>
                        </span>
                      </td>
                      <td className="p-4 font-medium text-foreground">{u.nome}</td>
                      <td className="p-4 text-text2">{u.email}</td>
                      <td className="p-4 text-text3">
                        {u.ultimo_login
                          ? `${formatDate(u.ultimo_login)} ${formatTime(u.ultimo_login)}`
                          : "—"}
                      </td>
                      <td className="p-4 text-text3">{u.total_logins}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
