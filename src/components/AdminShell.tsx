import { CalendarDays, Grid3X3, LayoutDashboard, ListChecks, LogOut, type LucideIcon } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/cscsp-logo.png";
import { usePerfil, useAuth } from "../data/auth";
import { usandoEmulador } from "../lib/firebase";
import { iniciais } from "../lib/format";
import { podeVerReservas } from "../lib/permissoes";
import { ROTULO_PAPEL } from "../types";

interface Item {
  caminho: string;
  rotulo: string;
  icone: LucideIcon;
  visivel: boolean;
  ativoEm: (p: string) => boolean;
}

export function AdminShell() {
  const perfil = usePerfil();
  const { sair } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const itens: Item[] = [
    { caminho: "/", rotulo: "Visão geral", icone: LayoutDashboard, visivel: true, ativoEm: (p) => p === "/" },
    { caminho: "/eventos", rotulo: "Eventos", icone: CalendarDays, visivel: true, ativoEm: (p) => p.startsWith("/eventos") },
    { caminho: "/mapa", rotulo: "Mapa de assentos", icone: Grid3X3, visivel: true, ativoEm: (p) => p.startsWith("/mapa") },
    { caminho: "/reservas", rotulo: "Reservas", icone: ListChecks, visivel: podeVerReservas(perfil.papel), ativoEm: (p) => p.startsWith("/reservas") },
  ];
  const atual = itens.find((i) => i.ativoEm(pathname));

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src={logo} alt="CSCSP" />
          <div>
            <strong>Teatro CSCSP</strong>
            <span>Gestão de eventos</span>
          </div>
        </div>
        <nav aria-label="Navegação da gestão">
          {itens
            .filter((i) => i.visivel)
            .map((i) => (
              <button
                key={i.caminho}
                className={i.ativoEm(pathname) ? "active" : ""}
                aria-current={i.ativoEm(pathname) ? "page" : undefined}
                onClick={() => navigate(i.caminho)}
                title={i.rotulo}
              >
                <i.icone />
                {i.rotulo}
              </button>
            ))}
        </nav>
        <div className="admin-user">
          <div>{iniciais(perfil.nome)}</div>
          <span>
            <strong>{perfil.nome}</strong>
            <small>{ROTULO_PAPEL[perfil.papel]}</small>
          </span>
          <button className="sair" onClick={() => void sair()} aria-label="Sair" title="Sair">
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <span>Gestão do Teatro{atual ? ` · ${atual.rotulo}` : ""}</span>
          <div>
            {usandoEmulador && <span className="tag-emulador">MODO EMULADOR</span>}
            <button className="avatar" title={perfil.email} aria-label={`Conta de ${perfil.nome}`}>
              {iniciais(perfil.nome)}
            </button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
