const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export function dataLocal(data: string): Date {
  const [a, m, d] = data.split("-").map(Number);
  return new Date(a, (m || 1) - 1, d || 1);
}
export function diaMes(data: string) {
  const d = dataLocal(data);
  return { dia: String(d.getDate()), mes: MESES[d.getMonth()] };
}
export function horaCurta(horario: string): string {
  const [h, m] = horario.split(":");
  return !m || m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}
export function dataLonga(data: string, horario?: string): string {
  const d = dataLocal(data);
  const sem = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const dia = d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
  const base = `${sem.charAt(0).toUpperCase()}${sem.slice(1)}, ${dia}`;
  return horario ? `${base} · ${horaCurta(horario)}` : base;
}
export function dataCurta(data: string, horario?: string): string {
  const d = dataLocal(data);
  const base = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(/\./g, "");
  return horario ? `${base} · ${horaCurta(horario)}` : base;
}
export function dataHora(ts: number): string {
  return new Date(ts).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
export function horaSegundos(ts: number): string {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
export function mesmoDia(ts: number, ref = Date.now()): boolean {
  return new Date(ts).toDateString() === new Date(ref).toDateString();
}
export const perc1 = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const iniciais = (nome: string) =>
  nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
export const slug = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Seat ids ordenados por fileira e número (C8 antes de C10). */
export function ordenarAssentos(ids: string[]): string[] {
  return [...ids].sort((a, b) => a.charAt(0).localeCompare(b.charAt(0)) || Number(a.slice(1)) - Number(b.slice(1)));
}

function celulaCsv(v: string | number | undefined): string {
  let s = v === undefined ? "" : String(v);
  // evita injeção de fórmulas ao abrir no Excel
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
export function montarCsv(cabecalho: string[], linhas: (string | number | undefined)[][]): string {
  return "\uFEFF" + [cabecalho, ...linhas].map((l) => l.map(celulaCsv).join(";")).join("\r\n");
}
export function baixarArquivo(conteudo: BlobPart, nome: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
