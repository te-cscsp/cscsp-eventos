import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useEventos } from "../context/EventoContext";
import { diaMes, dataLonga } from "../lib/format";
import { ROTULO_STATUS_EVENTO } from "../types";

/** Seletor de evento do Figma (cartão com data + "Trocar evento"). */
export function EventoSelector() {
  const { eventos, evento, selecionar } = useEventos();
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => !raiz.current?.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  if (!evento) return null;
  const { dia, mes } = diaMes(evento.data);
  return (
    <div className="event-selector" ref={raiz}>
      <div className="mini-date">
        <strong>{dia}</strong>
        <span>{mes}</span>
      </div>
      <div>
        <small>EVENTO SELECIONADO</small>
        <strong>{evento.titulo}</strong>
        <span>
          {dataLonga(evento.data, evento.horario)} · {ROTULO_STATUS_EVENTO[evento.status]}
        </span>
      </div>
      {eventos.length > 1 && (
        <button onClick={() => setAberto(!aberto)} aria-haspopup="listbox" aria-expanded={aberto}>
          Trocar evento <ChevronDown />
        </button>
      )}
      {aberto && (
        <ul className="event-menu" role="listbox" aria-label="Eventos">
          {eventos.map((e) => (
            <li key={e.id}>
              <button
                role="option"
                aria-selected={e.id === evento.id}
                className={e.id === evento.id ? "ativo" : ""}
                onClick={() => {
                  selecionar(e.id);
                  setAberto(false);
                }}
              >
                <strong>{e.titulo}</strong>
                <small>
                  {dataLonga(e.data, e.horario)} · {ROTULO_STATUS_EVENTO[e.status]}
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
