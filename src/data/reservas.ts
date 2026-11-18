import {
  arrayUnion,
  collection,
  deleteField,
  doc,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { classePadrao } from "../lib/layout";
import { ordenarAssentos } from "../lib/format";
import {
  ErroNegocio,
  type Classe,
  type HistoricoItem,
  type Reserva,
  type ReservaStatus,
  type TipoUsuario,
  type Usuario,
} from "../types";
import { registrar } from "./auditoria";

export interface DadosReserva {
  nome: string;
  ra: string;
  tipoUsuario: TipoUsuario;
  telefone?: string;
  email?: string;
  observacao?: string;
}

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem O/0/I/1 para evitar confusão
function gerarCodigo(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return "TCS-" + Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

function item(usuario: Usuario, acao: string, resumo: string): HistoricoItem {
  return { acao, uid: usuario.uid, nome: usuario.nome, quando: Date.now(), resumo };
}

function paraReserva(id: string, v: Record<string, unknown>): Reserva {
  return {
    id,
    eventId: String(v.eventId ?? ""),
    seatIds: Array.isArray(v.seatIds) ? (v.seatIds as string[]) : [],
    nome: String(v.nome ?? ""),
    ra: String(v.ra ?? ""),
    tipoUsuario: (v.tipoUsuario as TipoUsuario) ?? "responsavel",
    telefone: typeof v.telefone === "string" ? v.telefone : undefined,
    email: typeof v.email === "string" ? v.email : undefined,
    observacao: typeof v.observacao === "string" ? v.observacao : undefined,
    status: (v.status as ReservaStatus) ?? "confirmed",
    origem: v.origem === "publico" ? "publico" : "interno",
    criadoPor: String(v.criadoPor ?? ""),
    criadoPorNome: String(v.criadoPorNome ?? ""),
    criadoEm: Number(v.criadoEm ?? 0),
    atualizadoEm: Number(v.atualizadoEm ?? 0),
    checkedInEm: typeof v.checkedInEm === "number" ? v.checkedInEm : undefined,
    historico: Array.isArray(v.historico) ? (v.historico as HistoricoItem[]) : [],
  };
}

export function ouvirReservas(eventId: string, aoMudar: (r: Reserva[]) => void, aoErro: (e: Error) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "reservations"), where("eventId", "==", eventId)),
    (snap) => aoMudar(snap.docs.map((d) => paraReserva(d.id, d.data())).sort((a, b) => b.criadoEm - a.criadoEm)),
    aoErro,
  );
}

const semVazios = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ""));

/**
 * Cria a reserva e ocupa os assentos na MESMA transação.
 * Se alguém reservou um dos assentos no meio tempo, nada é gravado.
 */
export async function criarReserva(
  eventId: string,
  tituloEvento: string,
  dados: DadosReserva,
  seatIds: string[],
  usuario: Usuario,
): Promise<string> {
  const ids = ordenarAssentos(seatIds);
  if (ids.length === 0) throw new ErroNegocio("Selecione ao menos um assento.");
  const codigo = gerarCodigo();
  const agora = Date.now();
  await runTransaction(db, async (tx) => {
    const eventoRef = doc(db, "events", eventId);
    const reservaRef = doc(db, "reservations", codigo);
    const seatRefs = ids.map((id) => doc(db, "events", eventId, "seats", id));
    const [evSnap, resSnap, ...seatSnaps] = await Promise.all([tx.get(eventoRef), tx.get(reservaRef), ...seatRefs.map((r) => tx.get(r))]);
    if (!evSnap.exists()) throw new ErroNegocio("Evento não encontrado.");
    const st = evSnap.data().status;
    if (st === "closed" || st === "cancelled") throw new ErroNegocio("Este evento não aceita novas reservas.");
    if (resSnap.exists()) throw new ErroNegocio("Código de reserva repetido. Tente novamente.");
    const classes: Classe[] = seatSnaps.map((s, i) => {
      const d = s.exists() ? s.data() : null;
      const classe = (d?.classe as Classe | undefined) ?? classePadrao(ids[i]);
      if (d?.ocupado === true) throw new ErroNegocio(`O assento ${ids[i]} acabou de ser reservado por outra pessoa. Escolha outro.`);
      if (classe === "equipe" || classe === "bloqueado") throw new ErroNegocio(`O assento ${ids[i]} não está disponível para reserva.`);
      return classe;
    });
    tx.set(reservaRef, {
      ...semVazios({ ...dados }),
      eventId,
      seatIds: ids,
      status: "confirmed",
      origem: "interno",
      criadoPor: usuario.uid,
      criadoPorNome: usuario.nome,
      criadoEm: agora,
      atualizadoEm: agora,
      historico: [item(usuario, "criada", `Reserva criada: ${ids.join(", ")}`)],
    });
    seatRefs.forEach((r, i) =>
      tx.set(r, { classe: classes[i], ocupado: true, reservaId: codigo, atualizadoPor: usuario.uid, atualizadoEm: agora }),
    );
  });
  await registrar(usuario, "reserva.criar", `reservations/${codigo}`, `${tituloEvento}: ${ids.join(", ")}`);
  return codigo;
}

