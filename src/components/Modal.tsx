import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  titulo: string;
  subtitulo?: string;
  onFechar: () => void;
  children: ReactNode;
  rodape?: ReactNode;
  largo?: boolean;
  /** impede fechar com Esc/clique fora (ex.: enquanto salva) */
  travado?: boolean;
}

export function Modal({ titulo, subtitulo, onFechar, children, rodape, largo, travado }: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  const anterior = useRef<Element | null>(null);

  useEffect(() => {
    anterior.current = document.activeElement;
    const primeiro = caixa.current?.querySelector<HTMLElement>("input,select,textarea,button:not(.modal-x)");
    (primeiro ?? caixa.current)?.focus();
    const sobrescrito = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = sobrescrito;
      if (anterior.current instanceof HTMLElement) anterior.current.focus();
    };
  }, []);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !travado) onFechar();
      if (e.key === "Tab" && caixa.current) {
        const foco = caixa.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[href],[tabindex]:not([tabindex="-1"])');
        if (foco.length === 0) return;
        const a = foco[0];
        const z = foco[foco.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [onFechar, travado]);

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && !travado && onFechar()}>
      <div className={`modal ${largo ? "modal-largo" : ""}`} role="dialog" aria-modal="true" aria-label={titulo} ref={caixa} tabIndex={-1}>
        <header className="modal-topo">
          <div>
            <h2>{titulo}</h2>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <button className="modal-x" onClick={onFechar} disabled={travado} aria-label="Fechar">
            <X />
          </button>
        </header>
        <div className="modal-corpo">{children}</div>
        {rodape && <footer className="modal-rodape">{rodape}</footer>}
      </div>
    </div>
  );
}
