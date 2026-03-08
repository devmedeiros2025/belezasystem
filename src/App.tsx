import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/hooks/useCurrency";
import { ClientesProvider } from "@/contexts/ClientesContext";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Agenda from "@/pages/Agenda";
import Clientes from "@/pages/Clientes";
import ClientePerfil from "@/pages/ClientePerfil";
import Mensagens from "@/pages/Mensagens";
import Servicos from "@/pages/Servicos";
import Profissionais from "@/pages/Profissionais";
import Financeiro from "@/pages/Financeiro";
import Estoque from "@/pages/Estoque";
import Fidelidade from "@/pages/Fidelidade";
import Avaliacoes from "@/pages/Avaliacoes";
import Configuracoes from "@/pages/Configuracoes";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrencyProvider>
        <ClientesProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<Login />} />
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ClientesProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
