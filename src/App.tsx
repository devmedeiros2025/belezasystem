import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
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
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/agenda" element={<Layout><Agenda /></Layout>} />
          <Route path="/clientes" element={<Layout><Clientes /></Layout>} />
          <Route path="/clientes/:id" element={<Layout><ClientePerfil /></Layout>} />
          <Route path="/mensagens" element={<Layout><Mensagens /></Layout>} />
          <Route path="/servicos" element={<Layout><Servicos /></Layout>} />
          <Route path="/profissionais" element={<Layout><Profissionais /></Layout>} />
          <Route path="/financeiro" element={<Layout><Financeiro /></Layout>} />
          <Route path="/estoque" element={<Layout><Estoque /></Layout>} />
          <Route path="/fidelidade" element={<Layout><Fidelidade /></Layout>} />
          <Route path="/avaliacoes" element={<Layout><Avaliacoes /></Layout>} />
          <Route path="/configuracoes" element={<Layout><Configuracoes /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
