import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import angolaBg from "@/assets/angola-bg.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      const success = login(email, senha);
      if (success) {
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      } else {
        toast.error("E-mail ou senha inválidos");
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-4xl text-primary">✦</span>
            <h1 className="font-display text-3xl font-bold text-primary">BeautyCRM</h1>
          </div>
          <p className="text-sm uppercase tracking-[0.2em] text-text3">Gestão de Beleza</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg" style={{ boxShadow: '0 4px 24px hsl(var(--shadow) / 0.1)' }}>
          <h2 className="font-display text-xl font-semibold text-foreground text-center mb-6">
            Entrar no Sistema
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text2">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-text3 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-text2">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-input px-4 py-3 pr-10 text-sm text-foreground placeholder:text-text3 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text3 hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg gold-gradient px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-text3 text-center mb-3">Usuários para teste:</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between px-2 py-1.5 rounded bg-surface2">
                <span className="text-text2">Admin:</span>
                <span className="text-foreground font-mono">elise@studio.ao / admin123</span>
              </div>
              <div className="flex justify-between px-2 py-1.5 rounded bg-surface2">
                <span className="text-text2">Financeiro:</span>
                <span className="text-foreground font-mono">carlos@studio.ao / fin123</span>
              </div>
              <div className="flex justify-between px-2 py-1.5 rounded bg-surface2">
                <span className="text-text2">Colaborador:</span>
                <span className="text-foreground font-mono">rodrigo@studio.ao / colab123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
