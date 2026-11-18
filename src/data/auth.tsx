import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { PAPEIS, type Papel, type Usuario } from "../types";

interface AuthState {
  carregando: boolean;
  user: User | null;
  /** null = sem sessão ou sem acesso liberado (documento users/{uid} ausente ou inativo) */
  perfil: Usuario | null;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  recuperarSenha: (email: string) => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setCarregando(true);
        setUser(u);
        if (!u) {
          setPerfil(null);
          setCarregando(false);
          return;
        }
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          const d = snap.data();
          if (snap.exists() && d && d.ativo === true && PAPEIS.includes(d.papel as Papel)) {
            setPerfil({ uid: u.uid, nome: String(d.nome || u.email || "Usuário"), email: u.email || "", papel: d.papel as Papel });
          } else {
            setPerfil(null);
          }
        } catch {
          setPerfil(null);
        } finally {
          setCarregando(false);
        }
      }),
    [],
  );

  const entrar = useCallback(async (email: string, senha: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), senha);
  }, []);
  const sair = useCallback(async () => {
    await signOut(auth);
  }, []);
  const recuperarSenha = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const valor = useMemo(
    () => ({ carregando, user, perfil, entrar, sair, recuperarSenha }),
    [carregando, user, perfil, entrar, sair, recuperarSenha],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth fora do AuthProvider");
  return v;
}

/** Perfil garantido (use só dentro de rotas protegidas). */
export function usePerfil(): Usuario {
  const { perfil } = useAuth();
  if (!perfil) throw new Error("Sem perfil de usuário");
  return perfil;
}

export function mensagemErroAuth(e: unknown): string {
  const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "E-mail ou senha incorretos.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    case "auth/network-request-failed":
      return "Sem conexão. Verifique a internet e tente novamente.";
    case "auth/user-disabled":
      return "Este acesso foi desativado. Procure a administração.";
    default:
      return "Não foi possível entrar agora. Tente novamente.";
  }
}
