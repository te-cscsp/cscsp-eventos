import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type Tipo = "ok" | "erro" | "info";
interface Item {
  id: number;
  tipo: Tipo;
  titulo: string;
  detalhe?: string;
}
interface ToastApi {
  ok: (titulo: string, detalhe?: string) => void;
  erro: (titulo: string, detalhe?: string) => void;
  info: (titulo: string, detalhe?: string) => void;
}

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<Item[]>([]);
  const seq = useRef(0);
  const fechar = useCallback((id: number) => setItens((l) => l.filter((i) => i.id !== id)), []);
  const adicionar = useCallback(
    (tipo: Tipo, titulo: string, detalhe?: string) => {
      const id = ++seq.current;
      setItens((l) => [...l.slice(-2), { id, tipo, titulo, detalhe }]);
      setTimeout(() => fechar(id), tipo === "erro" ? 8000 : 4500);
    },
    [fechar],
  );
  const api = useMemo<ToastApi>(
    () => ({
      ok: (t, d) => adicionar("ok", t, d),
      erro: (t, d) => adicionar("erro", t, d),
      info: (t, d) => adicionar("info", t, d),
    }),
    [adicionar],
  );
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {itens.map((i) => (
          <div key={i.id} className={`toast toast-${i.tipo}`} role={i.tipo === "erro" ? "alert" : "status"}>
            {i.tipo === "erro" ? <AlertCircle /> : <CheckCircle2 />}
            <div>
              <strong>{i.titulo}</strong>
              {i.detalhe && <span>{i.detalhe}</span>}
            </div>
            <button onClick={() => fechar(i.id)} aria-label="Fechar aviso">
              <X />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast fora do ToastProvider");
  return v;
}
