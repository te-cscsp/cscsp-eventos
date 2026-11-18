import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Accessibility, Check, Edit3, Grid3X3, LoaderCircle, Plus, Redo2, Undo2, X } from "lucide-react";
import { AdminPage } from "../components/PageHeader";
import { Carregando, Erro, Vazio } from "../components/Estados";
import { EventoSelector } from "../components/EventoSelector";
import { Legend } from "../components/Legend";
import { ReservaDetalhe } from "../components/ReservaDetalhe";
import { ReservaModal } from "../components/ReservaModal";
import { SeatMap } from "../components/SeatMap";
import { useToast } from "../components/Toast";
import { useEventos } from "../context/EventoContext";
import { usePerfil } from "../data/auth";
import { salvarClasses } from "../data/assentos";
import { useAssentos, useReservas } from "../data/hooks";
import { ordenarAssentos } from "../lib/format";
import { ASSENTOS, ROTULO_CLASSE, calcularStats, classeEfetiva, classePadrao } from "../lib/layout";
import { podeEditarMapa, podeReservar } from "../lib/permissoes";
import { ErroNegocio, type Classe } from "../types";

const FERRAMENTAS: { classe: Classe; rotulo: string; dica: string; visual: string }[] = [
  { classe: "normal", rotulo: "Comum", dica: "Assento comum, disponível", visual: "available" },
  { classe: "preferencial", rotulo: "Prioritário", dica: "Atendimento prioritário", visual: "preferred" },
  { classe: "pcd", rotulo: "PcD (cadeirante)", dica: "Espaço para cadeirante", visual: "pcd" },
  { classe: "equipe", rotulo: "Reservado para equipe", dica: "Produção e colaboradores", visual: "team" },
  { classe: "bloqueado", rotulo: "Bloqueado", dica: "Fora de uso neste evento", visual: "blocked" },
];

type Historico = { pilha: Record<string, Classe>[]; i: number };
const historicoInicial: Historico = { pilha: [{}], i: 0 };

