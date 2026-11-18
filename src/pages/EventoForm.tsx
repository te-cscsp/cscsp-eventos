import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Image as ImageIcon, LoaderCircle, Trash2 } from "lucide-react";
import { AdminPage } from "../components/PageHeader";
import { Carregando, Erro, SemPermissao } from "../components/Estados";
import { useToast } from "../components/Toast";
import { usePerfil } from "../data/auth";
import { obterCapa, obterEvento, salvarEvento, type DadosEvento } from "../data/eventos";
import { comprimirImagem } from "../lib/imagem";
import { podeGerirEventos } from "../lib/permissoes";
import type { Evento, EventoStatus } from "../types";

interface Form {
  titulo: string;
  descricao: string;
  data: string;
  horario: string;
  local: string;
  limitePorPessoa: string;
  gratuito: boolean;
  capaAlt: string;
}
const vazio: Form = { titulo: "", descricao: "", data: "", horario: "", local: "Teatro CSCSP", limitePorPessoa: "4", gratuito: true, capaAlt: "" };
type Erros = Partial<Record<keyof Form, string>>;

function validar(f: Form): Erros {
  const e: Erros = {};
  if (f.titulo.trim().length < 3) e.titulo = "Informe o título do evento (mínimo de 3 letras).";
  if (f.titulo.length > 120) e.titulo = "Máximo de 120 caracteres.";
  if (f.descricao.length > 2000) e.descricao = "Máximo de 2000 caracteres.";
  if (!f.data) e.data = "Informe a data.";
  if (!f.horario) e.horario = "Informe o horário.";
  if (!f.local.trim()) e.local = "Informe o local.";
  const n = Number(f.limitePorPessoa);
  if (!Number.isInteger(n) || n < 1 || n > 10) e.limitePorPessoa = "Use um número inteiro de 1 a 10.";
  return e;
}

