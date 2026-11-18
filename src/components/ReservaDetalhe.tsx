import { useState } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle, Undo2 } from "lucide-react";
import { atualizarDados, cancelarReserva, mudarCheckIn } from "../data/reservas";
import { usePerfil } from "../data/auth";
import { dataHora, ordenarAssentos } from "../lib/format";
import { NOME_SETOR, ASSENTO_POR_ID } from "../lib/layout";
import { ErroNegocio, ROTULO_STATUS_RESERVA, ROTULO_TIPO, type Evento, type Reserva } from "../types";
import { CamposParticipante, paraDados, validarParticipante, type ErrosParticipante, type FormParticipante } from "./CamposParticipante";
import { Modal } from "./Modal";
import { useToast } from "./Toast";

export const classeStatus = (s: Reserva["status"]) =>
  s === "confirmed" ? "confirmada" : s === "checked_in" ? "checkin" : s === "cancelled" ? "cancelada" : s === "expired" ? "expirada" : "pendente";

interface Props {
  reserva: Reserva;
  evento: Evento | null;
  onFechar: () => void;
}

export function ReservaDetalhe({ reserva, evento, onFechar }: Props) {
  const perfil = usePerfil();
  const toast = useToast();
  const [etapa, setEtapa] = useState<"ver" | "editar" | "cancelar">("ver");
  const [form, setForm] = useState<FormParticipante>({
    nome: reserva.nome,
    ra: reserva.ra,
    tipoUsuario: reserva.tipoUsuario,
    telefone: reserva.telefone ?? "",
    email: reserva.email ?? "",
    observacao: reserva.observacao ?? "",
  });
  const [erros, setErros] = useState<ErrosParticipante>({});
  const [motivo, setMotivo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const ativa = reserva.status === "confirmed" || reserva.status === "checked_in";

  const executar = async (fn: () => Promise<void>, sucesso: string) => {
    setOcupado(true);
    setErro(null);
    try {
      await fn();
      toast.ok(sucesso);
      setEtapa("ver");
      return true;
    } catch (e) {
      setErro(e instanceof ErroNegocio ? e.message : "Não foi possível concluir a ação. Tente novamente.");
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const ids = ordenarAssentos(reserva.seatIds);
  const setores = [...new Set(ids.map((id) => NOME_SETOR[ASSENTO_POR_ID.get(id)?.setor ?? ""] ?? ""))].filter(Boolean);

  return (
    <Modal
      titulo={`Reserva ${reserva.id}`}
      subtitulo={evento?.titulo}
      onFechar={onFechar}
      travado={ocupado}
      largo
      rodape={
        etapa === "ver" ? (
          <>
            {ativa && (
              <button className="button button-danger-outline" onClick={() => setEtapa("cancelar")} disabled={ocupado}>
                Cancelar reserva
              </button>
            )}
            {ativa && (
              <button className="button button-outline" onClick={() => setEtapa("editar")} disabled={ocupado}>
                Editar dados
              </button>
            )}
            {reserva.status === "confirmed" && (
              <button className="button button-primary" disabled={ocupado} onClick={() => void executar(() => mudarCheckIn(reserva, true, perfil), "Check-in registrado.")}>
                {ocupado ? <LoaderCircle className="spinner" /> : <CheckCircle2 />} Fazer check-in
              </button>
            )}
            {reserva.status === "checked_in" && (
              <button className="button button-outline" disabled={ocupado} onClick={() => void executar(() => mudarCheckIn(reserva, false, perfil), "Check-in desfeito.")}>
                <Undo2 /> Desfazer check-in
              </button>
            )}
            <button className="button button-outline" onClick={onFechar} disabled={ocupado}>
              Fechar
            </button>
          </>
        ) : etapa === "editar" ? (
          <>
            <button className="button button-outline" onClick={() => setEtapa("ver")} disabled={ocupado}>
              Voltar
            </button>
            <button
              className="button button-primary"
              disabled={ocupado}
              onClick={() => {
                const v = validarParticipante(form);
                setErros(v);
                if (Object.keys(v).length === 0) void executar(() => atualizarDados(reserva, paraDados(form), perfil), "Dados atualizados.");
              }}
            >
              {ocupado && <LoaderCircle className="spinner" />} Salvar dados
            </button>
          </>
        ) : (
          <>
            <button className="button button-outline" onClick={() => setEtapa("ver")} disabled={ocupado}>
              Voltar
            </button>
            <button
              className="button button-danger"
              disabled={ocupado}
              onClick={() => void executar(() => cancelarReserva(reserva, motivo.trim(), perfil), "Reserva cancelada. Os assentos foram liberados.")}
            >
              {ocupado && <LoaderCircle className="spinner" />} Confirmar cancelamento
            </button>
          </>
        )
      }
    >
      {etapa === "ver" && (
        <div className="detalhe">
          <div className="detalhe-topo">
            <span className={`table-status status-${classeStatus(reserva.status)}`}>{ROTULO_STATUS_RESERVA[reserva.status]}</span>
            <small>Criada em {dataHora(reserva.criadoEm)} por {reserva.criadoPorNome || "—"}</small>
          </div>
          <dl className="detalhe-grade">
            <div><dt>Participante</dt><dd>{reserva.nome}</dd></div>
            <div><dt>R.A.</dt><dd>{reserva.ra}</dd></div>
            <div><dt>Tipo</dt><dd>{ROTULO_TIPO[reserva.tipoUsuario]}</dd></div>
            <div><dt>Telefone</dt><dd>{reserva.telefone || "—"}</dd></div>
            <div><dt>E-mail</dt><dd>{reserva.email || "—"}</dd></div>
            <div><dt>Setor</dt><dd>{setores.join(" e ") || "—"}</dd></div>
          </dl>
          <div className="chips-resumo">
            <span>{ids.length === 1 ? "Assento" : "Assentos"}</span>
            {ids.map((id) => (
              <b key={id}>{id}</b>
            ))}
          </div>
          {reserva.observacao && <p className="detalhe-obs">“{reserva.observacao}”</p>}
          <h3 className="detalhe-titulo">Histórico</h3>
          <ul className="historico">
            {[...reserva.historico].sort((a, b) => b.quando - a.quando).map((h, i) => (
              <li key={`${h.quando}-${i}`}>
                <strong>{h.resumo}</strong>
                <small>{dataHora(h.quando)} · {h.nome}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
      {etapa === "editar" && <CamposParticipante valor={form} erros={erros} onChange={setForm} desabilitado={ocupado} />}
      {etapa === "cancelar" && (
        <div className="campos">
          <p>
            Cancelar a reserva <strong>{reserva.id}</strong> de <strong>{reserva.nome}</strong> libera {ids.length === 1 ? "o assento" : "os assentos"} <strong>{ids.join(", ")}</strong>. Esta ação fica registrada.
          </p>
          <label>
            Motivo (opcional)
            <input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={120} disabled={ocupado} />
          </label>
        </div>
      )}
      {erro && (
        <div className="erro-inline" role="alert">
          <AlertTriangle /> {erro}
        </div>
      )}
    </Modal>
  );
}
