import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Perfil } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedProfiles?: Perfil[];
}

export default function ProtectedRoute({ children, allowedProfiles }: ProtectedRouteProps) {
  const { usuarioLogado, perfil, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-text3">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!usuarioLogado) {
    return <Navigate to="/login" replace />;
  }

  if (allowedProfiles && perfil && !allowedProfiles.includes(perfil)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
