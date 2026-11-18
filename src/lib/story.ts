import logoUrl from "../assets/cscsp-logo.png";
import { dataLonga } from "./format";

export interface DadosStory {
  titulo: string;
  restam: number;
  data: string;
  horario: string;
  capa?: string | null;
}

function carregar(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => erro(new Error("Falha ao carregar imagem."));
    img.src = src;
  });
}

function quebrarTexto(ctx: CanvasRenderingContext2D, texto: string, largMax: number): string[] {
  const linhas: string[] = [];
  let atual = "";
  for (const palavra of texto.split(" ")) {
    const teste = atual ? `${atual} ${palavra}` : palavra;
    if (ctx.measureText(teste).width > largMax && atual) {
      linhas.push(atual);
      atual = palavra;
    } else atual = teste;
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/** Arte 1080×1920 para Stories. Contém apenas dados públicos (título, data, vagas e logo). */
export async function gerarStoryPng(d: DadosStory): Promise<Blob> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível gerar a imagem neste navegador.");
  try {
    await document.fonts.ready;
  } catch {
    /* segue com a fonte padrão */
  }

  const fundo = ctx.createLinearGradient(0, 0, 0, H);
  fundo.addColorStop(0, "#0b4a4a");
  fundo.addColorStop(1, "#052b2d");
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, W, H);
  if (d.capa) {
    try {
      const img = await carregar(d.capa);
      const esc = Math.max(W / img.width, H / img.height);
      ctx.drawImage(img, (W - img.width * esc) / 2, (H - img.height * esc) / 2, img.width * esc, img.height * esc);
    } catch {
      /* mantém o fundo em degradê */
    }
  }
  const veu = ctx.createLinearGradient(0, 0, 0, H);
  veu.addColorStop(0, "rgba(4,40,42,0.55)");
  veu.addColorStop(0.5, "rgba(4,40,42,0.7)");
  veu.addColorStop(1, "rgba(4,40,42,0.92)");
  ctx.fillStyle = veu;
  ctx.fillRect(0, 0, W, H);

  // logo em cartão branco
  try {
    const logo = await carregar(logoUrl);
    const lw = 360;
    const lh = (logo.height / logo.width) * lw;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect((W - lw) / 2 - 40, 150, lw + 80, lh + 70, 36);
    ctx.fill();
    ctx.drawImage(logo, (W - lw) / 2, 185, lw, lh);
  } catch {
    /* sem logo */
  }

  ctx.textAlign = "center";
  const esgotado = d.restam <= 0;
  ctx.fillStyle = "#e5bd4c";
  ctx.font = '800 44px Manrope, "DM Sans", sans-serif';
  ctx.fillText(esgotado ? "INGRESSOS ESGOTADOS" : d.restam <= 20 ? "ÚLTIMOS LUGARES" : "RESERVE SEU LUGAR", W / 2, 760);

  ctx.fillStyle = "#ffffff";
  if (esgotado) {
    ctx.font = '800 120px Manrope, "DM Sans", sans-serif';
    ctx.fillText("Esgotado!", W / 2, 1000);
  } else {
    ctx.font = '700 90px Manrope, "DM Sans", sans-serif';
    ctx.fillText("Restam", W / 2, 920);
    ctx.font = '800 300px Manrope, "DM Sans", sans-serif';
    ctx.fillText(String(d.restam), W / 2, 1190);
    ctx.font = '700 90px Manrope, "DM Sans", sans-serif';
    ctx.fillText(d.restam === 1 ? "lugar!" : "lugares!", W / 2, 1300);
  }

  ctx.font = '700 58px Manrope, "DM Sans", sans-serif';
  const linhas = quebrarTexto(ctx, d.titulo, W - 200).slice(0, 3);
  linhas.forEach((l, i) => ctx.fillText(l, W / 2, 1450 + i * 72));
  ctx.fillStyle = "#e5bd4c";
  ctx.font = '700 48px Manrope, "DM Sans", sans-serif';
  ctx.fillText(dataLonga(d.data, d.horario).toUpperCase(), W / 2, 1450 + linhas.length * 72 + 50);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = '500 34px "DM Sans", sans-serif';
  ctx.fillText("Teatro do Colégio Santa Catarina · Entrada gratuita com reserva", W / 2, H - 110);

  return new Promise((ok, erro) =>
    canvas.toBlob((b) => (b ? ok(b) : erro(new Error("Falha ao gerar a imagem."))), "image/png"),
  );
}
