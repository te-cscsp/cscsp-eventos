import { Accessibility, X } from "lucide-react";

export function Legend({ mostrarSelecionado = true }: { mostrarSelecionado?: boolean }) {
  return (
    <div className="legend" aria-label="Legenda do mapa">
      <span>
        <i className="available" /> Disponível
      </span>
      {mostrarSelecionado && (
        <span>
          <i className="selected" /> Selecionado
        </span>
      )}
      <span>
        <i className="occupied" /> Reservado
      </span>
      <span>
        <i className="preferred">P</i> Prioritário
      </span>
      <span>
        <i className="pcd">
          <Accessibility size={11} />
        </i>{" "}
        PcD
      </span>
      <span>
        <i className="team">
          <X size={11} />
        </i>{" "}
        Equipe
      </span>
      <span>
        <i className="blocked" /> Bloqueado
      </span>
    </div>
  );
}
