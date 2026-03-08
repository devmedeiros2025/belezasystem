import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, Users, MessageSquare, Scissors, UserCheck,
  DollarSign, Package, Star, Award, BarChart3, Settings, Bell, Search,
  Plus, ChevronDown, Menu, X, Shield, LogOut
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/agenda": "Agenda",
  "/clientes": "Clientes",
  "/mensagens": "Mensagens",
  "/servicos": "Serviços",
  "/profissionais": "Profissionais",
  "/estoque": "Estoque",
  "/financeiro": "Financeiro",
  "/fidelidade": "Fidelidade",
  "/avaliacoes": "Avaliações",
  "/configuracoes": "Configurações",
  "/admin": "Administração",
};

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  badge?: number;
  hidden?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuarioLogado, perfil, logout, podeAcessar } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);

  // Auto-detect desktop vs mobile on mount and resize
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    onResize(); // run on mount
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const currentPage = pageNames[location.pathname] || "BeautyCRM";

  const navSections: NavSection[] = [
    {
      label: "PRINCIPAL",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
        { icon: Calendar, label: "Agenda", path: "/agenda", badge: 3 },
        { icon: Users, label: "Clientes", path: "/clientes" },
        { icon: MessageSquare, label: "Mensagens", path: "/mensagens", badge: 7 },
      ],
    },
    {
      label: "OPERAÇÃO",
      items: [
        { icon: Scissors, label: "Serviços", path: "/servicos" },
        { icon: UserCheck, label: "Profissionais", path: "/profissionais" },
        { icon: Package, label: "Estoque", path: "/estoque", hidden: !podeAcessar("estoque") },
        { icon: DollarSign, label: "Financeiro", path: "/financeiro", hidden: !podeAcessar("financeiro_completo") },
      ],
    },
    {
      label: "CRESCIMENTO",
      items: [
        { icon: BarChart3, label: "Relatórios", path: "/financeiro", hidden: !podeAcessar("financeiro_completo") },
        { icon: Award, label: "Fidelidade", path: "/fidelidade" },
        { icon: Star, label: "Avaliações", path: "/avaliacoes" },
        { icon: Settings, label: "Configurações", path: "/configuracoes", hidden: !podeAcessar("configuracoes") },
      ],
    },
  ];

  // Add Admin section for admins
  if (podeAcessar("admin")) {
    navSections.push({
      label: "ADMINISTRAÇÃO",
      items: [
        { icon: Shield, label: "Painel Admin", path: "/admin" },
      ],
    });
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logout realizado com sucesso");
  };

  return (
    <div className="flex min-h-screen bg-background font-body">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/30 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen border-r border-border bg-sidebar transition-all duration-300 ${
          sidebarOpen
            ? "w-60 translate-x-0"
            : isMobile
              ? "w-60 -translate-x-full"
              : "w-16 translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-5">
            <span className="text-2xl text-primary">✦</span>
            {sidebarOpen && (
              <div>
                <h1 className="font-display text-lg font-semibold text-primary">BeautyCRM</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-text3">Gestão de Beleza</p>
              </div>
            )}
          </div>

          {/* Business Selector */}
          {sidebarOpen && (
            <div className="border-b border-border px-3 py-3">
              <button className="flex w-full items-center justify-between rounded-lg bg-surface2 px-3 py-2 text-sm text-foreground hover:bg-surface3">
                <span>Studio Élise</span>
                <ChevronDown className="h-4 w-4 text-text3" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2 py-3">
            {navSections.map((section) => {
              const visibleItems = section.items.filter(item => !item.hidden);
              if (visibleItems.length === 0) return null;
              
              return (
                <div key={section.label} className="mb-4">
                  {sidebarOpen && (
                    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-text3">
                      {section.label}
                    </p>
                  )}
                  {visibleItems.map((item) => {
                    const isActive = location.pathname === item.path || 
                      (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`group relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-text2 hover:bg-surface2 hover:text-foreground"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                        )}
                        <item.icon className="h-[18px] w-[18px] shrink-0" />
                        {sidebarOpen && <span>{item.label}</span>}
                        {sidebarOpen && item.badge && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-[11px] font-semibold text-primary">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* User card */}
          {sidebarOpen && usuarioLogado && (
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-3 rounded-lg bg-surface2 px-3 py-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full gold-gradient text-sm font-semibold text-primary-foreground">
                  {usuarioLogado.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{usuarioLogado.nome}</p>
                  <p className="text-[11px] text-text3">{perfil}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-1.5 text-text3 hover:bg-surface3 hover:text-foreground transition-colors"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex flex-1 flex-col transition-all duration-300 ${sidebarOpen ? "ml-60" : "ml-0 lg:ml-16"}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-border px-6 glass-blur">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-text2 hover:bg-surface2 hover:text-foreground"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h2 className="font-display text-lg font-semibold text-foreground">{currentPage}</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text3" />
              <input
                placeholder="Buscar..."
                className="h-9 w-[220px] rounded-lg border border-border bg-input pl-9 pr-3 text-sm text-foreground placeholder:text-text3 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <button className="relative rounded-lg p-2 text-text2 hover:bg-surface2 hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <button
              onClick={() => {
                setShowNewAppointment(true);
                toast.success("Modal de agendamento aberto!");
              }}
              className="hidden items-center gap-2 rounded-lg gold-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 sm:flex"
            >
              <Plus className="h-4 w-4" />
              Novo Agendamento
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* FAB */}
      <button
        onClick={() => {
          setShowNewAppointment(true);
          toast.success("Agendamento rápido!");
        }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full gold-gradient text-xl font-bold text-primary-foreground shadow-2xl shadow-primary/30 transition-transform hover:scale-110 sm:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* New Appointment Modal */}
      <AnimatePresence>
        {showNewAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
            onClick={() => setShowNewAppointment(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-xl font-semibold text-foreground mb-5">Novo Agendamento</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-text2">Cliente</label>
                  <input placeholder="Buscar cliente..." className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-text3 focus:border-primary/50 focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm text-text2">Serviço</label>
                    <select className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none">
                      <option>Coloração</option>
                      <option>Corte Feminino</option>
                      <option>Progressiva</option>
                      <option>Escova</option>
                      <option>Manicure</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-text2">Profissional</label>
                    <select className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none">
                      <option>Élise Monteiro</option>
                      <option>Rodrigo Alves</option>
                      <option>Camile Torres</option>
                      <option>Patrícia Nunes</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm text-text2">Data</label>
                    <input type="date" className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-text2">Horário</label>
                    <input type="time" className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-text2">Canal</label>
                  <div className="flex flex-wrap gap-2">
                    {["Walk-in", "WhatsApp", "Instagram", "Telefone", "App"].map((c) => (
                      <button key={c} className="rounded-full border border-border bg-surface2 px-3 py-1.5 text-xs text-text2 hover:border-primary/40 hover:text-primary transition-colors">{c}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-text2">Observações</label>
                  <textarea rows={2} className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-text3 focus:border-primary/50 focus:outline-none resize-none" placeholder="Notas adicionais..." />
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button onClick={() => setShowNewAppointment(false)} className="rounded-lg border border-border px-4 py-2.5 text-sm text-text2 hover:bg-surface2">Cancelar</button>
                <button onClick={() => { setShowNewAppointment(false); toast.success("Agendamento confirmado! ✨"); }} className="rounded-lg gold-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20">Confirmar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
