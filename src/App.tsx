import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AdminShell } from "./components/AdminShell";
import { Carregando } from "./components/Estados";
import { ToastProvider } from "./components/Toast";
import { EventoProvider } from "./context/EventoContext";
import { AuthProvider, useAuth } from "./data/auth";
import Dashboard from "./pages/Dashboard";
import EventoForm from "./pages/EventoForm";
import Eventos from "./pages/Eventos";
import Login from "./pages/Login";
import Mapa from "./pages/Mapa";
import Reservas from "./pages/Reservas";

/** Só entra quem está logado E tem acesso liberado (documento users/{uid} ativo). */
function AreaProtegida() {
  const { carregando, user, perfil } = useAuth();
  const local = useLocation();
  if (carregando)
    return (
      <div className="tela-cheia">
        <Carregando texto="Verificando seu acesso..." />
      </div>
    );
  if (!user || !perfil) return <Navigate to="/login" replace state={{ de: local.pathname }} />;
  return (
    <EventoProvider>
      <AdminShell />
    </EventoProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AreaProtegida />}>
              <Route index element={<Dashboard />} />
              <Route path="eventos" element={<Eventos />} />
              <Route path="eventos/novo" element={<EventoForm />} />
              <Route path="eventos/:id/editar" element={<EventoForm />} />
              <Route path="mapa" element={<Mapa />} />
              <Route path="reservas" element={<Reservas />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
