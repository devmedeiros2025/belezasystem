import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import angolaBg from "@/assets/angola-bg.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome } },
      });
      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        // Assign admin role to first user
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: "admin" as any });
        toast.success("Conta criada! Fazendo login...");
        const success = await login(email, senha);
        if (success) navigate("/dashboard");
      }
    } else {
      const success = await login(email, senha);
      if (success) {
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      } else {
        toast.error("E-mail ou senha inválidos");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${angolaBg})`, opacity: 0.15 }}
      />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-4xl text-primary">✦</span>
            <h1 className="font-display text-3xl font-bold text-primary">BeautyCRM</h1>
          </div>
          <p className="text-sm uppercase tracking-[0.2em] text-text3">Gestão de Beleza</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg" style={{ boxShadow: '0 4px 24px hsl(var(--shadow) / 0.1)' }}>
          <h2 className="font-display text-xl font-semibold text-foreground text-center mb-6">
            {isSignup ? "Criar Conta Admin" : "Entrar no Sistema"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text2">Nome completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-text3 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            )}
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
                  minLength={6}
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
              {loading ? (isSignup ? "Criando..." : "Entrando...") : (isSignup ? "Criar Conta" : "Entrar")}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-sm text-primary hover:underline"
            >
              {isSignup ? "Já tenho conta → Entrar" : "Primeiro acesso? Criar conta admin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
