import { useMemo, useState } from "react";
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileDown,
  Grid3X3,
  Image as ImageIcon,
  LayoutDashboard,
  ListChecks,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Minus,
  MoreHorizontal,
  Plus,
  QrCode,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import logo from "./assets/cscsp-logo.png";

type Screen =
  | "home"
  | "detail"
  | "login"
  | "map"
  | "confirmation"
  | "my-reservations"
  | "dashboard"
  | "admin-events"
  | "admin-event-form"
  | "editor"
  | "admin-reservations";

type SeatStatus = "available" | "occupied" | "preferred" | "team" | "blocked";

const EVENT_IMAGE =
  "https://images.unsplash.com/photo-1672866832881-a7c570dd545d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400";
const EVENT_IMAGE_2 =
  "https://images.unsplash.com/photo-1672866908355-6345a2019401?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400";
const EVENT_IMAGE_3 =
  "https://images.unsplash.com/photo-1632184671104-f1808ac46352?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400";

const events = [
  {
    title: "Apresentação de Fim de Ano",
    eyebrow: "Dança e música",
    date: "14 de dezembro",
    day: "14",
    month: "DEZ",
    time: "19h30",
    remaining: 42,
    image: EVENT_IMAGE,
  },
  {
    title: "Cantata de Natal",
    eyebrow: "Coro dos alunos",
    date: "18 de dezembro",
    day: "18",
    month: "DEZ",
    time: "20h",
    remaining: 18,
    image: EVENT_IMAGE_2,
  },
  {
    title: "Festa Junina CSCSP",
    eyebrow: "Celebração escolar",
    date: "21 de junho",
    day: "21",
    month: "JUN",
    time: "16h",
    remaining: 0,
    image: EVENT_IMAGE_3,
  },
];

const adminNav = [
  { screen: "dashboard" as Screen, label: "Visão geral", icon: LayoutDashboard },
  { screen: "admin-events" as Screen, label: "Eventos", icon: CalendarDays },
  { screen: "editor" as Screen, label: "Mapa de assentos", icon: Grid3X3 },
  { screen: "admin-reservations" as Screen, label: "Reservas", icon: ListChecks },
];

function seatStatus(row: number, col: number): SeatStatus {
  if ((row === 1 && col === 5) || (row === 7 && col === 14) || (row === 9 && col === 3))
    return "team";
  if (row === 0 && [0, 1, 18, 19].includes(col)) return "preferred";
  if ((row * 17 + col * 7) % 13 === 0 || (row === 4 && [8, 9, 10].includes(col))) return "occupied";
  return "available";
}

function Header({ screen, navigate }: { screen: Screen; navigate: (screen: Screen) => void }) {
  const [open, setOpen] = useState(false);
  const isAdmin = screen.startsWith("admin") || screen === "dashboard" || screen === "editor";
  if (isAdmin) return null;

  return (
    <header className="site-header">
      <div className="header-inner">
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="Ir para a página inicial"
        >
          <img src={logo} alt="Colégio Santa Catarina São Paulo" />
          <span className="brand-divider" />
          <span className="brand-theater">Teatro</span>
        </button>
        <nav className={`public-nav ${open ? "is-open" : ""}`} aria-label="Navegação principal">
          <button onClick={() => navigate("home")}>Eventos</button>
          <button onClick={() => navigate("my-reservations")}>Minhas reservas</button>
          <button className="admin-link" onClick={() => navigate("dashboard")}>
            <ShieldCheck size={17} /> Área da gestão
          </button>
        </nav>
        <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Abrir menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <img src={logo} alt="" />
        <p>Teatro do Colégio Santa Catarina · Mooca, São Paulo</p>
      </div>
      <div className="footer-links">
        <button>Política de Privacidade</button>
        <a href="mailto:privacidade@cscsp.com.br">privacidade@cscsp.com.br</a>
      </div>
    </footer>
  );
}

