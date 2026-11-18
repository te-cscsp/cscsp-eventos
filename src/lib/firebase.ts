import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// `npm run dev:emulador` usa o Emulator Suite (dados fictícios, nada vai para a nuvem).
export const usandoEmulador = import.meta.env.MODE === "emulador";

const config = usandoEmulador
  ? { apiKey: "demo-key", authDomain: "localhost", projectId: "demo-teatro-cscsp", appId: "demo-app" }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
      appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
    };

export const configuracaoOk = usandoEmulador || Boolean(config.apiKey && config.projectId);

const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (usandoEmulador) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
