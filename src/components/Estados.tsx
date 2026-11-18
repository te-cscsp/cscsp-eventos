import type { ReactNode } from "react";
import { AlertTriangle, Inbox, LoaderCircle, LockKeyhole } from "lucide-react";

export function Carregando({ texto = "Carregando..." }: { texto?: string }) {
  return (
    <div className="estado" role="status">
      <LoaderCircle className="spinner" />
      <p>{texto}</p>
    </div>
  );
}
export function Erro({ texto, onTentar }: { texto: string; onTentar?: () => void }) {
  return (
    <div className="estado estado-erro" role="alert">
      <AlertTriangle />
      <p>{texto}</p>
      {onTentar && (
        <button className="button button-outline" onClick={onTentar}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
export function Vazio({ titulo, texto, acao }: { titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <div className="estado">
      <Inbox />
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
      {acao}
    </div>
  );
}
export function SemPermissao() {
  return (
    <div className="estado">
      <LockKeyhole />
      <h3>Permissão insuficiente</h3>
      <p>Seu perfil não tem acesso a esta área. Se precisar dela, fale com a administração.</p>
    </div>
  );
}
