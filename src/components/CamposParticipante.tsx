import type { DadosReserva } from "../data/reservas";
import type { TipoUsuario } from "../types";

export interface FormParticipante {
  nome: string;
  ra: string;
  tipoUsuario: TipoUsuario;
  telefone: string;
  email: string;
  observacao: string;
}
export const formVazio: FormParticipante = { nome: "", ra: "", tipoUsuario: "responsavel", telefone: "", email: "", observacao: "" };
export type ErrosParticipante = Partial<Record<keyof FormParticipante, string>>;

export function validarParticipante(f: FormParticipante): ErrosParticipante {
  const e: ErrosParticipante = {};
  if (f.nome.trim().length < 3) e.nome = "Informe o nome completo.";
  if (!/^[A-Za-z0-9.\-]{3,20}$/.test(f.ra.trim())) e.ra = "Informe o R.A. (3 a 20 letras ou números).";
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "E-mail inválido.";
  if (f.telefone.trim() && f.telefone.replace(/\D/g, "").length < 8) e.telefone = "Telefone incompleto.";
  if (f.observacao.length > 300) e.observacao = "Máximo de 300 caracteres.";
  return e;
}
export const paraDados = (f: FormParticipante): DadosReserva => ({
  nome: f.nome.trim().replace(/\s+/g, " "),
  ra: f.ra.trim(),
  tipoUsuario: f.tipoUsuario,
  telefone: f.telefone.trim() || undefined,
  email: f.email.trim().toLowerCase() || undefined,
  observacao: f.observacao.trim() || undefined,
});

interface Props {
  valor: FormParticipante;
  erros: ErrosParticipante;
  onChange: (f: FormParticipante) => void;
  desabilitado?: boolean;
}

export function CamposParticipante({ valor, erros, onChange, desabilitado }: Props) {
  const set = <K extends keyof FormParticipante>(k: K, v: FormParticipante[K]) => onChange({ ...valor, [k]: v });
  return (
    <div className="campos">
      <label>
        Nome completo *
        <input value={valor.nome} onChange={(e) => set("nome", e.target.value)} disabled={desabilitado} autoComplete="off" aria-invalid={Boolean(erros.nome)} />
        {erros.nome && <small className="campo-erro">{erros.nome}</small>}
      </label>
      <div className="form-grid">
        <label>
          R.A. *
          <input value={valor.ra} onChange={(e) => set("ra", e.target.value)} disabled={desabilitado} autoComplete="off" aria-invalid={Boolean(erros.ra)} />
          {erros.ra && <small className="campo-erro">{erros.ra}</small>}
        </label>
        <label>
          Tipo de usuário *
          <select value={valor.tipoUsuario} onChange={(e) => set("tipoUsuario", e.target.value as TipoUsuario)} disabled={desabilitado}>
            <option value="responsavel">Responsável</option>
            <option value="aluno">Aluno</option>
          </select>
        </label>
      </div>
      <div className="form-grid">
        <label>
          Telefone
          <input value={valor.telefone} onChange={(e) => set("telefone", e.target.value)} disabled={desabilitado} inputMode="tel" autoComplete="off" aria-invalid={Boolean(erros.telefone)} />
          {erros.telefone && <small className="campo-erro">{erros.telefone}</small>}
        </label>
        <label>
          E-mail
          <input value={valor.email} onChange={(e) => set("email", e.target.value)} disabled={desabilitado} type="email" autoComplete="off" aria-invalid={Boolean(erros.email)} />
          {erros.email && <small className="campo-erro">{erros.email}</small>}
        </label>
      </div>
      <label>
        Observação
        <textarea rows={2} value={valor.observacao} onChange={(e) => set("observacao", e.target.value)} disabled={desabilitado} maxLength={300} />
        {erros.observacao && <small className="campo-erro">{erros.observacao}</small>}
      </label>
    </div>
  );
}
