import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook de protecção RBAC para o módulo Financeiro.
 * Redireciona silenciosamente para /dashboard se o utilizador
 * não tiver a permissão "financeiro_completo".
 */
export function useFinanceiroGuard(): boolean {
  const { podeAcessar, loading } = useAuth();
  const navigate = useNavigate();
  const temAcesso = podeAcessar("financeiro_completo");

  useEffect(() => {
    if (!loading && !temAcesso) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, temAcesso, navigate]);

  return temAcesso;
}
