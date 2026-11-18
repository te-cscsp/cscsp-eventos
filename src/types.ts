export type Papel = "administrator" | "operator" | "production";
export const PAPEIS: Papel[] = ["administrator", "operator", "production"];
export const ROTULO_PAPEL: Record<Papel, string> = {
  administrator: "Administrador(a)",
  operator: "Operador(a) de eventos",
  production: "Produção",
};

export type EventoStatus = "draft" | "published" | "closed" | "cancelled";
export const ROTULO_STATUS_EVENTO: Record<EventoStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  closed: "Encerrado",
  cancelled: "Cancelado",
};

/** Classe do assento em um evento (o que a gestão configura). */
export type Classe = "normal" | "preferencial" | "pcd" | "equipe" | "bloqueado";

export type ReservaStatus = "pending" | "confirmed" | "cancelled" | "expired" | "checked_in";
export const ROTULO_STATUS_RESERVA: Record<ReservaStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  expired: "Expirada",
  checked_in: "Check-in feito",
};

export type TipoUsuario = "aluno" | "responsavel";
export const ROTULO_TIPO: Record<TipoUsuario, string> = { aluno: "Aluno", responsavel: "Responsável" };

export interface Usuario {
  uid: string;
  nome: string;
  email: string;
  papel: Papel;
}

export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  data: string; // AAAA-MM-DD
  horario: string; // HH:mm
  local: string;
  status: EventoStatus;
  limitePorPessoa: number;
  gratuito: boolean;
  capaAlt?: string;
  criadoEm: number;
  atualizadoEm: number;
}

/** Documento esparso: só existe para assentos reservados ou com classe diferente do layout. */
export interface AssentoEvento {
  id: string;
  classe: Classe;
  ocupado: boolean;
  reservaId?: string;
}

export interface HistoricoItem {
  acao: string;
  uid: string;
  nome: string;
  quando: number;
  resumo: string;
}

export interface Reserva {
  id: string; // código da reserva
  eventId: string;
  seatIds: string[];
  nome: string;
  ra: string;
  tipoUsuario: TipoUsuario;
  telefone?: string;
  email?: string;
  observacao?: string;
  status: ReservaStatus;
  origem: "interno" | "publico";
  criadoPor: string;
  criadoPorNome: string;
  criadoEm: number;
  atualizadoEm: number;
  checkedInEm?: number;
  historico: HistoricoItem[];
}

export class ErroNegocio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroNegocio";
  }
}