export async function cancelarReserva(reserva: Reserva, motivo: string, usuario: Usuario): Promise<void> {
  if (reserva.status === "cancelled") return;
  const agora = Date.now();
  await runTransaction(db, async (tx) => {
    const reservaRef = doc(db, "reservations", reserva.id);
    const seatRefs = reserva.seatIds.map((id) => doc(db, "events", reserva.eventId, "seats", id));
    const [resSnap, ...seatSnaps] = await Promise.all([tx.get(reservaRef), ...seatRefs.map((r) => tx.get(r))]);
    if (!resSnap.exists()) throw new ErroNegocio("Reserva não encontrada.");
    if (resSnap.data().status === "cancelled") throw new ErroNegocio("Esta reserva já foi cancelada.");
    seatSnaps.forEach((s, i) => {
      // só libera o assento se ele ainda pertence a esta reserva
      if (s.exists() && s.data().reservaId === reserva.id) {
        tx.update(seatRefs[i], { ocupado: false, reservaId: deleteField(), atualizadoPor: usuario.uid, atualizadoEm: agora });
      }
    });
    tx.update(reservaRef, {
      status: "cancelled",
      atualizadoEm: agora,
      historico: arrayUnion(item(usuario, "cancelada", motivo ? `Cancelada: ${motivo}` : "Cancelada")),
    });
  });
  await registrar(usuario, "reserva.cancelar", `reservations/${reserva.id}`, reserva.seatIds.join(", "));
}

export async function mudarCheckIn(reserva: Reserva, fazer: boolean, usuario: Usuario): Promise<void> {
  if (fazer && reserva.status !== "confirmed") throw new ErroNegocio("Só reservas confirmadas podem fazer check-in.");
  if (!fazer && reserva.status !== "checked_in") return;
  const agora = Date.now();
  await updateDoc(doc(db, "reservations", reserva.id), {
    status: fazer ? "checked_in" : "confirmed",
    checkedInEm: fazer ? agora : deleteField(),
    atualizadoEm: agora,
    historico: arrayUnion(item(usuario, fazer ? "check-in" : "check-in desfeito", fazer ? "Check-in realizado" : "Check-in desfeito")),
  });
  await registrar(usuario, fazer ? "reserva.checkin" : "reserva.checkin_desfeito", `reservations/${reserva.id}`, reserva.nome);
}

export async function atualizarDados(reserva: Reserva, dados: DadosReserva, usuario: Usuario): Promise<void> {
  const agora = Date.now();
  await updateDoc(doc(db, "reservations", reserva.id), {
    nome: dados.nome,
    ra: dados.ra,
    tipoUsuario: dados.tipoUsuario,
    telefone: dados.telefone ? dados.telefone : deleteField(),
    email: dados.email ? dados.email : deleteField(),
    observacao: dados.observacao ? dados.observacao : deleteField(),
    atualizadoEm: agora,
    historico: arrayUnion(item(usuario, "editada", "Dados do participante atualizados")),
  });
  await registrar(usuario, "reserva.editar", `reservations/${reserva.id}`, reserva.id);
}
