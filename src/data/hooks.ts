import { useEffect, useState } from "react";
import type { AssentoEvento, Reserva } from "../types";
import { ouvirAssentos } from "./assentos";
import { ouvirReservas } from "./reservas";

export function useAssentos(eventId: string | null) {
  const [docs, setDocs] = useState<Map<string, AssentoEvento>>(new Map());
  const [carregando, setCarregando] = useState(Boolean(eventId));
  const [erro, setErro] = useState<string | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<number | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    setDocs(new Map());
    setErro(null);
    if (!eventId) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    return ouvirAssentos(
      eventId,
      (m) => {
        setDocs(m);
        setCarregando(false);
        setAtualizadoEm(Date.now());
      },
      () => {
        setErro("Não foi possível carregar o mapa deste evento.");
        setCarregando(false);
      },
    );
  }, [eventId, tentativa]);

  return { docs, carregando, erro, atualizadoEm, recarregar: () => setTentativa((t) => t + 1) };
}

/** `habilitado` = false para perfis sem acesso a dados pessoais (nem tenta ler). */
export function useReservas(eventId: string | null, habilitado: boolean) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [carregando, setCarregando] = useState(Boolean(eventId) && habilitado);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    setReservas([]);
    setErro(null);
    if (!eventId || !habilitado) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    return ouvirReservas(
      eventId,
      (r) => {
        setReservas(r);
        setCarregando(false);
      },
      () => {
        setErro("Não foi possível carregar as reservas.");
        setCarregando(false);
      },
    );
  }, [eventId, habilitado, tentativa]);

  return { reservas, carregando, erro, recarregar: () => setTentativa((t) => t + 1) };
}
