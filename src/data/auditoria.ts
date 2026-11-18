import { addDoc, collection } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Usuario } from "../types";

/** Registra ações sensíveis. Falhas aqui nunca bloqueiam a operação principal. */
export async function registrar(usuario: Usuario, acao: string, entidade: string, resumo: string): Promise<void> {
  try {
    await addDoc(collection(db, "auditLog"), {
      uid: usuario.uid,
      nome: usuario.nome,
      acao,
      entidade,
      resumo,
      quando: Date.now(),
    });
  } catch (e) {
    console.warn("Não foi possível registrar a auditoria:", e);
  }
}
