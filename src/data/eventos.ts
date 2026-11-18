import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { classePadrao } from "../lib/layout";
import { ErroNegocio, type Classe, type Evento, type EventoStatus, type Usuario } from "../types";
import { registrar } from "./auditoria";

export type DadosEvento = Pick<Evento, "titulo" | "descricao" | "data" | "horario" | "local" | "limitePorPessoa" | "gratuito" | "status"> & {
  capaAlt?: string;
};

function paraEvento(id: string, v: Record<string, unknown>): Evento {
  return {
    id,
    titulo: String(v.titulo ?? ""),
    descricao: String(v.descricao ?? ""),
    data: String(v.data ?? ""),
    horario: String(v.horario ?? ""),
    local: String(v.local ?? "Teatro CSCSP"),
    status: (v.status as EventoStatus) ?? "draft",
    limitePorPessoa: Number(v.limitePorPessoa ?? 4),
    gratuito: v.gratuito !== false,
    capaAlt: typeof v.capaAlt === "string" ? v.capaAlt : undefined,
    criadoEm: Number(v.criadoEm ?? 0),
    atualizadoEm: Number(v.atualizadoEm ?? 0),
  };
}

export function ouvirEventos(aoMudar: (e: Evento[]) => void, aoErro: (e: Error) => void): Unsubscribe {
  return onSnapshot(
    query(collection(db, "events"), orderBy("data", "desc")),
    (snap) => aoMudar(snap.docs.map((d) => paraEvento(d.id, d.data()))),
    aoErro,
  );
}

export async function obterEvento(id: string): Promise<Evento | null> {
  const s = await getDoc(doc(db, "events", id));
  return s.exists() ? paraEvento(s.id, s.data()) : null;
}

export async function obterCapa(eventId: string): Promise<string | null> {
  try {
    const s = await getDoc(doc(db, "events", eventId, "media", "capa"));
    const url = s.data()?.dataUrl;
    return typeof url === "string" ? url : null;
  } catch {
    return null;
  }
}

/** capa: string = nova imagem; null = remover; undefined = não mexer */
export async function salvarEvento(
  id: string | null,
  dados: DadosEvento,
  capa: string | null | undefined,
  usuario: Usuario,
): Promise<string> {
  const agora = Date.now();
  let eventId = id;
  if (id) {
    await updateDoc(doc(db, "events", id), { ...limpar(dados), atualizadoEm: agora });
  } else {
    const ref = await addDoc(collection(db, "events"), { ...limpar(dados), criadoEm: agora, atualizadoEm: agora, criadoPor: usuario.uid });
    eventId = ref.id;
  }
  if (!eventId) throw new Error("Falha ao salvar o evento.");
  if (typeof capa === "string") await setDoc(doc(db, "events", eventId, "media", "capa"), { dataUrl: capa, atualizadoEm: agora });
  else if (capa === null) await deleteDoc(doc(db, "events", eventId, "media", "capa")).catch(() => undefined);
  await registrar(usuario, id ? "evento.editar" : "evento.criar", `events/${eventId}`, `${dados.titulo} (${dados.status})`);
  return eventId;
}

function limpar(d: DadosEvento): Record<string, unknown> {
  const o: Record<string, unknown> = { ...d };
  if (o.capaAlt === undefined) delete o.capaAlt;
  return o;
}

export async function mudarStatus(evento: Evento, status: EventoStatus, usuario: Usuario): Promise<void> {
  await updateDoc(doc(db, "events", evento.id), { status, atualizadoEm: Date.now() });
  await registrar(usuario, "evento.status", `events/${evento.id}`, `${evento.titulo}: ${evento.status} → ${status}`);
}

/** Copia dados, imagem e classificação dos assentos. Não copia reservas. */
export async function duplicarEvento(origem: Evento, usuario: Usuario): Promise<string> {
  const agora = Date.now();
  const ref = await addDoc(collection(db, "events"), {
    titulo: `${origem.titulo} (cópia)`,
    descricao: origem.descricao,
    data: origem.data,
    horario: origem.horario,
    local: origem.local,
    status: "draft",
    limitePorPessoa: origem.limitePorPessoa,
    gratuito: origem.gratuito,
    ...(origem.capaAlt ? { capaAlt: origem.capaAlt } : {}),
    criadoEm: agora,
    atualizadoEm: agora,
    criadoPor: usuario.uid,
  });
  const capa = await obterCapa(origem.id);
  if (capa) await setDoc(doc(db, "events", ref.id, "media", "capa"), { dataUrl: capa, atualizadoEm: agora });
  const seats = await getDocs(collection(db, "events", origem.id, "seats"));
  const batch = writeBatch(db);
  let n = 0;
  seats.forEach((d) => {
    const classe = d.data().classe as Classe;
    if (classe !== classePadrao(d.id)) {
      batch.set(doc(db, "events", ref.id, "seats", d.id), { classe, ocupado: false, atualizadoPor: usuario.uid, atualizadoEm: agora });
      n += 1;
    }
  });
  if (n > 0) await batch.commit();
  await registrar(usuario, "evento.duplicar", `events/${ref.id}`, `Cópia de ${origem.titulo}`);
  return ref.id;
}

export async function contarEvento(eventId: string): Promise<{ reservados: number; bloqueados: number }> {
  const seats = collection(db, "events", eventId, "seats");
  const [r, b] = await Promise.all([
    getCountFromServer(query(seats, where("ocupado", "==", true))),
    getCountFromServer(query(seats, where("classe", "in", ["equipe", "bloqueado"]))),
  ]);
  return { reservados: r.data().count, bloqueados: b.data().count };
}

/** Só rascunhos sem reservas podem ser excluídos. */
export async function excluirRascunho(evento: Evento, usuario: Usuario): Promise<void> {
  if (evento.status !== "draft") throw new ErroNegocio("Só é possível excluir eventos em rascunho.");
  const { reservados } = await contarEvento(evento.id);
  if (reservados > 0) throw new ErroNegocio("Este evento tem reservas e não pode ser excluído.");
  const seats = await getDocs(collection(db, "events", evento.id, "seats"));
  const batch = writeBatch(db);
  seats.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "events", evento.id, "media", "capa"));
  batch.delete(doc(db, "events", evento.id));
  await batch.commit();
  await registrar(usuario, "evento.excluir", `events/${evento.id}`, evento.titulo);
}
