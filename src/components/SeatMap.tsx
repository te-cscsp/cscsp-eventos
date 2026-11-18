import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Accessibility, Grid3X3, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import {
  FILEIRAS,
  MAX_DISTANCIA,
  ROTULO_CLASSE,
  assentoNaPosicao,
  classePadrao,
  visualDoAssento,
  type AssentoLayout,
  type Lado,
} from "../lib/layout";
import type { AssentoEvento, Classe } from "../types";

const LARG_ASSENTO = 35;
const GAP = 7;
const GRUPO = MAX_DISTANCIA * LARG_ASSENTO + (MAX_DISTANCIA - 1) * GAP;
const LARGURA = GRUPO * 2 + 25 * 2 + 58 + 5 * 4 + 40;
const ALTURA = 90 + 22 + FILEIRAS.length * 35 + 40;
const COLUNAS = `25px ${GRUPO}px 58px ${GRUPO}px 25px`;

interface SeatProps {
  assento: AssentoLayout;
  classe: Classe;
  ocupado: boolean;
  selecionado: boolean;
  alterado: boolean;
  onClick: (id: string) => void;
}

const Seat = memo(function Seat({ assento, classe, ocupado, selecionado, alterado, onClick }: SeatProps) {
  const visual = visualDoAssento(classe, ocupado);
  const pcd = classe === "pcd";
  const estado = ocupado ? "reservado" : selecionado ? "selecionado" : classe === "equipe" || classe === "bloqueado" ? "indisponível" : "disponível";
  const texto = `Assento ${assento.label}, ${ROTULO_CLASSE[classe].toLowerCase()}, ${estado}${alterado ? ", alteração não salva" : ""}`;
  return (
    <button
      type="button"
      className={`seat ${visual} ${selecionado ? "selected" : ""} ${pcd ? "pcd" : ""} ${alterado ? "alterado" : ""}`}
      onClick={() => onClick(assento.id)}
      title={texto}
      aria-label={texto}
      aria-pressed={selecionado}
    >
      {pcd ? <Accessibility size={13} /> : classe === "equipe" ? <X size={12} /> : assento.numero}
    </button>
  );
});

interface Props {
  docs: Map<string, AssentoEvento>;
  /** alterações ainda não salvas (editor) */
  rascunho?: Record<string, Classe>;
  selecionados: Set<string>;
  onAssento: (id: string) => void;
  onFileira?: (fileira: string) => void;
  editor?: boolean;
}

export function SeatMap({ docs, rascunho, selecionados, onAssento, onFileira, editor }: Props) {
  const [zoom, setZoom] = useState(0.7);
  const viewport = useRef<HTMLDivElement>(null);

  const ajustar = useCallback(() => {
    const w = viewport.current?.clientWidth;
    if (w) setZoom(Math.min(1, Math.max(0.4, (w - 40) / LARGURA)));
  }, []);
  useEffect(() => {
    ajustar();
  }, [ajustar]);

  const renderLado = (fileira: string, lado: Lado) => {
    const dists = Array.from({ length: MAX_DISTANCIA }, (_, i) => i + 1);
    if (lado === "esquerdo") dists.reverse();
    return (
      <div className="seat-group">
        {dists.map((d) => {
          const a = assentoNaPosicao(fileira, lado, d);
          if (!a) return <span className="seat-gap" key={`${lado}${d}`} aria-hidden="true" />;
          const doc = docs.get(a.id);
          const alterado = rascunho !== undefined && a.id in rascunho;
          const classe = rascunho?.[a.id] ?? doc?.classe ?? classePadrao(a.id);
          return (
            <Seat
              key={a.id}
              assento={a}
              classe={classe}
              ocupado={doc?.ocupado === true}
              selecionado={selecionados.has(a.id)}
              alterado={alterado}
              onClick={onAssento}
            />
          );
        })}
      </div>
    );
  };

  const rotuloFileira = (f: string) =>
    onFileira ? (
      <button type="button" className="row-label" onClick={() => onFileira(f)} title={`Selecionar a fileira ${f}`} aria-label={`Selecionar a fileira ${f}`}>
        {f}
      </button>
    ) : (
      <strong>{f}</strong>
    );

  return (
    <div className={`map-shell ${editor ? "editor-map" : ""}`}>
      <div className="map-toolbar">
        <span>
          <Grid3X3 size={16} /> Plateia · {FILEIRAS[0]}–{FILEIRAS[FILEIRAS.length - 1]}
        </span>
        <div>
          <button onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))} aria-label="Diminuir zoom">
            <ZoomOut />
          </button>
          <strong>{Math.round(zoom * 100)}%</strong>
          <button onClick={() => setZoom((z) => Math.min(1.15, z + 0.1))} aria-label="Aumentar zoom">
            <ZoomIn />
          </button>
          <button onClick={ajustar} aria-label="Ajustar à largura">
            <RotateCcw />
          </button>
        </div>
      </div>
      <div className="map-viewport alto" ref={viewport}>
        <div style={{ width: LARGURA * zoom, height: ALTURA * zoom, margin: "0 auto" }}>
          <div className="seat-layout teatro" style={{ width: LARGURA, transform: `scale(${zoom})` }}>
            <div className="stage">
              <span>PALCO</span>
              <small>Frente do teatro</small>
            </div>
            <div className="seat-section-label">PLATEIA · CORREDOR CENTRAL</div>
            {FILEIRAS.map((f) => (
              <div className="seat-row" key={f} style={{ gridTemplateColumns: COLUNAS }}>
                {rotuloFileira(f)}
                {renderLado(f, "esquerdo")}
                <div className="aisle" />
                {renderLado(f, "direito")}
                {rotuloFileira(f)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
