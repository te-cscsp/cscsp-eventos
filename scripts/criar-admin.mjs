// Cria (ou atualiza) um usuário da gestão: conta no Firebase Auth + documento users/{uid}.
// Uso:  node scripts/criar-admin.mjs email@colegio.com.br "Nome Sobrenome" [administrator|operator|production]
// Requer credenciais de serviço: defina GOOGLE_APPLICATION_CREDENTIALS (arquivo JSON da conta de serviço)
// e GCLOUD_PROJECT (ID do projeto). Nunca versione o arquivo JSON.
import { randomBytes } from "node:crypto";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const [, , email, nome, papel = "administrator"] = process.argv;
const PAPEIS = ["administrator", "operator", "production"];

if (!email || !nome || !PAPEIS.includes(papel)) {
  console.error('Uso: node scripts/criar-admin.mjs email@exemplo.com "Nome Completo" [administrator|operator|production]');
  process.exit(1);
}
const emulador = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const projectId = process.env.GCLOUD_PROJECT || (emulador ? "demo-teatro-cscsp" : undefined);
if (!projectId) {
  console.error("Defina GCLOUD_PROJECT com o ID do projeto Firebase.");
  process.exit(1);
}
if (!emulador && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("Defina GOOGLE_APPLICATION_CREDENTIALS com o caminho do JSON da conta de serviço.");
  process.exit(1);
}

initializeApp(emulador ? { projectId } : { projectId, credential: applicationDefault() });
const auth = getAuth();
const db = getFirestore();

let usuario;
try {
  usuario = await auth.getUserByEmail(email);
  console.log("Conta já existia no Auth; atualizando o perfil.");
} catch (e) {
  if (e.code !== "auth/user-not-found") throw e;
  // senha aleatória descartada: a pessoa define a própria senha pelo link de redefinição
  usuario = await auth.createUser({ email, displayName: nome, password: randomBytes(24).toString("base64url") });
  console.log("Conta criada no Auth.");
}

await db.doc(`users/${usuario.uid}`).set({ nome, email, papel, ativo: true, atualizadoEm: Date.now() }, { merge: true });
console.log(`Perfil gravado: ${nome} <${email}> · papel: ${papel} · uid: ${usuario.uid}`);

try {
  const link = await auth.generatePasswordResetLink(email);
  console.log("\nEnvie este link para a pessoa definir a senha (uso único, não compartilhe em canais abertos):\n" + link);
} catch {
  console.log('\nNão foi possível gerar o link. Peça para a pessoa usar "Esqueci minha senha" na tela de login.');
}
