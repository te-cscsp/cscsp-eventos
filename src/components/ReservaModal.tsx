import { useState } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { criarReserva } from "../data/reservas";
import { usePerfil } from "../data/auth";
import { ordenarAssentos, dataLonga } from "../lib/format";
import { ErroNegocio, type Evento } from "../types";
import { CamposParticipante, formVazio, paraDados, validarParticipante, type ErrosParticipante, type FormParticipante } from "./CamposParticipante";
import { Modal } from "./Modal";

interface Props {
  evento: Evento;
  seatIds: string[];
  onFechar: () => void;
  onConcluir: (codigo: string) => void;
}

export function ReservaModal({ evento, seatIds, onFechar, onConcluir }: Props) {
  const perfil = usePerfil();
  const [form, setForm] = useState<FormParticipante>(formVazio);
  const [erros, setErros] = useState<ErrosParticipante>({});
  const [excecao, setExcecao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const ids = ordenarAssentos(seatIds);
  const passaLimite = ids.length > evento.limitePorPessoa;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validarParticipante(form);
    setErros(v);
    if (Object.keys(v).length > 0) return;
    if (passaLimite && !excecao) {
      setErroGeral(`Confirme a exceção: o limite do evento é de ${evento.limitePorPessoa} assento(s) por pessoa.`);
      return;
    }
    setSalvando(true);
    setErroGeral(null);
    try {
      const codigo = await criarReserva(evento.id, evento.titulo, paraDados(form), ids, perfil);
      onConcluir(codigo);
    } catch (err) {
      setErroGeral(
        err instanceof ErroNegocio ? err.message : "Não foi possível salvar a reserva agora. Nada foi reservado. Tente novamente.",
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      titulo="Nova reserva"
      subtitulo={`${evento.titulo} · ${dataLonga(evento.data, evento.horario)}`}
      onFechar={onFechar}
      travado={salvando}
      rodape={
        <>
          <button type="button" className="button button-outline" onClick={onFechar} disabled={salvando}>
            Cancelar
          </button>
          <button type="submit" form="form-reserva" className="button button-primary" disabled={salvando}>
            {salvando && <LoaderCircle className="spinner" />} Confirmar reserva
          </button>
        </>
      }
    >
      <form id="form-reserva" onSubmit={enviar} noValidate className="admin-form-modal">
        <div className="chips-resumo">
          <span>{ids.length === 1 ? "Assento" : "Assentos"}</span>
          {ids.map((id) => (
            <b key={id}>{id}</b>
          ))}
        </div>
        <CamposParticipante valor={form} erros={erros} onChange={setForm} desabilitado={salvando} />
        {passaLimite && (
          <label className="checkbox-label aviso-limite">
            <input type="checkbox" checked={excecao} onChange={(e) => setExcecao(e.target.checked)} disabled={salvando} />
            <span>
              São {ids.length} assentos e o limite do evento é {evento.limitePorPessoa} por pessoa. Confirmo esta exceção.
            </span>
          </label>
        )}
        {erroGeral && (
          <div className="erro-inline" role="alert">
            <AlertTriangle /> {erroGeral}
          </div>
        )}
        <p className="nota-lgpd">Dados usados apenas para controle de acesso ao evento. Acesso restrito à equipe autorizada.</p>
      </form>
    </Modal>
  );
}
