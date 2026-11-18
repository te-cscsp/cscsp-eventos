import { useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { Modal } from "./Modal";

interface Props {
  titulo: string;
  texto: ReactNode;
  confirmar: string;
  perigo?: boolean;
  onConfirmar: () => Promise<void> | void;
  onCancelar: () => void;
}

export function ConfirmDialog({ titulo, texto, confirmar, perigo, onConfirmar, onCancelar }: Props) {
  const [salvando, setSalvando] = useState(false);
  const executar = async () => {
    setSalvando(true);
    try {
      await onConfirmar();
    } finally {
      setSalvando(false);
    }
  };
  return (
    <Modal
      titulo={titulo}
      onFechar={onCancelar}
      travado={salvando}
      rodape={
        <>
          <button className="button button-outline" onClick={onCancelar} disabled={salvando}>
            Voltar
          </button>
          <button className={`button ${perigo ? "button-danger" : "button-primary"}`} onClick={executar} disabled={salvando}>
            {salvando && <LoaderCircle className="spinner" />} {confirmar}
          </button>
        </>
      }
    >
      <div className="confirm-texto">{texto}</div>
    </Modal>
  );
}