export default function EventoForm() {
  const { id } = useParams();
  const perfil = usePerfil();
  const toast = useToast();
  const navigate = useNavigate();
  const editando = Boolean(id);
  const [form, setForm] = useState<Form>(vazio);
  const [original, setOriginal] = useState<Evento | null>(null);
  const [capa, setCapa] = useState<string | null>(null);
  const [capaMudou, setCapaMudou] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [carregando, setCarregando] = useState(editando);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [sujo, setSujo] = useState(false);

  useEffect(() => {
    if (!id) return;
    let vivo = true;
    void (async () => {
      try {
        const [ev, c] = await Promise.all([obterEvento(id), obterCapa(id)]);
        if (!vivo) return;
        if (!ev) {
          setErroCarga("Evento não encontrado.");
          return;
        }
        setOriginal(ev);
        setForm({ titulo: ev.titulo, descricao: ev.descricao, data: ev.data, horario: ev.horario, local: ev.local, limitePorPessoa: String(ev.limitePorPessoa), gratuito: ev.gratuito, capaAlt: ev.capaAlt ?? "" });
        setCapa(c);
      } catch {
        if (vivo) setErroCarga("Não foi possível carregar o evento.");
      } finally {
        if (vivo) setCarregando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [id]);

  useEffect(() => {
    if (!sujo) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [sujo]);

  if (!podeGerirEventos(perfil.papel)) return <AdminPage title="Evento" subtitle=""><SemPermissao /></AdminPage>;
  if (carregando) return <AdminPage title="Editar evento" subtitle=""><Carregando /></AdminPage>;
  if (erroCarga) return <AdminPage title="Editar evento" subtitle=""><Erro texto={erroCarga} /></AdminPage>;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSujo(true);
  };

  const escolherImagem = async (arquivo: File | undefined) => {
    if (!arquivo) return;
    try {
      setCapa(await comprimirImagem(arquivo));
      setCapaMudou(true);
      setSujo(true);
    } catch (e) {
      toast.erro("Imagem não aceita", e instanceof Error ? e.message : undefined);
    }
  };

  const salvar = async (status: EventoStatus) => {
    const v = validar(form);
    setErros(v);
    if (Object.keys(v).length > 0) {
      toast.erro("Revise os campos destacados");
      return;
    }
    setSalvando(true);
    const dados: DadosEvento = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      data: form.data,
      horario: form.horario,
      local: form.local.trim(),
      limitePorPessoa: Number(form.limitePorPessoa),
      gratuito: form.gratuito,
      status,
      ...(form.capaAlt.trim() ? { capaAlt: form.capaAlt.trim() } : {}),
    };
    try {
      await salvarEvento(id ?? null, dados, capaMudou ? capa : undefined, perfil);
      setSujo(false);
      toast.ok(status === "published" && original?.status !== "published" ? "Evento publicado." : "Evento salvo.");
      navigate("/eventos");
    } catch {
      toast.erro("Não foi possível salvar o evento", "Seus dados continuam na tela. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const statusAtual = original?.status ?? "draft";
  const erro = (k: keyof Form) => (erros[k] ? <small className="campo-erro">{erros[k]}</small> : null);

  return (
    <AdminPage title={editando ? "Editar evento" : "Criar evento"} subtitle="Preencha as informações do evento.">
      <form className="admin-form" noValidate onSubmit={(e) => e.preventDefault()}>
        <section className="admin-card form-section">
          <div className="form-section-heading">
            <span>1</span>
            <div>
              <h3>Informações do evento</h3>
              <p>Dados principais para identificação.</p>
            </div>
          </div>
          <label>
            Título do evento *
            <input value={form.titulo} onChange={(e) => set("titulo", e.target.value)} maxLength={120} disabled={salvando} aria-invalid={Boolean(erros.titulo)} />
            {erro("titulo")}
          </label>
          <label>
            Descrição
            <textarea rows={5} value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Conte um pouco sobre o evento..." disabled={salvando} maxLength={2000} />
            {erro("descricao")}
          </label>
          <div className="form-grid">
            <label>
              Data *
              <input type="date" value={form.data} onChange={(e) => set("data", e.target.value)} disabled={salvando} aria-invalid={Boolean(erros.data)} />
              {erro("data")}
            </label>
            <label>
              Horário *
              <input type="time" value={form.horario} onChange={(e) => set("horario", e.target.value)} disabled={salvando} aria-invalid={Boolean(erros.horario)} />
              {erro("horario")}
            </label>
          </div>
          <label>
            Local *
            <input value={form.local} onChange={(e) => set("local", e.target.value)} disabled={salvando} aria-invalid={Boolean(erros.local)} />
            {erro("local")}
          </label>
        </section>
        <section className="admin-card form-section">
          <div className="form-section-heading">
            <span>2</span>
            <div>
              <h3>Imagem e reservas</h3>
              <p>Capa (usada na arte de Stories) e limites.</p>
            </div>
          </div>
          {capa ? (
            <div className="capa-previa">
              <img src={capa} alt={form.capaAlt || "Prévia da capa do evento"} />
              <div>
                <label className="button button-outline">
                  Trocar imagem
                  <input type="file" accept="image/png,image/jpeg" hidden onChange={(e) => void escolherImagem(e.target.files?.[0])} disabled={salvando} />
                </label>
                <button type="button" className="button button-ghost" onClick={() => { setCapa(null); setCapaMudou(true); setSujo(true); }} disabled={salvando}>
                  <Trash2 /> Remover
                </button>
              </div>
            </div>
          ) : (
            <label className="upload-box">
              <ImageIcon />
              <strong>Enviar imagem de capa</strong>
              <span>PNG ou JPG · a imagem é reduzida automaticamente</span>
              <input type="file" accept="image/png,image/jpeg" hidden onChange={(e) => void escolherImagem(e.target.files?.[0])} disabled={salvando} />
            </label>
          )}
          {capa && (
            <label>
              Texto alternativo da imagem
              <input value={form.capaAlt} onChange={(e) => set("capaAlt", e.target.value)} maxLength={140} disabled={salvando} />
            </label>
          )}
          <label>
            Limite de assentos por pessoa
            <input type="number" min={1} max={10} value={form.limitePorPessoa} onChange={(e) => set("limitePorPessoa", e.target.value)} disabled={salvando} aria-invalid={Boolean(erros.limitePorPessoa)} />
            {erro("limitePorPessoa")}
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.gratuito} onChange={(e) => set("gratuito", e.target.checked)} disabled={salvando} />
            <span>Evento gratuito (reserva sem pagamento)</span>
          </label>
        </section>
        <div className="form-actions">
          <button type="button" className="button button-outline" onClick={() => navigate("/eventos")} disabled={salvando}>
            Cancelar
          </button>
          {statusAtual === "draft" ? (
            <>
              <button type="button" className="button button-outline" onClick={() => void salvar("draft")} disabled={salvando}>
                {salvando && <LoaderCircle className="spinner" />} Salvar rascunho
              </button>
              <button type="button" className="button button-primary" onClick={() => void salvar("published")} disabled={salvando}>
                Salvar e publicar <ArrowRight />
              </button>
            </>
          ) : (
            <button type="button" className="button button-primary" onClick={() => void salvar(statusAtual)} disabled={salvando}>
              {salvando && <LoaderCircle className="spinner" />} Salvar alterações
            </button>
          )}
        </div>
      </form>
    </AdminPage>
  );
}
