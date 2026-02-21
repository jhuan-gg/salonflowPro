import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Clientes from "./pages/Clientes";
import Servicos from "./pages/Servicos";
import Atendentes from "./pages/Atendentes";
import Historico from "./pages/Historico";
import Materiais from "./pages/Materiais";
import Mais from "./pages/Mais";
import Receipt from "./pages/Receipt"; // <-- Adicione este import
import NotFound from "./pages/NotFound";
import { ReactNode } from "react";

const queryClient = new QueryClient();


function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* ROTAS PÚBLICAS (Acessíveis sem login) */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/comprovante/:id" element={<Receipt />} /> {/* <-- A mágica está aqui */}

              {/* ROTAS PROTEGIDAS (Exigem login) */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
              <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
              <Route path="/servicos" element={<ProtectedRoute><Servicos /></ProtectedRoute>} />
              <Route path="/atendentes" element={<ProtectedRoute><Atendentes /></ProtectedRoute>} />
              <Route path="/historico" element={<ProtectedRoute><Historico /></ProtectedRoute>} />
              <Route path="/materiais" element={<ProtectedRoute><Materiais /></ProtectedRoute>} />
              <Route path="/mais" element={<ProtectedRoute><Mais /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;