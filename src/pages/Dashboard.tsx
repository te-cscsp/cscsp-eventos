import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Image as ImageIcon, LoaderCircle, LockKeyhole, Plus, ShieldCheck, Ticket, Users } from "lucide-react";
import logo from "../assets/cscsp-logo.png";
import { AdminPage } from "../components/PageHeader";
import { Carregando, Erro, Vazio } from "../components/Estados";
import { EventoSelector } from "../components/EventoSelector";
import { useToast } from "../components/Toast";
import { usePerfil } from "../data/auth";
import { useAssentos, useReservas } from "../data/hooks";
import { obterCapa } from "../data/eventos";
import { useEventos } from "../context/EventoContext";
import { baixarArquivo, diaMes, horaCurta, horaSegundos, mesmoDia, perc1, slug } from "../lib/format";
import { ASSENTOS, FILEIRAS, MAX_DISTANCIA, assentoNaPosicao, calcularStats, visualDoAssento, classePadrao, type Lado } from "../lib/layout";
import { gerarStoryPng } from "../lib/story";
import { podeGerirEventos, podeVerReservas } from "../lib/permissoes";

function Stat({ icon, label, value, detail, positive }: { icon: React.ReactNode; label: string; value: string; detail: string; positive?: boolean }) {
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

export default function Dashboard() {
  const perfil = usePerfil();
  const toast = useToast();
  const navigate = useNavigate();
  const { eventos, evento, eventoId, carregando: carregandoEv, erro: erroEv } = useEventos();
  const { docs, carregando, erro, atualizadoEm, recarregar } = useAssentos(eventoId);
  const verReservas = podeVerReservas(perfil.papel);
  const { reservas } = useReservas(eventoId, verReservas);
  const [capa, setCapa] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    setCapa(null);
    if (eventoId) void obterCapa(eventoId).then(setCapa);
  }, [eventoId]);

  const stats = useMemo(() => calcularStats(docs), [docs]);
  const hoje = reservas.filter((r) => r.status !== "cancelled" && mesmoDia(r.criadoEm)).length;
  const novoEvento = podeGerirEventos(perfil.papel) ? (
    <button className="button button-primary" onClick={() => navigate("/eventos/novo")}>
      <Plus /> Novo evento
    </button>
  ) : undefined;

  const gerarStory = async () => {
    if (!evento) return;
    setGerando(true);
    try {
      const blob = await gerarStoryPng({ titulo: evento.titulo, restam: stats.disponiveis, data: evento.data, horario: evento.horario, capa });
      baixarArquivo(blob, `story-${slug(evento.titulo)}.png`, "image/png");
      toast.ok("Imagem gerada", "O arquivo foi baixado. Não há dados pessoais nele.");
    } catch {
      toast.erro("Não foi possível gerar a imagem", "Tente novamente.");
    } finally {
      setGerando(false);
    }
  };

  if (carregandoEv) return <AdminPage title="Visão geral" subtitle="Acompanhe a ocupação do seu próximo evento."><Carregando /></AdminPage>;
  if (erroEv) return <AdminPage title="Visão geral" subtitle="Acompanhe a ocupação do seu próximo evento."><Erro texto={erroEv} /></AdminPage>;
  if (!evento || eventos.length === 0)
    return (
      <AdminPage title="Visão geral" subtitle="Acompanhe a ocupação do seu próximo evento." action={novoEvento}>
        <Vazio titulo="Nenhum evento cadastrado" texto="Crie o primeiro evento para acompanhar a ocupação do teatro." />
      </AdminPage>
    );

  const esgotado = stats.disponiveis <= 0;
  const { dia, mes } = diaMes(evento.data);
  const heat = (lado: Lado, f: string, d: number) => {
    const a = assentoNaPosicao(f, lado, d);
    if (!a) return <i key={`${lado}${d}`} className="vazio" />;
    const doc = docs.get(a.id);
    const classe = doc?.classe ?? classePadrao(a.id);
    return <i key={a.id} className={`${visualDoAssento(classe, doc?.ocupado === true)} ${classe === "pcd" ? "pcd" : ""}`} title={`${a.label}`} />;
  };
  const dists = Array.from({ length: MAX_DISTANCIA }, (_, i) => i + 1);

  return (
    <AdminPage title="Visão geral" subtitle="Acompanhe a ocupação do seu próximo evento." action={novoEvento}>
      <EventoSelector />
      {erro ? (
        <Erro texto={erro} onTentar={recarregar} />
      ) : carregando ? (
        <Carregando texto="Carregando a ocupação..." />
      ) : (
        <>
          <div className="stats-grid">
            <Stat icon={<Ticket />} label="Total de lugares" value={String(stats.total)} detail="Plateia esquerda e direita" />
            <Stat icon={<Check />} label="Reservados" value={String(stats.reservados)} detail={verReservas && hoje > 0 ? `+${hoje} hoje` : "reservas ativas"} positive={verReservas && hoje > 0} />
            <Stat icon={<Users />} label="Disponíveis" value={String(stats.disponiveis)} detail={`${perc1(100 - stats.perc)}% restantes`} />
            <Stat icon={<LockKeyhole />} label="Bloqueados" value={String(stats.bloqueados)} detail={`Equipe: ${stats.equipe} · Outros: ${stats.bloqueadosOutros}`} />
          </div>
          <div className="dashboard-grid">
            <section className="admin-card occupation-card">
              <div className="card-heading">
                <div>
                  <h3>Ocupação do evento</h3>
                  <p>{atualizadoEm ? `Atualizado às ${horaSegundos(atualizadoEm)}` : "Atualizando..."}</p>
                </div>
              </div>
              <div className="big-progress">
                <div>
                  <strong>{perc1(stats.perc)}%</strong>
                  <span>ocupado</span>
                </div>
                <small>
                  {stats.reservados} de {stats.capacidade} lugares disponíveis para reserva
                </small>
                <div className="progress-track" role="progressbar" aria-valuenow={Math.round(stats.perc)} aria-valuemin={0} aria-valuemax={100} aria-label="Ocupação do evento">
                  <i style={{ width: `${Math.min(100, stats.perc)}%` }} />
                </div>
              </div>
              <div className="sector-bars">
                {stats.porSetor.map((s) => (
                  <div key={s.id}>
                    <span>
                      {s.nome}
                      <strong>{perc1(s.perc)}%</strong>
                    </span>
                    <div>
                      <i style={{ width: `${Math.min(100, s.perc)}%` }} />
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
              <div className={`story-preview ${capa ? "" : "sem-capa"}`}>
                {capa && <img src={capa} alt="" />}
                <div className="story-overlay">
                  <img src={logo} alt="" />
                  <span>{esgotado ? "INGRESSOS ESGOTADOS" : stats.disponiveis <= 20 ? "ÚLTIMOS LUGARES" : "RESERVE SEU LUGAR"}</span>
                  <strong>
                    {esgotado ? (
                      <>Esgotado!</>
                    ) : (
                      <>
                        Restam
                        <br />
                        <b>{stats.disponiveis}</b> {stats.disponiveis === 1 ? "lugar" : "lugares"}!
                      </>
                    )}
                  </strong>
                  <small>
                    {dia} {mes} · {horaCurta(evento.horario).toUpperCase()}
                  </small>
                </div>
              </div>
              <button className="button button-outline full" onClick={() => void gerarStory()} disabled={gerando}>
                {gerando ? <LoaderCircle className="spinner" /> : <ImageIcon />} Gerar imagem para stories
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
                <p>{ASSENTOS.length} lugares · visualização rápida por fileira</p>
              </div>
              <button className="text-button" onClick={() => navigate("/mapa")}>
                Abrir mapa <ArrowRight />
              </button>
            </div>
            <div className="heatmap teatro" aria-label="Mapa de ocupação por fileira">
              {FILEIRAS.map((f) => (
                <div key={f}>
                  <strong>{f}</strong>
                  {[...dists].reverse().map((d) => heat("esquerdo", f, d))}
                  <span className="heat-corredor" />
                  {dists.map((d) => heat("direito", f, d))}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </AdminPage>
  );
}
