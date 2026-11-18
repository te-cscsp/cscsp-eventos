// SOMENTE EMULADOR: cria usuários, eventos e reservas FICTÍCIOS para testar a gestão.
// Pré-requisito: `npm run emulators` rodando em outro terminal. Uso: npm run dados:teste
import { readFileSync } from "node:fs";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Força o emulador: este script nunca fala com a nuvem.
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
initializeApp({ projectId: "demo-teatro-cscsp" });
const auth = getAuth();
const db = getFirestore();

const layout = JSON.parse(readFileSync(new URL("../src/lib/layout-teatro.json", import.meta.url), "utf-8"));
const padrao = Object.fromEntries(layout.assentos.map((a) => [a.id, a.tipo]));
const agora = Date.now();

const usuarios = [
  { email: "admin@exemplo.test", nome: "Admin Teste", papel: "administrator" },
  { email: "operador@exemplo.test", nome: "Operador Teste", papel: "operator" },
  { email: "producao@exemplo.test", nome: "Produção Teste", papel: "production" },
];
for (const u of usuarios) {
  let rec;
  try {
    rec = await auth.getUserByEmail(u.email);
  } catch {
    rec = await auth.createUser({ email: u.email, password: "teste1234", displayName: u.nome });
  }
  await db.doc(`users/${rec.uid}`).set({ nome: u.nome, email: u.email, papel: u.papel, ativo: true });
}

const hoje = new Date();
const dia = (n) => new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + n).toISOString().slice(0, 10);
const eventos = [
  { id: "evento-teste-1", titulo: "Apresentação de Fim de Ano (TESTE)", data: dia(14), horario: "19:30", status: "published" },
  { id: "evento-teste-2", titulo: "Cantata de Natal (TESTE)", data: dia(21), horario: "20:00", status: "draft" },
];
for (const e of eventos) {
  await db.doc(`events/${e.id}`).set({ ...e, descricao: "Evento fictício para testes.", local: "Teatro CSCSP", limitePorPessoa: 4, gratuito: true, criadoEm: agora, atualizadoEm: agora });
}

const idEv = "evento-teste-1";
const seat = (id, extra) => db.doc(`events/${idEv}/seats/${id}`).set({ classe: padrao[id], ocupado: false, atualizadoEm: agora, ...extra });
for (const id of ["A01", "A03", "A02"]) await seat(id, { classe: "equipe" });
await seat("B01", { classe: "bloqueado" });

const nomes = ["Pessoa Teste Alfa", "Pessoa Teste Beta", "Pessoa Teste Gama", "Pessoa Teste Delta", "Pessoa Teste Épsilon", "Pessoa Teste Zeta"];
const grupos = [["C08", "C10"], ["D01"], ["F02", "F04", "F06"], ["H27"], ["J02"], ["O01"]]; // J02 é prioritário; O01 é PcD
for (let i = 0; i < grupos.length; i++) {
  const codigo = `TCS-TESTE${i + 1}`;
  const seatIds = grupos[i];
  await db.doc(`reservations/${codigo}`).set({
    eventId: idEv, seatIds, nome: nomes[i], ra: `TESTE${String(i + 1).padStart(3, "0")}`,
    tipoUsuario: i % 2 === 0 ? "responsavel" : "aluno", email: `teste${i + 1}@exemplo.test`,
    status: i === 3 ? "checked_in" : "confirmed", origem: "interno",
    criadoPor: "script", criadoPorNome: "Dados de teste", criadoEm: agora - i * 3600_000, atualizadoEm: agora,
    historico: [{ acao: "criada", uid: "script", nome: "Dados de teste", quando: agora - i * 3600_000, resumo: `Reserva criada: ${seatIds.join(", ")}` }],
  });
  for (const id of seatIds) await seat(id, { ocupado: true, reservaId: codigo });
}

console.log("Dados de teste criados no emulador.");
console.log("Logins (senha: teste1234): admin@exemplo.test · operador@exemplo.test · producao@exemplo.test");
