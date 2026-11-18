/** Reduz a imagem no navegador (JPG, ~250 KB) para guardá-la no Firestore, sem precisar do Cloud Storage. */
export async function comprimirImagem(arquivo: File, maxBytes = 250_000): Promise<string> {
  if (!/^image\/(png|jpeg)$/.test(arquivo.type)) throw new Error("Use uma imagem PNG ou JPG.");
  if (arquivo.size > 15 * 1024 * 1024) throw new Error("A imagem é muito grande (máximo de 15 MB).");
  const bmp = await createImageBitmap(arquivo);
  const tentativas: [number, number][] = [[1280, 0.8], [1280, 0.65], [1280, 0.5], [1024, 0.55], [800, 0.5], [640, 0.45]];
  for (const [largMax, qualidade] of tentativas) {
    const escala = Math.min(1, largMax / bmp.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bmp.width * escala));
    canvas.height = Math.max(1, Math.round(bmp.height * escala));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível processar a imagem neste navegador.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL("image/jpeg", qualidade);
    if (url.length * 0.75 <= maxBytes) return url;
  }
  throw new Error("Não foi possível reduzir a imagem o bastante. Tente uma imagem menor.");
}
