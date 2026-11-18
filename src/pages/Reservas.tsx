import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, FileDown, MoreHorizontal, Search, X } from "lucide-react";
import { AdminPage } from "../components/PageHeader";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Carregando, Erro, SemPermissao, Vazio } from "../components/Estados";
import { EventoSelector } from "../components/EventoSelector";
import { classeStatus, ReservaDetalhe } from "../components/ReservaDetalhe";
import { useToast } from "../components/Toast";
import { useEventos } from "../context/EventoContext";
import { usePerfil } from "../data/auth";
import { registrar } from "../data/auditoria";
import { useReservas } from "../data/hooks";
import { baixarArquivo, dataHora, montarCsv, ordenarAssentos, slug } from "../lib/format";
import { ASSENTO_POR_ID, NOME_SETOR } from "../lib/layout";
import { podeExportar, podeVerReservas } from "../lib/permissoes";
import { ROTULO_STATUS_RESERVA, ROTULO_TIPO, type Reserva, type ReservaStatus, type TipoUsuario } from "../types";

const POR_PAGINA = 50;
const setoresDe = (r: Reserva) => [...new Set(r.seatIds.map((id) => ASSENTO_POR_ID.get(id)?.setor ?? ""))].filter(Boolean);

export default function Reservas() {
  const perfil = usePerfil();
  const toast = useToast();
  const navigate = useNavigate();
  const { evento, eventoId, eventos, carregando: carregandoEv } = useEventos();
  const permitido = podeVerReservas(perfil.papel);
  const { reservas, carregando, erro, recarregar } = useReservas(eventoId, permitido);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<"todos" | ReservaStatus>("todos");
  const [tipo, setTipo] = useState<"todos" | TipoUsuario>("todos");
  const [setor, setSetor] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [confirmaCsv, setConfirmaCsv] = useState(false);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return reservas.filter(
      (r) =>
        (status === "todos" || r.status === status) &&
        (tipo === "todos" || r.tipoUsuario === tipo) &&
        (setor === "todos" || (setoresDe(r) as string[]).includes(setor)) &&
        (!q || [r.nome, r.ra, r.email ?? "", r.id, r.seatIds.join(" ")].some((c) => c.toLowerCase().includes(q))),
    );
  }, [reservas, busca, status, tipo, setor]);
  const filtrando = busca.trim() !== "" || status !== "todos" || tipo !== "todos" || setor !== "todos";
  const visiveis = filtradas.slice(0, pagina * POR_PAGINA);
  const aberta = reservas.find((r) => r.id === abertaId) ?? null;

  if (!permitido) return <AdminPage title="Lista de reservas" subtitle=""><SemPermissao /></AdminPage>;

  const exportar = async () => {
    if (!evento) return;
    const csv = montarCsv(
      ["Código", "Evento", "Participante", "R.A.", "Tipo", "Telefone", "E-mail", "Assentos", "Setor", "Status", "Criada em", "Observação"],
      filtradas.map((r) => [
        r.id, evento.titulo, r.nome, r.ra, ROTULO_TIPO[r.tipoUsuario], r.telefone, r.email,
        ordenarAssentos(r.seatIds).join(" "), setoresDe(r).map((s) => NOME_SETOR[s]).join(" e "),
        ROTULO_STATUS_RESERVA[r.status], dataHora(r.criadoEm), r.observacao,
      ]),
    );
    baixarArquivo(csv, `reservas-${slug(evento.titulo)}.csv`, "text/csv;charset=utf-8");
    await registrar(perfil, "reservas.exportar_csv", `events/${evento.id}`, `${filtradas.length} reserva(s) de ${evento.titulo}`);
    toast.ok("Arquivo gerado", `${filtradas.length} reserva(s) exportada(s).`);
    setConfirmaCsv(false);
  };

  return (
    <AdminPage
      title="Lista de reservas"
      subtitle="Consulte participantes e acompanhe o status."
      action={podeExportar(perfil.papel) ? (
        <button className="button button-outline" onClick={() => setConfirmaCsv(true)} disabled={filtradas.length === 0}>
          <FileDown /> Exportar CSV
        </button>
      ) : undefined}
    >
      <EventoSelector />
      <div className="admin-card table-card">
        <div className="table-tools">
          <label>
            <Search />
            <input placeholder="Buscar por nome, R.A., código ou assento..." value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} aria-label="Buscar reservas" />
          </label>
          <label className="select-inline">
            <select value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPagina(1); }} aria-label="Filtrar por status">
              <option value="todos">Todos os status</option>
              {(["confirmed", "checked_in", "cancelled"] as ReservaStatus[]).map((s) => <option key={s} value={s}>{ROTULO_STATUS_RESERVA[s]}</option>)}
            </select>
            <ChevronDown />
          </label>
          <label className="select-inline">
            <select value={tipo} onChange={(e) => { setTipo(e.target.value as typeof tipo); setPagina(1); }} aria-label="Filtrar por tipo">
              <option value="todos">Aluno e responsável</option>
              <option value="aluno">Aluno</option>
              <option value="responsavel">Responsável</option>
            </select>
            <ChevronDown />
          </label>
          <label className="select-inline">
            <select value={setor} onChange={(e) => { setSetor(e.target.value); setPagina(1); }} aria-label="Filtrar por setor">
              <option value="todos">Todos os setores</option>
              {Object.entries(NOME_SETOR).map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
            </select>
            <ChevronDown />
          </label>
          {filtrando && (
            <button className="button button-ghost" onClick={() => { setBusca(""); setStatus("todos"); setTipo("todos"); setSetor("todos"); setPagina(1); }}>
              <X /> Limpar filtros
            </button>
          )}
        </div>
        {carregandoEv || carregando ? (
          <Carregando />
        ) : erro ? (
          <Erro texto={erro} onTentar={recarregar} />
        ) : !evento || eventos.length === 0 ? (
          <Vazio titulo="Nenhum evento cadastrado" />
        ) : reservas.length === 0 ? (
          <Vazio titulo="Nenhuma reserva neste evento" texto="As reservas feitas pelo mapa aparecem aqui." acao={<button className="button button-primary" onClick={() => navigate("/mapa")}>Reservar pelo mapa</button>} />
        ) : filtradas.length === 0 ? (
          <Vazio titulo="Nenhuma reserva encontrada" texto="Tente outros filtros." />
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Participante</th>
                    <th>R.A.</th>
                    <th>Tipo</th>
                    <th>Assento</th>
                    <th>Setor</th>
                    <th>Status</th>
                    <th>Criada em</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.nome}</strong>
                        <small>{r.email || r.telefone || r.id}</small>
                      </td>
                      <td>{r.ra}</td>
                      <td>{ROTULO_TIPO[r.tipoUsuario]}</td>
                      <td><b>{ordenarAssentos(r.seatIds).join(", ")}</b></td>
                      <td>{setoresDe(r).map((s) => NOME_SETOR[s]).join(" e ")}</td>
                      <td><span className={`table-status status-${classeStatus(r.status)}`}>{ROTULO_STATUS_RESERVA[r.status]}</span></td>
                      <td>{dataHora(r.criadoEm)}</td>
                      <td>
                        <button className="icon-button" onClick={() => setAbertaId(r.id)} aria-label={`Abrir reserva ${r.id}`} title="Ver detalhes">
                          <MoreHorizontal />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="tabela-rodape">
              <small>Mostrando {visiveis.length} de {filtradas.length} reserva(s)</small>
              {visiveis.length < filtradas.length && (
                <button className="button button-outline" onClick={() => setPagina((p) => p + 1)}>Mostrar mais</button>
              )}
            </div>
          </>
        )}
      </div>
      {aberta && <ReservaDetalhe reserva={aberta} evento={evento} onFechar={() => setAbertaId(null)} />}
      {confirmaCsv && (
        <ConfirmDialog
          titulo="Exportar reservas (CSV)"
          texto={<>Serão exportadas <strong>{filtradas.length}</strong> reserva(s) de <strong>{evento?.titulo}</strong>{filtrando ? " (com os filtros aplicados)" : ""}. O arquivo contém dados pessoais: guarde-o com cuidado e apague-o depois do uso. A exportação fica registrada.</>}
          confirmar="Exportar"
          onCancelar={() => setConfirmaCsv(false)}
          onConfirmar={exportar}
        />
      )}
    </AdminPage>
  );
}
