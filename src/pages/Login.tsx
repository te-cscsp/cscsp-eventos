import { useState } from "react";
import { Navigate } from "react-router-dom";
import { AlertTriangle, Eye, EyeOff, LoaderCircle, LogOut, ShieldCheck } from "lucide-react";
import logo from "../assets/cscsp-logo.png";
import { mensagemErroAuth, useAuth } from "../data/auth";
import { configuracaoOk } from "../lib/firebase";

export default function Login() {
  const { user, perfil, carregando, entrar, sair, recuperarSenha } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ver, setVer] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  if (!carregando && user && perfil) return <Navigate to="/" replace />;

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !senha) {
      setErro("Informe e-mail e senha.");
      return;
    }
    setEnviando(true);
    setErro(null);
    setAviso(null);
    try {
      await entrar(email, senha);
    } catch (err) {
      setErro(mensagemErroAuth(err));
    } finally {
      setEnviando(false);
    }
  };

  const esqueci = async () => {
    setErro(null);
    if (!email.trim()) {
      setErro("Digite seu e-mail acima para receber o link de redefinição.");
      return;
    }
    try {
      await recuperarSenha(email);
    } catch {
      /* resposta igual para não revelar quais e-mails existem */
    }
    setAviso("Se este e-mail tiver acesso, enviamos um link para redefinir a senha.");
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <img src={logo} alt="Colégio Santa Catarina" />
          <span>Teatro · Gestão</span>
        </div>
        <h1>Acesso da gestão</h1>
        <p>Entre com o e-mail e a senha cadastrados pela administração.</p>
        {!configuracaoOk && (
          <div className="erro-inline" role="alert">
            <AlertTriangle /> Firebase não configurado. Copie <code>.env.example</code> para <code>.env.local</code> e preencha os dados.
          </div>
        )}
        {user && !perfil && !carregando && (
          <div className="erro-inline" role="alert">
            <AlertTriangle /> Esta conta ainda não tem acesso liberado. Peça à administração para ativá-la.
            <button className="magic-button" type="button" onClick={() => void sair()}>
              <LogOut size={15} /> Sair
            </button>
          </div>
        )}
        <form onSubmit={submeter} noValidate>
          <label>
            E-mail
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} disabled={enviando} placeholder="nome@colegio.com.br" />
          </label>
          <label>
            Senha
            <div className="input-action">
              <input type={ver ? "text" : "password"} autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} disabled={enviando} placeholder="••••••••" />
              <button type="button" className="ver-senha" onClick={() => setVer(!ver)} aria-label={ver ? "Ocultar senha" : "Mostrar senha"}>
                {ver ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {erro && (
            <div className="erro-inline" role="alert">
              <AlertTriangle /> {erro}
            </div>
          )}
          {aviso && <div className="aviso-inline" role="status">{aviso}</div>}
          <button className="button button-primary full" type="submit" disabled={enviando || carregando}>
            {enviando && <LoaderCircle className="spinner" />} Entrar
          </button>
          <button className="magic-button" type="button" onClick={() => void esqueci()} disabled={enviando}>
            Esqueci minha senha
          </button>
        </form>
        <p className="privacy-note">
          <ShieldCheck size={15} /> Acesso restrito à equipe autorizada. Ações ficam registradas.
        </p>
      </section>
    </main>
  );
}