export default function Mapa() {
  const perfil = usePerfil();
  const toast = useToast();
  const navigate = useNavigate();
  const { eventos, evento, eventoId, carregando: carregandoEv, erro: erroEv } = useEventos();
  const { docs, carregando, erro, recarregar } = useAssentos(eventoId);
  const reservar = podeReservar(perfil.papel);
  const editarMapa = podeEditarMapa(perfil.papel);
  const { reservas } = useReservas(eventoId, reservar);

  const [modo, setModo] = useState<"reservar" | "editar">("reservar");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [modalReserva, setModalReserva] = useState(false);
  const [reservaAbertaId, setReservaAbertaId] = useState<string | null>(null);
  const [ferramenta, setFerramenta] = useState<Classe>("preferencial");
  const [hist, setHist] = useState<Historico>(historicoInicial);
  const [salvando, setSalvando] = useState(false);

  const rascunho = hist.pilha[hist.i];
  const pendentes = Object.keys(rascunho).length;
  const stats = useMemo(() => calcularStats(docs), [docs]);
  const aceitaReservas = evento?.status === "draft" || evento?.status === "published";

  // trocar de evento descarta seleção e alterações não salvas
  useEffect(() => {
    setSelecionados(new Set());
    setHist(historicoInicial);
    setModalReserva(false);
    setReservaAbertaId(null);
  }, [eventoId]);

  useEffect(() => {
    if (pendentes === 0) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [pendentes]);

  const alternar = useCallback((id: string) => {
    setSelecionados((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const aoClicarAssento = useCallback(
    (id: string) => {
      if (modo === "editar") return alternar(id);
      const d = docs.get(id);
      const classe = d?.classe ?? classePadrao(id);
      if (d?.ocupado) {
        if (reservar && d.reservaId) setReservaAbertaId(d.reservaId);
        else toast.info(`Assento ${id} reservado`, "Seu perfil não visualiza dados de participantes.");
        return;
      }
      if (classe === "equipe" || classe === "bloqueado") {
        toast.info(`Assento ${id}: ${ROTULO_CLASSE[classe].toLowerCase()}`, editarMapa ? "Para liberar, use o modo Editar mapa." : "Peça à administração para liberar.");
        return;
      }
      if (!reservar) return toast.info("Seu perfil não pode criar reservas.");
      if (!aceitaReservas) return toast.info("Este evento não aceita novas reservas.");
      alternar(id);
    },
    [modo, docs, reservar, editarMapa, aceitaReservas, alternar, toast],
  );

  const aoClicarFileira = useCallback(
    (f: string) => {
      const ids = ASSENTOS.filter((a) => a.fileira === f).map((a) => a.id);
      setSelecionados((s) => {
        const todos = ids.every((id) => s.has(id));
        const n = new Set(s);
        ids.forEach((id) => (todos ? n.delete(id) : n.add(id)));
        return n;
      });
    },
    [],
  );

  const empurrar = (novo: Record<string, Classe>) =>
    setHist((h) => ({ pilha: [...h.pilha.slice(0, h.i + 1), novo], i: h.i + 1 }));

  const aplicar = () => {
    if (selecionados.size === 0) return;
    const novo = { ...rascunho };
    const recusados: string[] = [];
    selecionados.forEach((id) => {
      if ((ferramenta === "equipe" || ferramenta === "bloqueado") && docs.get(id)?.ocupado) {
        recusados.push(id);
        return;
      }
      if (ferramenta === classeEfetiva(id, docs)) delete novo[id];
      else novo[id] = ferramenta;
    });
    if (recusados.length > 0) {
      toast.erro(`${recusados.length} assento(s) com reserva ativa não foram alterados`, `${ordenarAssentos(recusados).slice(0, 8).join(", ")}${recusados.length > 8 ? "…" : ""}. Cancele a reserva antes.`);
    }
    empurrar(novo);
    setSelecionados(new Set());
  };

  const salvar = async () => {
    if (!evento || pendentes === 0) return;
    setSalvando(true);
    try {
      const n = await salvarClasses(evento.id, rascunho, perfil, evento.titulo);
      setHist(historicoInicial);
      toast.ok("Layout salvo", `${n} assento(s) atualizado(s).`);
    } catch (e) {
      toast.erro(e instanceof ErroNegocio ? e.message : "Não foi possível salvar o layout", e instanceof ErroNegocio ? undefined : "Suas alterações continuam na tela. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const mudarModo = (m: "reservar" | "editar") => {
    if (m === modo) return;
    if (pendentes > 0 && !window.confirm("Existem alterações não salvas no mapa. Descartar e trocar de modo?")) return;
    setHist(historicoInicial);
    setSelecionados(new Set());
    setModo(m);
  };

  const reservaAberta = reservas.find((r) => r.id === reservaAbertaId) ?? null;
  const titulo = "Mapa de assentos";
  const subtitulo = evento ? "Clique nos assentos para reservar. Clique em um assento reservado para ver, editar ou cancelar." : "Selecione um evento.";

  if (carregandoEv) return <AdminPage title={titulo} subtitle=""><Carregando /></AdminPage>;
  if (erroEv) return <AdminPage title={titulo} subtitle=""><Erro texto={erroEv} /></AdminPage>;
  if (!evento || eventos.length === 0)
    return (
      <AdminPage title={titulo} subtitle="">
        <Vazio titulo="Nenhum evento cadastrado" texto="Crie um evento para usar o mapa." acao={editarMapa ? <button className="button button-primary" onClick={() => navigate("/eventos/novo")}><Plus /> Criar evento</button> : undefined} />
      </AdminPage>
    );

  const cabecalho = editarMapa ? (
    <div className="segmentado" role="tablist" aria-label="Modo do mapa">
      <button role="tab" aria-selected={modo === "reservar"} className={modo === "reservar" ? "ativo" : ""} onClick={() => mudarModo("reservar")}>
        <Grid3X3 /> Reservar
      </button>
      <button role="tab" aria-selected={modo === "editar"} className={modo === "editar" ? "ativo" : ""} onClick={() => mudarModo("editar")}>
        <Edit3 /> Editar mapa
      </button>
    </div>
  ) : undefined;

  const mapa = (
    <SeatMap
      docs={docs}
      rascunho={modo === "editar" ? rascunho : undefined}
      selecionados={selecionados}
      onAssento={aoClicarAssento}
      onFileira={modo === "editar" ? aoClicarFileira : undefined}
      editor={modo === "editar"}
    />
  );

  return (
    <AdminPage title={titulo} subtitle={subtitulo} action={cabecalho}>
      <EventoSelector />
      {!aceitaReservas && (
        <div className="aviso-inline" role="status">
          Este evento está {evento.status === "closed" ? "encerrado" : "cancelado"}: novas reservas estão desativadas.
        </div>
      )}
      {erro ? (
        <Erro texto={erro} onTentar={recarregar} />
      ) : carregando ? (
        <Carregando texto="Carregando o mapa..." />
      ) : modo === "reservar" ? (
        <>
          <div className="resumo-mapa">
            <span><b>{stats.reservados}</b> reservados</span>
            <span><b>{stats.disponiveis}</b> disponíveis</span>
            <span><b>{stats.bloqueados}</b> bloqueados</span>
            <Legend />
          </div>
          {mapa}
          {selecionados.size > 0 && (
            <div className="barra-selecao" role="region" aria-label="Assentos selecionados">
              <div>
                <span>{selecionados.size === 1 ? "ASSENTO SELECIONADO" : `${selecionados.size} ASSENTOS SELECIONADOS`}</span>
                <div className="chips">
                  {ordenarAssentos([...selecionados]).map((id) => (
                    <button key={id} onClick={() => alternar(id)} aria-label={`Remover ${id} da seleção`}>
                      {id} <X />
                    </button>
                  ))}
                </div>
              </div>
              <button className="button button-ghost" onClick={() => setSelecionados(new Set())}>Limpar</button>
              <button className="button button-primary" onClick={() => setModalReserva(true)}>
                <Check /> Reservar
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="editor-layout">
          <aside className="editor-tools admin-card">
            <div>
              <h3>Ferramentas</h3>
              <p>Selecione lugares no mapa e aplique uma classificação.</p>
            </div>
            <span className="tool-label">CLASSIFICAR COMO</span>
            {FERRAMENTAS.map((f) => (
              <button key={f.classe} className={`tool-option ${ferramenta === f.classe ? "active" : ""}`} onClick={() => setFerramenta(f.classe)}>
                <i className={f.visual}>{f.classe === "equipe" ? <X size={12} /> : f.classe === "pcd" ? <Accessibility size={12} /> : null}</i>
                <span>
                  <strong>{f.rotulo}</strong>
                  <small>{f.dica}</small>
                </span>
                {ferramenta === f.classe && <Check />}
              </button>
            ))}
            <hr />
            <div className="row-tool dica-fileira">
              <Grid3X3 />
              <span>
                <strong>Selecionar fileira</strong>
                <small>Clique na letra da fileira</small>
              </span>
            </div>
            <div className="desfazer">
              <button className="button button-outline" onClick={() => setHist((h) => ({ ...h, i: Math.max(0, h.i - 1) }))} disabled={hist.i === 0 || salvando}>
                <Undo2 /> Desfazer
              </button>
              <button className="button button-outline" onClick={() => setHist((h) => ({ ...h, i: Math.min(h.pilha.length - 1, h.i + 1) }))} disabled={hist.i >= hist.pilha.length - 1 || salvando}>
                <Redo2 /> Refazer
              </button>
            </div>
            <div className="selected-summary">
              <span>{selecionados.size} assentos selecionados</span>
              <button onClick={() => setSelecionados(new Set())}>Limpar</button>
            </div>
            <button className="button button-primary full" onClick={aplicar} disabled={selecionados.size === 0 || salvando}>
              Aplicar: {ROTULO_CLASSE[ferramenta]}
            </button>
            <div className="salvar-layout">
              <small>{pendentes === 0 ? "Nenhuma alteração pendente." : `${pendentes} alteração(ões) não salva(s).`}</small>
              <button className="button button-primary full" onClick={() => void salvar()} disabled={pendentes === 0 || salvando}>
                {salvando ? <LoaderCircle className="spinner" /> : <Check />} Salvar layout
              </button>
              <button className="button button-outline full" onClick={() => { setHist(historicoInicial); setSelecionados(new Set()); }} disabled={pendentes === 0 || salvando}>
                Descartar alterações
              </button>
            </div>
          </aside>
          <div className="editor-canvas admin-card">
            <div className="editor-canvas-head">
              <div>
                <strong>Plateia</strong>
                <span>{stats.total} assentos · clique nos assentos ou na letra da fileira</span>
              </div>
              <Legend />
            </div>
            {mapa}
          </div>
        </div>
      )}
      {modalReserva && (
        <ReservaModal
          evento={evento}
          seatIds={[...selecionados]}
          onFechar={() => setModalReserva(false)}
          onConcluir={(codigo) => {
            setModalReserva(false);
            setSelecionados(new Set());
            toast.ok(`Reserva ${codigo} confirmada`, "Os assentos já aparecem como reservados.");
          }}
        />
      )}
      {reservaAberta && <ReservaDetalhe reserva={reservaAberta} evento={evento} onFechar={() => setReservaAbertaId(null)} />}
    </AdminPage>
  );
}