function Home({ navigate }: { navigate: (screen: Screen) => void }) {
  const [filter, setFilter] = useState("Todos os eventos");
  return (
    <>
      <main>
        <section className="hero">
          <div className="hero-glow" />
          <div className="hero-content">
            <span className="eyebrow light">
              <Sparkles size={15} /> Cultura que aproxima
            </span>
            <h1>
              Grandes momentos
              <br />
              começam no palco.
            </h1>
            <p>Reserve seu lugar nos eventos do Colégio Santa Catarina.</p>
            <button
              className="button button-gold"
              onClick={() => document.getElementById("eventos")?.scrollIntoView()}
            >
              Ver próximos eventos <ArrowRight size={18} />
            </button>
          </div>
          <div className="hero-image" aria-hidden="true">
            <img src={EVENT_IMAGE} alt="" />
          </div>
        </section>

        <section className="section events-section" id="eventos">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Agenda cultural</span>
              <h2>Próximos eventos</h2>
              <p>Escolha uma apresentação e garanta seu lugar.</p>
            </div>
            <label className="select-control">
              <CalendarDays size={18} />
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                aria-label="Filtrar por data"
              >
                <option>Todos os eventos</option>
                <option>Este mês</option>
                <option>Próximos 3 meses</option>
              </select>
              <ChevronDown size={16} />
            </label>
          </div>
          <div className="event-grid">
            {events.map((event, index) => (
              <article className="event-card" key={event.title}>
                <button
                  className="event-image"
                  onClick={() => navigate("detail")}
                  aria-label={`Ver ${event.title}`}
                >
                  <img src={event.image} alt={`Apresentação: ${event.title}`} />
                  {index === 1 && <span className="scarcity-badge">Últimos lugares</span>}
                </button>
                <div className="event-card-body">
                  <div className="date-tile">
                    <strong>{event.day}</strong>
                    <span>{event.month}</span>
                  </div>
                  <div className="event-info">
                    <span>{event.eyebrow}</span>
                    <h3>{event.title}</h3>
                    <p>
                      <Clock3 size={15} /> {event.date}, às {event.time}
                    </p>
                    <div className="availability">
                      <div>
                        <i style={{ width: `${Math.min(90, 100 - event.remaining / 2)}%` }} />
                      </div>
                      <strong>
                        {event.remaining === 0
                          ? "Evento esgotado"
                          : `${event.remaining} lugares restantes`}
                      </strong>
                    </div>
                    <button
                      className="button button-primary full"
                      disabled={event.remaining === 0}
                      onClick={() => navigate("detail")}
                    >
                      {event.remaining === 0 ? "Esgotado" : "Reservar"}
                      {event.remaining > 0 && <ArrowRight size={17} />}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="help-banner">
          <div className="help-icon">
            <Ticket />
          </div>
          <div>
            <strong>Precisa de ajuda com sua reserva?</strong>
            <p>Nossa equipe está disponível de segunda a sexta, das 8h às 17h.</p>
          </div>
          <button className="button button-ghost">Falar com a secretaria</button>
        </section>
      </main>
      <Footer />
    </>
  );
}

function EventDetail({ navigate }: { navigate: (screen: Screen) => void }) {
  return (
    <main className="detail-page">
      <div className="detail-hero">
        <img src={EVENT_IMAGE} alt="Alunos em apresentação no teatro" />
        <button className="back-float" onClick={() => navigate("home")}>
          <ArrowLeft size={18} /> Voltar
        </button>
      </div>
      <div className="detail-layout">
        <article className="detail-content">
          <span className="eyebrow">Dança e música</span>
          <h1>Apresentação de Fim de Ano</h1>
          <p className="detail-lead">
            Uma noite para celebrar o talento, a dedicação e as conquistas dos nossos alunos.
          </p>
          <div className="info-row">
            <div className="info-icon">
              <CalendarDays />
            </div>
            <div>
              <small>Data</small>
              <strong>Sábado, 14 de dezembro</strong>
            </div>
          </div>
          <div className="info-row">
            <div className="info-icon">
              <Clock3 />
            </div>
            <div>
              <small>Horário</small>
              <strong>
                19h30 <span>· Portões abrem às 18h45</span>
              </strong>
            </div>
          </div>
          <div className="info-row">
            <div className="info-icon">
              <MapPin />
            </div>
            <div>
              <small>Local</small>
              <strong>Teatro CSCSP — Rua da Mooca, 2671</strong>
            </div>
          </div>
          <hr />
          <h2>Sobre o evento</h2>
          <p>
            O espetáculo reúne turmas do Ensino Fundamental e Médio em uma celebração preparada com
            muito carinho. A apresentação terá duração aproximada de 1h40, sem intervalo.
          </p>
          <div className="rules-box">
            <ShieldCheck />
            <div>
              <strong>Orientações importantes</strong>
              <ul>
                <li>Apresente o QR code na entrada.</li>
                <li>Chegue com 30 minutos de antecedência.</li>
                <li>Assentos são numerados e pessoais.</li>
              </ul>
            </div>
          </div>
        </article>
        <aside className="booking-card">
          <span className="status-dot">
            <i /> Reservas abertas
          </span>
          <h3>Apresentação de Fim de Ano</h3>
          <p>
            <CalendarDays size={16} /> 14 de dezembro · 19h30
          </p>
          <div className="booking-remaining">
            <strong>42</strong>
            <span>
              lugares
              <br />
              restantes
            </span>
          </div>
          <div className="availability large">
            <div>
              <i style={{ width: "84%" }} />
            </div>
          </div>
          <button className="button button-primary full" onClick={() => navigate("login")}>
            Escolher assentos <ArrowRight size={18} />
          </button>
          <small>
            <LockKeyhole size={13} /> Reserva segura · limite de 4 assentos
          </small>
        </aside>
      </div>
    </main>
  );
}

function Login({ navigate }: { navigate: (screen: Screen) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [emailLink, setEmailLink] = useState(false);
  return (
    <main className="auth-page">
      <button className="auth-back" onClick={() => navigate("detail")}>
        <ArrowLeft size={18} /> Voltar ao evento
      </button>
      <section className="auth-card">
        <div className="auth-brand">
          <img src={logo} alt="Colégio Santa Catarina" />
          <span>Teatro</span>
        </div>
        <div className="auth-step">
          <span>1</span>
          <i />
          <span className="muted">2</span>
          <i />
          <span className="muted">3</span>
        </div>
        <p className="step-label">
          Identificação <span>·</span> Assentos <span>·</span> Confirmação
        </p>
        <h1>{mode === "login" ? "Que bom ter você aqui" : "Crie seu acesso"}</h1>
        <p>
          {mode === "login"
            ? "Entre para continuar sua reserva."
            : "Preencha seus dados para reservar seus lugares."}
        </p>
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Entrar
          </button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
            Criar conta
          </button>
        </div>
        {emailLink ? (
          <div className="magic-link-state">
            <div className="success-icon">
              <Mail />
            </div>
            <h3>Confira seu e-mail</h3>
            <p>Enviamos um link seguro para você entrar sem senha.</p>
            <button className="button button-outline full" onClick={() => setEmailLink(false)}>
              Usar senha
            </button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              navigate("map");
            }}
          >
            {mode === "signup" && (
              <>
                <label>
                  Nome completo
                  <input required placeholder="Como consta no cadastro escolar" />
                </label>
                <div className="form-grid">
                  <label>
                    R.A.
                    <input required placeholder="000000" />
                  </label>
                  <label>
                    Tipo de usuário
                    <select>
                      <option>Responsável</option>
                      <option>Aluno</option>
                    </select>
                  </label>
                </div>
              </>
            )}
            <label>
              E-mail
              <input type="email" required placeholder="seuemail@exemplo.com" />
            </label>
            {mode === "signup" && (
              <label>
                Telefone
                <input required placeholder="(11) 99999-9999" />
              </label>
            )}
            <label>
              Senha
              <div className="input-action">
                <input type="password" required placeholder="••••••••" />
                <Eye size={18} />
              </div>
            </label>
            {mode === "signup" && (
              <label className="checkbox-label">
                <input type="checkbox" required />
                <span>
                  Concordo com a <u>Política de Privacidade</u> e autorizo o uso dos dados para
                  identificação, reserva e comunicação sobre o evento.
                </span>
              </label>
            )}
            <button className="button button-primary full" type="submit">
              Continuar para os assentos <ArrowRight size={18} />
            </button>
            <button className="magic-button" type="button" onClick={() => setEmailLink(true)}>
              <Mail size={17} /> Entrar com link por e-mail
            </button>
          </form>
        )}
        <p className="privacy-note">
          <ShieldCheck size={15} /> Seus dados são protegidos conforme a LGPD.
        </p>
      </section>
    </main>
  );
}

function SeatMap({
  selected,
  setSelected,
  editor = false,
  onUnavailable,
}: {
  selected: string[];
  setSelected: (seats: string[]) => void;
  editor?: boolean;
  onUnavailable?: () => void;
}) {
  const [zoom, setZoom] = useState(editor ? 0.82 : 0.75);
  const rows = "ABCDEFGHIJKL".split("");
  const toggle = (id: string, status: SeatStatus) => {
    if (!editor && status === "occupied") {
      onUnavailable?.();
      return;
    }
    if (!editor && status !== "available" && status !== "preferred") return;
    if (selected.includes(id)) setSelected(selected.filter((seat) => seat !== id));
    else if (editor || selected.length < 4) setSelected([...selected, id]);
  };
  return (
    <div className={`map-shell ${editor ? "editor-map" : ""}`}>
      <div className="map-toolbar">
        <span>
          <Grid3X3 size={16} /> Plateia principal
        </span>
        <div>
          <button onClick={() => setZoom(Math.max(0.55, zoom - 0.1))} aria-label="Diminuir zoom">
            <ZoomOut />
          </button>
          <strong>{Math.round(zoom * 100)}%</strong>
          <button onClick={() => setZoom(Math.min(1.15, zoom + 0.1))} aria-label="Aumentar zoom">
            <ZoomIn />
          </button>
          <button onClick={() => setZoom(editor ? 0.82 : 0.75)} aria-label="Redefinir zoom">
            <RotateCcw />
          </button>
        </div>
      </div>
      <div className="map-viewport">
        <div className="seat-layout" style={{ transform: `scale(${zoom})` }}>
          <div className="stage">
            <span>PALCO</span>
            <small>Frente do teatro</small>
          </div>
          <div className="seat-section-label">PLATEIA</div>
          {rows.map((row, rowIndex) => (
            <div className="seat-row" key={row}>
              <strong>{row}</strong>
              <div className="seat-group">
                {Array.from({ length: 10 }, (_, index) => 20 - index * 2).map((number, index) => {
                  const id = `${row}${number}`;
                  const status = seatStatus(rowIndex, index);
                  return (
                    <Seat
                      key={id}
                      id={id}
                      number={number}
                      status={status}
                      selected={selected.includes(id)}
                      onClick={() => toggle(id, status)}
                      pcd={row === "A" && index < 2}
                    />
                  );
                })}
              </div>
              <div className="aisle">
                <span>CORREDOR</span>
              </div>
              <div className="seat-group">
                {Array.from({ length: 10 }, (_, index) => index * 2 + 1).map((number, index) => {
                  const id = `${row}${number}`;
                  const status = seatStatus(rowIndex, index + 10);
                  return (
                    <Seat
                      key={id}
                      id={id}
                      number={number}
                      status={status}
                      selected={selected.includes(id)}
                      onClick={() => toggle(id, status)}
                      pcd={row === "A" && index > 7}
                    />
                  );
                })}
              </div>
              <strong>{row}</strong>
            </div>
          ))}
          <div className="balcony">
            <span>BALCÃO</span>
            <div>
              {Array.from({ length: 12 }, (_, index) => (
                <button key={index} className="seat available">
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {!editor && (
        <p className="pan-hint">
          <Grid3X3 size={14} /> Arraste para navegar pelo mapa
        </p>
      )}
    </div>
  );
}

function Seat({
  id,
  number,
  status,
  selected,
  onClick,
  pcd,
}: {
  id: string;
  number: number;
  status: SeatStatus;
  selected: boolean;
  onClick: () => void;
  pcd?: boolean;
}) {
  const label = selected
    ? "selecionado"
    : status === "team"
      ? "reservado para equipe"
      : status === "preferred"
        ? "preferencial"
        : status === "occupied"
          ? "ocupado"
          : "disponível";
  return (
    <button
      className={`seat ${status} ${selected ? "selected" : ""} ${pcd ? "pcd" : ""}`}
      onClick={onClick}
      title={`${id}, ${label}`}
      aria-label={`Assento ${id}, ${label}`}
    >
      {pcd ? <Accessibility size={13} /> : status === "team" ? <X size={12} /> : number}
    </button>
  );
}

function Legend() {
  return (
    <div className="legend">
      <span>
        <i className="available" /> Disponível
      </span>
      <span>
        <i className="selected" /> Selecionado
      </span>
      <span>
        <i className="occupied" /> Ocupado
      </span>
      <span>
        <i className="preferred">P</i> Preferencial
      </span>
      <span>
        <i className="team">
          <X size={11} />
        </i>{" "}
        Equipe
      </span>
      <span>
        <i className="pcd">
          <Accessibility size={11} />
        </i>{" "}
        PcD
      </span>
    </div>
  );
}

function MapScreen({ navigate }: { navigate: (screen: Screen) => void }) {
  const [selected, setSelected] = useState<string[]>(["C8", "C10"]);
  const [error, setError] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const showConflict = () => {
    setError(true);
    window.setTimeout(() => setError(false), 3500);
  };
  const confirm = () => {
    setConfirming(true);
    window.setTimeout(() => navigate("confirmation"), 700);
  };
  return (
    <main className="seat-page">
      {error && (
        <div className="error-toast" role="alert">
          <X />
          <div>
            <strong>Este assento acabou de ser reservado</strong>
            <span>Escolha outro lugar disponível no mapa.</span>
          </div>
          <button onClick={() => setError(false)} aria-label="Fechar aviso">
            <X />
          </button>
        </div>
      )}
      <div className="seat-page-header">
        <button onClick={() => navigate("detail")}>
          <ArrowLeft />
        </button>
        <div>
          <span>Apresentação de Fim de Ano</span>
          <strong>Escolha seus assentos</strong>
        </div>
        <span className="timer">
          <Clock3 /> 09:42
        </span>
      </div>
      <div className="seat-page-title">
        <div>
          <span className="eyebrow">Etapa 2 de 3</span>
          <h1>Onde você quer sentar?</h1>
          <p>Selecione até 4 lugares. Os assentos escolhidos ficam reservados por 10 minutos.</p>
        </div>
        <Legend />
      </div>
      <SeatMap selected={selected} setSelected={setSelected} onUnavailable={showConflict} />
      <div className="selection-bar">
        <div>
          <span>
            Seus assentos <small>{selected.length}/4</small>
          </span>
          <div className="seat-chips">
            {selected.length ? (
              selected.map((seat) => (
                <button
                  key={seat}
                  onClick={() => setSelected(selected.filter((item) => item !== seat))}
                >
                  {seat}
                  <X size={13} />
                </button>
              ))
            ) : (
              <em>Nenhum assento selecionado</em>
            )}
          </div>
        </div>
        <div className="selection-total">
          <span>Total</span>
          <strong>Gratuito</strong>
        </div>
        <button
          className="button button-primary"
          disabled={!selected.length || confirming}
          onClick={confirm}
        >
          {confirming ? (
            <>
              <LoaderCircle className="spinner" /> Confirmando...
            </>
          ) : (
            <>
              Confirmar reserva <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </main>
  );
}

function FakeQr() {
  const cells = useMemo(
    () => Array.from({ length: 121 }, (_, i) => (i * 7 + i * i * 3) % 11 < 5),
    [],
  );
  return (
    <div className="qr" aria-label="QR code do ingresso">
      {cells.map((filled, i) => (
        <i key={i} className={filled ? "filled" : ""} />
      ))}
    </div>
  );
}

function Confirmation({ navigate }: { navigate: (screen: Screen) => void }) {
  const [cancelled, setCancelled] = useState(false);
  return (
    <main className="confirmation-page">
      <div className="confetti confetti-a" />
      <div className="confetti confetti-b" />
      <section className="confirmation-card">
        {cancelled ? (
          <div className="cancel-state">
            <div className="cancel-icon">
              <X />
            </div>
            <h1>Reserva cancelada</h1>
            <p>Os assentos C8 e C10 voltaram a ficar disponíveis.</p>
            <button className="button button-primary" onClick={() => navigate("home")}>
              Ver outros eventos
            </button>
          </div>
        ) : (
          <>
            <div className="success-icon large">
              <Check />
            </div>
            <span className="eyebrow">Reserva confirmada</span>
            <h1>Seus lugares estão garantidos!</h1>
            <p>
              Enviamos a confirmação e os ingressos para <strong>mariana.silva@email.com</strong>.
            </p>
            <div className="ticket-card">
              <div className="ticket-top">
                <div>
                  <span>14 DEZ · 19H30</span>
                  <h2>
                    Apresentação de
                    <br />
                    Fim de Ano
                  </h2>
                  <p>
                    <MapPin size={15} /> Teatro CSCSP · Mooca
                  </p>
                </div>
                <img src={logo} alt="CSCSP" />
              </div>
              <div className="ticket-bottom">
                <FakeQr />
                <div>
                  <small>CÓDIGO DA RESERVA</small>
                  <strong>CSC-24-8F2K</strong>
                  <span>Assentos</span>
                  <b>C8 e C10</b>
                </div>
              </div>
            </div>
            <div className="confirmation-actions">
              <button className="button button-primary">
                <CalendarDays size={18} /> Adicionar ao calendário
              </button>
              <button className="button button-outline" onClick={() => navigate("my-reservations")}>
                <Ticket size={18} /> Minhas reservas
              </button>
            </div>
            <button className="cancel-button" onClick={() => setCancelled(true)}>
              Cancelar reserva
            </button>
          </>
        )}
      </section>
    </main>
  );
}

function MyReservations({ navigate }: { navigate: (screen: Screen) => void }) {
  return (
    <main className="section reservations-page">
      <span className="eyebrow">Sua conta</span>
      <h1>Minhas reservas</h1>
      <p>Acompanhe seus próximos eventos e acesse seus ingressos.</p>
      <div className="reservation-tabs">
        <button className="active">
          Ativas <span>1</span>
        </button>
        <button>Passadas</button>
      </div>
      <article className="my-ticket">
        <img src={EVENT_IMAGE} alt="" />
        <div>
          <span className="status-dot">
            <i /> Confirmada
          </span>
          <h2>Apresentação de Fim de Ano</h2>
          <p>
            <CalendarDays size={16} /> 14 de dezembro · 19h30
          </p>
          <p>
            <MapPin size={16} /> Teatro CSCSP · Assentos C8 e C10
          </p>
        </div>
        <button className="button button-outline" onClick={() => navigate("confirmation")}>
          <QrCode size={18} /> Ver ingresso
        </button>
      </article>
    </main>
  );
}

function AdminShell({
  screen,
  navigate,
  children,
}: {
  screen: Screen;
  navigate: (screen: Screen) => void;
  children: React.ReactNode;
}) {
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
        <nav>
          {adminNav.map((item) => (
            <button
              key={item.label}
              className={screen === item.screen ? "active" : ""}
              onClick={() => navigate(item.screen)}
            >
              <item.icon />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="admin-user">
          <div>MR</div>
          <span>
            <strong>Mariana Rocha</strong>
            <small>Administradora</small>
          </span>
          <LogOut size={17} />
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <button className="mobile-admin-menu">
            <Menu />
          </button>
          <span>Gestão do Teatro</span>
          <div>
            <button className="view-site" onClick={() => navigate("home")}>
              <ExternalLink /> Ver site
            </button>
            <button className="avatar">MR</button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function Dashboard({ navigate }: { navigate: (screen: Screen) => void }) {
  return (
    <AdminPage
      title="Visão geral"
      subtitle="Acompanhe a ocupação do seu próximo evento."
      action={
        <button className="button button-primary" onClick={() => navigate("admin-event-form")}>
          <Plus /> Novo evento
        </button>
      }
    >
      <div className="event-selector">
        <div className="mini-date">
          <strong>14</strong>
          <span>DEZ</span>
        </div>
        <div>
          <small>EVENTO SELECIONADO</small>
          <strong>Apresentação de Fim de Ano</strong>
          <span>Sábado, 14 de dezembro · 19h30</span>
        </div>
        <button>
          Trocar evento <ChevronDown />
        </button>
      </div>
      <div className="stats-grid">
        <Stat icon={<Ticket />} label="Total de lugares" value="240" detail="Plateia + balcão" />
        <Stat icon={<Check />} label="Reservados" value="198" detail="+18 hoje" positive />
        <Stat icon={<Users />} label="Disponíveis" value="42" detail="17,5% restantes" />
        <Stat icon={<LockKeyhole />} label="Bloqueados" value="12" detail="Equipe e produção" />
      </div>
      <div className="dashboard-grid">
        <section className="admin-card occupation-card">
          <div className="card-heading">
            <div>
              <h3>Ocupação do evento</h3>
              <p>Atualizado agora</p>
            </div>
            <button>
              <MoreHorizontal />
            </button>
          </div>
          <div className="big-progress">
            <div>
              <strong>82,5%</strong>
              <span>ocupado</span>
            </div>
            <small>198 de 240 lugares</small>
            <div className="progress-track">
              <i />
            </div>
          </div>
          <div className="sector-bars">
            {[
              ["Plateia esquerda", "94%", 94],
              ["Plateia direita", "87%", 87],
              ["Balcão", "61%", 61],
            ].map(([name, value, width]) => (
              <div key={String(name)}>
                <span>
                  {name}
                  <strong>{value}</strong>
                </span>
                <div>
                  <i style={{ width: `${width}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="admin-card story-card">
          <div className="card-heading">
            <div>
              <h3>Divulgue o evento</h3>
              <p>Arte pronta para Instagram Stories</p>
            </div>
          </div>
          <div className="story-preview">
            <img src={EVENT_IMAGE} alt="" />
            <div className="story-overlay">
              <img src={logo} alt="" />
              <span>ÚLTIMOS LUGARES</span>
              <strong>
                Restam
                <br />
                <b>42</b> lugares!
              </strong>
              <small>14 DEZ · 19H30</small>
            </div>
          </div>
          <button className="button button-outline full">
            <ImageIcon /> Gerar imagem para stories
          </button>
          <small className="privacy-safe">
            <ShieldCheck /> Sem dados pessoais na imagem
          </small>
        </section>
      </div>
      <section className="admin-card quick-map">
        <div className="card-heading">
          <div>
            <h3>Mapa de ocupação</h3>
            <p>Visualização rápida por fileira</p>
          </div>
          <button className="text-button" onClick={() => navigate("editor")}>
            Abrir editor <ArrowRight />
          </button>
        </div>
        <div className="heatmap">
          {"ABCDEFGHIJKL".split("").map((row, ri) => (
            <div key={row}>
              <strong>{row}</strong>
              {Array.from({ length: 20 }, (_, i) => (
                <i key={i} className={seatStatus(ri, i)} />
              ))}
            </div>
          ))}
        </div>
      </section>
    </AdminPage>
  );
}

function Stat({
  icon,
  label,
  value,
  detail,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  positive?: boolean;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small className={positive ? "positive" : ""}>
          {positive && "↗ "}
          {detail}
        </small>
      </div>
    </div>
  );
}

function AdminPage({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="admin-content">
      <div className="admin-page-heading">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </main>
  );
}

function AdminEvents({ navigate }: { navigate: (screen: Screen) => void }) {
  return (
    <AdminPage
      title="Eventos"
      subtitle="Crie e gerencie os eventos do teatro."
      action={
        <button className="button button-primary" onClick={() => navigate("admin-event-form")}>
          <Plus /> Criar evento
        </button>
      }
    >
      <div className="admin-card table-card">
        <div className="table-tools">
          <label>
            <Search />
            <input placeholder="Buscar evento..." />
          </label>
          <button className="button button-outline">
            <CalendarDays /> Todas as datas
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Data</th>
                <th>Status</th>
                <th>Ocupação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Apresentação de Fim de Ano", "14 dez 2024 · 19h30", "Publicado", "198 / 240"],
                ["Cantata de Natal", "18 dez 2024 · 20h", "Publicado", "222 / 240"],
                ["Mostra Cultural 2025", "22 mar 2025 · 18h", "Rascunho", "—"],
                ["Festa Junina CSCSP", "21 jun 2024 · 16h", "Encerrado", "236 / 240"],
              ].map((row, i) => (
                <tr key={row[0]}>
                  <td>
                    <strong>{row[0]}</strong>
                    <small>{i < 2 ? "Teatro CSCSP" : "Pátio principal"}</small>
                  </td>
                  <td>{row[1]}</td>
                  <td>
                    <span className={`table-status status-${row[2].toLowerCase()}`}>{row[2]}</span>
                  </td>
                  <td>{row[3]}</td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => navigate("admin-event-form")} title="Editar">
                        <Edit3 />
                      </button>
                      <button title="Duplicar">
                        <Copy />
                      </button>
                      <button>
                        <MoreHorizontal />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPage>
  );
}

function EventForm({ navigate }: { navigate: (screen: Screen) => void }) {
  return (
    <AdminPage
      title="Criar evento"
      subtitle="Preencha as informações que serão exibidas ao público."
    >
      <form
        className="admin-form"
        onSubmit={(e) => {
          e.preventDefault();
          navigate("admin-events");
        }}
      >
        <section className="admin-card form-section">
          <div className="form-section-heading">
            <span>1</span>
            <div>
              <h3>Informações do evento</h3>
              <p>Dados principais para identificação.</p>
            </div>
          </div>
          <label>
            Título do evento
            <input defaultValue="Mostra Cultural 2025" />
          </label>
          <label>
            Descrição
            <textarea rows={5} placeholder="Conte um pouco sobre o evento..." />
          </label>
          <div className="form-grid">
            <label>
              Data
              <input type="date" />
            </label>
            <label>
              Horário
              <input type="time" />
            </label>
          </div>
        </section>
        <section className="admin-card form-section">
          <div className="form-section-heading">
            <span>2</span>
            <div>
              <h3>Imagem e reservas</h3>
              <p>Personalize a capa e defina os limites.</p>
            </div>
          </div>
          <button className="upload-box" type="button">
            <ImageIcon />
            <strong>Enviar imagem de capa</strong>
            <span>PNG ou JPG · recomendado 1600 × 900 px</span>
          </button>
          <label>
            Limite de assentos por pessoa
            <input type="number" defaultValue={4} min={1} max={10} />
          </label>
        </section>
        <div className="form-actions">
          <button
            type="button"
            className="button button-outline"
            onClick={() => navigate("admin-events")}
          >
            Cancelar
          </button>
          <button className="button button-outline" type="button">
            Salvar rascunho
          </button>
          <button className="button button-primary">
            Salvar e continuar <ArrowRight />
          </button>
        </div>
      </form>
    </AdminPage>
  );
}

function Editor({ navigate }: { navigate: (screen: Screen) => void }) {
  const [selected, setSelected] = useState<string[]>(["A20", "A18", "A1", "A3"]);
  const [tool, setTool] = useState("Preferencial");
  const [saved, setSaved] = useState(false);
  return (
    <AdminPage
      title="Editor do mapa"
      subtitle="Apresentação de Fim de Ano · 14 de dezembro"
      action={
        <div className="editor-actions">
          <button className="button button-outline" onClick={() => navigate("dashboard")}>
            Cancelar
          </button>
          <button
            className="button button-primary"
            onClick={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 2500);
            }}
          >
            {saved ? <Check /> : null}
            {saved ? "Layout salvo" : "Salvar layout"}
          </button>
        </div>
      }
    >
      <div className="editor-layout">
        <aside className="editor-tools admin-card">
          <div>
            <h3>Ferramentas</h3>
            <p>Selecione lugares no mapa e aplique uma classificação.</p>
          </div>
          <span className="tool-label">CLASSIFICAR COMO</span>
          {[
            ["Disponível", "available"],
            ["Preferencial", "preferred"],
            ["Reservado para equipe", "team"],
            ["Bloqueado", "blocked"],
          ].map(([label, cls]) => (
            <button
              key={label}
              className={`tool-option ${tool === label ? "active" : ""}`}
              onClick={() => setTool(label)}
            >
              <i className={cls}>{cls === "team" && <X size={12} />}</i>
              <span>
                <strong>{label}</strong>
                <small>
                  {label === "Preferencial"
                    ? "Mobilidade reduzida e convidados"
                    : label === "Reservado para equipe"
                      ? "Produção e colaboradores"
                      : "Assentos no mapa"}
                </small>
              </span>
              {tool === label && <Check />}
            </button>
          ))}
          <hr />
          <button className="row-tool">
            <Grid3X3 />
            <span>
              <strong>Selecionar fileira</strong>
              <small>Clique na letra da fileira</small>
            </span>
          </button>
          <button className="row-tool">
            <Edit3 />
            <span>
              <strong>Editar numeração</strong>
              <small>Renomear e renumerar</small>
            </span>
          </button>
          <div className="selected-summary">
            <span>{selected.length} assentos selecionados</span>
            <button onClick={() => setSelected([])}>Limpar</button>
          </div>
          <button className="button button-primary full" onClick={() => setSelected([])}>
            Aplicar: {tool}
          </button>
        </aside>
        <div className="editor-canvas admin-card">
          <div className="editor-canvas-head">
            <div>
              <strong>Plateia principal</strong>
              <span>240 assentos · clique e arraste para selecionar</span>
            </div>
            <Legend />
          </div>
          <SeatMap selected={selected} setSelected={setSelected} editor />
        </div>
      </div>
    </AdminPage>
  );
}

function AdminReservations() {
  return (
    <AdminPage
      title="Lista de reservas"
      subtitle="Consulte participantes e acompanhe o status."
      action={
        <button className="button button-outline">
          <FileDown /> Exportar CSV
        </button>
      }
    >
      <div className="admin-card table-card">
        <div className="table-tools">
          <label>
            <Search />
            <input placeholder="Buscar por nome, R.A. ou assento..." />
          </label>
          <button className="button button-outline">
            Todos os status <ChevronDown />
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Participante</th>
                <th>R.A.</th>
                <th>Tipo</th>
                <th>Assento</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Mariana Silva", "20241182", "Responsável", "C8, C10", "Confirmada"],
                ["Pedro Henrique Lima", "20240857", "Aluno", "A12", "Confirmada"],
                ["Ana Beatriz Souza", "20239212", "Responsável", "F3, F5, F7", "Confirmada"],
                ["Rafael Oliveira", "20240158", "Aluno", "D16", "Pendente"],
                ["Carla Mendes", "20228834", "Responsável", "H8, H10", "Cancelada"],
              ].map((row) => (
                <tr key={row[0]}>
                  <td>
                    <strong>{row[0]}</strong>
                    <small>{row[0].toLowerCase().replaceAll(" ", ".")}@email.com</small>
                  </td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                  <td>
                    <b>{row[3]}</b>
                  </td>
                  <td>
                    <span className={`table-status status-${row[4].toLowerCase()}`}>{row[4]}</span>
                  </td>
                  <td>
                    <button className="icon-button">
                      <MoreHorizontal />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPage>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const navigate = (next: Screen) => {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const isAdmin = screen.startsWith("admin") || screen === "dashboard" || screen === "editor";

  const content = (() => {
    switch (screen) {
      case "detail":
        return <EventDetail navigate={navigate} />;
      case "login":
        return <Login navigate={navigate} />;
      case "map":
        return <MapScreen navigate={navigate} />;
      case "confirmation":
        return <Confirmation navigate={navigate} />;
      case "my-reservations":
        return <MyReservations navigate={navigate} />;
      case "dashboard":
        return <Dashboard navigate={navigate} />;
      case "admin-events":
        return <AdminEvents navigate={navigate} />;
      case "admin-event-form":
        return <EventForm navigate={navigate} />;
      case "editor":
        return <Editor navigate={navigate} />;
      case "admin-reservations":
        return <AdminReservations />;
      default:
        return <Home navigate={navigate} />;
    }
  })();

  return (
    <>
      <Header screen={screen} navigate={navigate} />
      {isAdmin ? (
        <AdminShell screen={screen} navigate={navigate}>
          {content}
        </AdminShell>
      ) : (
        content
      )}
    </>
  );
}
