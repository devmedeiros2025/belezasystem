import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Perfil } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedProfiles?: Perfil[];
}

export default function ProtectedRoute({ children, allowedProfiles }: ProtectedRouteProps) {
  const { usuarioLogado, perfil } = useAuth();

  if (!usuarioLogado) {
    return <Navigate to="/login" replace />;
  }

  if (allowedProfiles && perfil && !allowedProfiles.includes(perfil)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
