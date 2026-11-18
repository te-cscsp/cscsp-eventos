import { collection, doc, onSnapshot, runTransaction, type Unsubscribe } from "firebase/firestore";
import { db } from "../lib/firebase";
import { classePadrao, ROTULO_CLASSE } from "../lib/layout";
import { ErroNegocio, type AssentoEvento, type Classe, type Usuario } from "../types";
import { registrar } from "./auditoria";

/** Escuta os assentos "fora do padrão" do evento (reservados ou com classe alterada). */
export function ouvirAssentos(
  eventId: string,
  aoMudar: (docs: Map<string, AssentoEvento>) => void,
  aoErro: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, "events", eventId, "seats"),
    (snap) => {
      const mapa = new Map<string, AssentoEvento>();
      snap.forEach((d) => {
        const v = d.data();
        mapa.set(d.id, {
          id: d.id,
          classe: v.classe as Classe,
          ocupado: v.ocupado === true,
          reservaId: typeof v.reservaId === "string" ? v.reservaId : undefined,
        });
      });
      aoMudar(mapa);
    },
    aoErro,
  );
}

/**
 * Salva a classificação dos assentos em UMA transação (tudo ou nada).
 * Recusa bloquear assentos que têm reserva ativa.
 */
export async function salvarClasses(
  eventId: string,
  mudancas: Record<string, Classe>,
  usuario: Usuario,
  tituloEvento: string,
): Promise<number> {
  const ids = Object.keys(mudancas);
  if (ids.length === 0) return 0;
  if (ids.length > 450) throw new ErroNegocio("Muitas alterações de uma vez. Salve em partes.");
  const agora = Date.now();
  await runTransaction(db, async (tx) => {
    const refs = ids.map((id) => doc(db, "events", eventId, "seats", id));
    const snaps = await Promise.all(refs.map((r) => tx.get(r)));
    snaps.forEach((s, i) => {
      const atual = s.exists() ? s.data() : null;
      const nova = mudancas[ids[i]];
      if (atual?.ocupado === true && (nova === "equipe" || nova === "bloqueado")) {
        throw new ErroNegocio(
          `O assento ${ids[i]} tem uma reserva ativa e não pode ser marcado como "${ROTULO_CLASSE[nova]}". Cancele a reserva antes.`,
        );
      }
    });
    snaps.forEach((s, i) => {
      const atual = s.exists() ? s.data() : null;
      const ocupado = atual?.ocupado === true;
      const nova = mudancas[ids[i]];
      if (!ocupado && nova === classePadrao(ids[i])) {
        if (s.exists()) tx.delete(refs[i]); // volta ao padrão do layout: documento some
        return;
      }
      const corpo: Record<string, unknown> = { classe: nova, ocupado, atualizadoPor: usuario.uid, atualizadoEm: agora };
      if (ocupado && typeof atual?.reservaId === "string") corpo.reservaId = atual.reservaId;
      tx.set(refs[i], corpo);
    });
  });
  await registrar(usuario, "mapa.salvar", `events/${eventId}`, `${tituloEvento}: ${ids.length} assento(s) reclassificado(s)`);
  return ids.length;
}
