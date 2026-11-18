import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ouvirEventos } from "../data/eventos";
import type { Evento } from "../types";

interface EventoState {
  eventos: Evento[];
  carregando: boolean;
  erro: string | null;
  eventoId: string | null;
  evento: Evento | null;
  selecionar: (id: string) => void;
}

const Ctx = createContext<EventoState | null>(null);
const CHAVE = "teatro:eventoSelecionado";

function escolhaInicial(lista: Evento[], salvo: string | null): string | null {
  if (salvo && lista.some((e) => e.id === salvo)) return salvo;
  const hoje = new Date().toISOString().slice(0, 10);
  const futuros = lista.filter((e) => e.status === "published" && e.data >= hoje).sort((a, b) => a.data.localeCompare(b.data));
  return futuros[0]?.id ?? lista[0]?.id ?? null;
}

export function EventoProvider({ children }: { children: ReactNode }) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [eventoId, setEventoId] = useState<string | null>(null);

  useEffect(
    () =>
      ouvirEventos(
        (lista) => {
          setEventos(lista);
          setErro(null);
          setCarregando(false);
          setEventoId((atual) => (atual && lista.some((e) => e.id === atual) ? atual : escolhaInicial(lista, localStorage.getItem(CHAVE))));
        },
        () => {
          setErro("Não foi possível carregar os eventos. Verifique sua conexão e permissões.");
          setCarregando(false);
        },
      ),
    [],
  );

  const selecionar = useCallback((id: string) => {
    setEventoId(id);
    try {
      localStorage.setItem(CHAVE, id);
    } catch {
      /* armazenamento indisponível: segue sem lembrar */
    }
  }, []);

  const valor = useMemo(
    () => ({ eventos, carregando, erro, eventoId, evento: eventos.find((e) => e.id === eventoId) ?? null, selecionar }),
    [eventos, carregando, erro, eventoId, selecionar],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useEventos(): EventoState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useEventos fora do EventoProvider");
  return v;
}
