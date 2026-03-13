import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/hooks/useCurrency";
import { ClientesProvider } from "@/contexts/ClientesContext";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages — each becomes a separate chunk
const Login = lazy(() => import("@/pages/Login"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Agenda = lazy(() => import("@/pages/Agenda"));
const Clientes = lazy(() => import("@/pages/Clientes"));
const ClientePerfil = lazy(() => import("@/pages/ClientePerfil"));
const Mensagens = lazy(() => import("@/pages/Mensagens"));
const Servicos = lazy(() => import("@/pages/Servicos"));
const Profissionais = lazy(() => import("@/pages/Profissionais"));
const Financeiro = lazy(() => import("@/pages/Financeiro"));
const Estoque = lazy(() => import("@/pages/Estoque"));
const Fidelidade = lazy(() => import("@/pages/Fidelidade"));
const Avaliacoes = lazy(() => import("@/pages/Avaliacoes"));
const Configuracoes = lazy(() => import("@/pages/Configuracoes"));
const Admin = lazy(() => import("@/pages/Admin"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const SuperAdmin = lazy(() => import("@/pages/SuperAdmin"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min — avoid refetching fresh data
      gcTime: 10 * 60 * 1000,     // 10 min — keep cache longer
      refetchOnWindowFocus: false, // prevent refetch on tab switch
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20 min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrencyProvider>
        <ClientesProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                  <Route path="/agenda" element={<ProtectedRoute><Layout><Agenda /></Layout></ProtectedRoute>} />
                  <Route path="/clientes" element={<ProtectedRoute><Layout><Clientes /></Layout></ProtectedRoute>} />
                  <Route path="/clientes/:id" element={<ProtectedRoute><Layout><ClientePerfil /></Layout></ProtectedRoute>} />
                  <Route path="/mensagens" element={<ProtectedRoute><Layout><Mensagens /></Layout></ProtectedRoute>} />
                  <Route path="/servicos" element={<ProtectedRoute><Layout><Servicos /></Layout></ProtectedRoute>} />
                  <Route path="/profissionais" element={<ProtectedRoute><Layout><Profissionais /></Layout></ProtectedRoute>} />
                  <Route path="/financeiro" element={<ProtectedRoute><Layout><Financeiro /></Layout></ProtectedRoute>} />
                  <Route path="/estoque" element={<ProtectedRoute><Layout><Estoque /></Layout></ProtectedRoute>} />
                  <Route path="/fidelidade" element={<ProtectedRoute><Layout><Fidelidade /></Layout></ProtectedRoute>} />
                  <Route path="/avaliacoes" element={<ProtectedRoute><Layout><Avaliacoes /></Layout></ProtectedRoute>} />
                  <Route path="/configuracoes" element={<ProtectedRoute allowedProfiles={["Administrador"]}><Layout><Configuracoes /></Layout></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute allowedProfiles={["Administrador"]}><Layout><Admin /></Layout></ProtectedRoute>} />
                  <Route path="/superadmin" element={<ProtectedRoute allowedProfiles={["SuperAdmin"]}><SuperAdmin /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </ClientesProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
