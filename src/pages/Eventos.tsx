import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, ChevronDown, Edit3, Copy, MoreHorizontal, Plus, Search, X } from "lucide-react";
import { AdminPage } from "../components/PageHeader";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Carregando, Erro, Vazio } from "../components/Estados";
import { useToast } from "../components/Toast";
import { useEventos } from "../context/EventoContext";
import { usePerfil } from "../data/auth";
import { contarEvento, duplicarEvento, excluirRascunho, mudarStatus } from "../data/eventos";
import { dataCurta } from "../lib/format";
import { TOTAL_ASSENTOS } from "../lib/layout";
import { podeGerirEventos } from "../lib/permissoes";
import { ErroNegocio, ROTULO_STATUS_EVENTO, type Evento, type EventoStatus } from "../types";

type Contagem = { reservados: number; bloqueados: number };
type Acao = { tipo: "cancelar" | "encerrar" | "excluir"; evento: Evento };
const classeStatus: Record<EventoStatus, string> = { draft: "rascunho", published: "publicado", closed: "encerrado", cancelled: "cancelado" };

export default function Eventos() {
  const perfil = usePerfil();
  const toast = useToast();
  const navigate = useNavigate();
  const { eventos, carregando, erro, selecionar } = useEventos();
  const admin = podeGerirEventos(perfil.papel);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<"todos" | EventoStatus>("todos");
  const [contagens, setContagens] = useState<Record<string, Contagem>>({});
  const [menu, setMenu] = useState<string | null>(null);
  const [acao, setAcao] = useState<Acao | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const raiz = useRef<HTMLDivElement>(null);

  const chave = eventos.map((e) => e.id).join(",");
  useEffect(() => {
    let vivo = true;
    void Promise.all(eventos.map((e) => contarEvento(e.id).then((c) => [e.id, c] as const).catch(() => null))).then((pares) => {
      if (vivo) setContagens(Object.fromEntries(pares.filter((p): p is readonly [string, Contagem] => p !== null)));
    });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  useEffect(() => {
    if (!menu) return;
    const fora = (e: MouseEvent) => !raiz.current?.contains(e.target as Node) && setMenu(null);
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [menu]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return eventos.filter((e) => (status === "todos" || e.status === status) && (!q || e.titulo.toLowerCase().includes(q)));
  }, [eventos, busca, status]);
  const filtrando = busca.trim() !== "" || status !== "todos";

  const executar = async (id: string, fn: () => Promise<unknown>, sucesso: string) => {
    setMenu(null);
    setOcupado(id);
    try {
      await fn();
      toast.ok(sucesso);
    } catch (e) {
      toast.erro(e instanceof ErroNegocio ? e.message : "Não foi possível concluir a ação.", "Tente novamente.");
    } finally {
      setOcupado(null);
    }
  };

  const itensMenu = (e: Evento) => {
    const l: { rotulo: string; fn: () => void; perigo?: boolean }[] = [
      { rotulo: "Ver visão geral", fn: () => { selecionar(e.id); navigate("/"); } },
      { rotulo: "Abrir mapa de assentos", fn: () => { selecionar(e.id); navigate("/mapa"); } },
    ];
    if (!admin) return l;
    if (e.status === "draft") l.push({ rotulo: "Publicar", fn: () => void executar(e.id, () => mudarStatus(e, "published", perfil), "Evento publicado.") });
    if (e.status === "published") {
      l.push({ rotulo: "Voltar para rascunho", fn: () => void executar(e.id, () => mudarStatus(e, "draft", perfil), "Evento voltou para rascunho.") });
      l.push({ rotulo: "Encerrar reservas", fn: () => { setMenu(null); setAcao({ tipo: "encerrar", evento: e }); } });
    }
    if (e.status === "closed") l.push({ rotulo: "Reabrir", fn: () => void executar(e.id, () => mudarStatus(e, "published", perfil), "Evento reaberto.") });
    if (e.status !== "cancelled") l.push({ rotulo: "Cancelar evento", perigo: true, fn: () => { setMenu(null); setAcao({ tipo: "cancelar", evento: e }); } });
    if (e.status === "draft") l.push({ rotulo: "Excluir rascunho", perigo: true, fn: () => { setMenu(null); setAcao({ tipo: "excluir", evento: e }); } });
    return l;
  };

  const confirmacao = () => {
    if (!acao) return null;
    const { tipo, evento: e } = acao;
    const textos = {
      cancelar: { titulo: "Cancelar evento", texto: <>O evento <strong>{e.titulo}</strong> será marcado como cancelado e não aceitará novas reservas. As reservas existentes continuam registradas.</>, botao: "Cancelar evento", novo: "cancelled" as EventoStatus, ok: "Evento cancelado." },
      encerrar: { titulo: "Encerrar reservas", texto: <>O evento <strong>{e.titulo}</strong> deixará de aceitar novas reservas. Você pode reabri-lo depois.</>, botao: "Encerrar", novo: "closed" as EventoStatus, ok: "Reservas encerradas." },
      excluir: { titulo: "Excluir rascunho", texto: <>O rascunho <strong>{e.titulo}</strong> será apagado de forma definitiva.</>, botao: "Excluir", novo: null, ok: "Rascunho excluído." },
    }[tipo];
    return (
      <ConfirmDialog
        titulo={textos.titulo}
        texto={textos.texto}
        confirmar={textos.botao}
        perigo
        onCancelar={() => setAcao(null)}
        onConfirmar={async () => {
          const alvo = acao;
          setAcao(null);
          await executar(alvo.evento.id, () => (textos.novo ? mudarStatus(alvo.evento, textos.novo, perfil) : excluirRascunho(alvo.evento, perfil)), textos.ok);
        }}
      />
    );
  };

  return (
    <AdminPage
      title="Eventos"
      subtitle="Crie e gerencie os eventos do teatro."
      action={admin ? (
        <button className="button button-primary" onClick={() => navigate("/eventos/novo")}>
          <Plus /> Criar evento
        </button>
      ) : undefined}
    >
      <div className="admin-card table-card" ref={raiz}>
        <div className="table-tools">
          <label>
            <Search />
            <input placeholder="Buscar evento..." value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar evento" />
          </label>
          <label className="select-inline">
            <CalendarDays />
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Filtrar por status">
              <option value="todos">Todos os status</option>
              {(Object.keys(ROTULO_STATUS_EVENTO) as EventoStatus[]).map((s) => (
                <option key={s} value={s}>{ROTULO_STATUS_EVENTO[s]}</option>
              ))}
            </select>
            <ChevronDown />
          </label>
          {filtrando && (
            <button className="button button-ghost" onClick={() => { setBusca(""); setStatus("todos"); }}>
              <X /> Limpar filtros
            </button>
          )}
        </div>
        {carregando ? (
          <Carregando />
        ) : erro ? (
          <Erro texto={erro} />
        ) : lista.length === 0 ? (
          <Vazio titulo={filtrando ? "Nenhum evento encontrado" : "Nenhum evento cadastrado"} texto={filtrando ? "Tente outros filtros." : admin ? "Crie o primeiro evento do teatro." : undefined} />
        ) : (
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
                {lista.map((e) => {
                  const c = contagens[e.id];
                  const cap = c ? TOTAL_ASSENTOS - c.bloqueados : null;
                  return (
                    <tr key={e.id} className={ocupado === e.id ? "linha-ocupada" : ""}>
                      <td>
                        <strong>{e.titulo}</strong>
                        <small>{e.local}{e.gratuito ? " · Gratuito" : ""}</small>
                      </td>
                      <td>{dataCurta(e.data, e.horario)}</td>
                      <td><span className={`table-status status-${classeStatus[e.status]}`}>{ROTULO_STATUS_EVENTO[e.status]}</span></td>
                      <td>{c && cap !== null ? `${c.reservados} / ${cap}` : "—"}</td>
                      <td>
                        <div className="row-actions">
                          {admin && (
                            <button onClick={() => navigate(`/eventos/${e.id}/editar`)} title="Editar" aria-label={`Editar ${e.titulo}`}>
                              <Edit3 />
                            </button>
                          )}
                          {admin && (
                            <button onClick={() => void executar(e.id, async () => { const novo = await duplicarEvento(e, perfil); navigate(`/eventos/${novo}/editar`); }, "Evento duplicado como rascunho.")} title="Duplicar" aria-label={`Duplicar ${e.titulo}`}>
                              <Copy />
                            </button>
                          )}
                          <div className="menu-wrap">
                            <button onClick={() => setMenu(menu === e.id ? null : e.id)} aria-haspopup="menu" aria-expanded={menu === e.id} aria-label={`Mais ações para ${e.titulo}`}>
                              <MoreHorizontal />
                            </button>
                            {menu === e.id && (
                              <ul className="row-menu" role="menu">
                                {itensMenu(e).map((i) => (
                                  <li key={i.rotulo} role="none">
                                    <button role="menuitem" className={i.perigo ? "perigo" : ""} onClick={i.fn}>{i.rotulo}</button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {confirmacao()}
    </AdminPage>
  );
}
