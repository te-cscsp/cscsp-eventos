import raw from "./layout-teatro.json";
import type { AssentoEvento, Classe } from "../types";

export type Lado = "esquerdo" | "direito";
export type SetorId = "plateia-esquerda" | "plateia-direita";

export interface AssentoLayout {
  id: string;
  label: string;
  fileira: string;
  ordemFileira: number;
  numero: number;
  lado: Lado;
  setor: SetorId;
  distanciaCorredor: number;
  tipo: "normal" | "preferencial" | "pcd";
}

export const ASSENTOS = raw.assentos as unknown as AssentoLayout[];
export const FILEIRAS: string[] = raw.teatro.fileiras;
export const TOTAL_ASSENTOS = ASSENTOS.length;
export const MAX_DISTANCIA = ASSENTOS.reduce((m, a) => Math.max(m, a.distanciaCorredor), 0);

export const SETORES: { id: SetorId; nome: string }[] = [
  { id: "plateia-esquerda", nome: "Plateia esquerda" },
  { id: "plateia-direita", nome: "Plateia direita" },
];
export const NOME_SETOR: Record<string, string> = Object.fromEntries(SETORES.map((s) => [s.id, s.nome]));

export const ASSENTO_POR_ID = new Map<string, AssentoLayout>(ASSENTOS.map((a) => [a.id, a]));
const porPosicao = new Map<string, AssentoLayout>(
  ASSENTOS.map((a) => [`${a.fileira}|${a.lado}|${a.distanciaCorredor}`, a]),
);
export const assentoNaPosicao = (fileira: string, lado: Lado, dist: number) =>
  porPosicao.get(`${fileira}|${lado}|${dist}`);

export const classePadrao = (id: string): Classe => ASSENTO_POR_ID.get(id)?.tipo ?? "normal";
export const classeEfetiva = (id: string, docs: Map<string, AssentoEvento>): Classe =>
  docs.get(id)?.classe ?? classePadrao(id);

export const ROTULO_CLASSE: Record<Classe, string> = {
  normal: "Comum",
  preferencial: "Prioritário",
  pcd: "PcD (cadeirante)",
  equipe: "Reservado para equipe",
  bloqueado: "Bloqueado",
};

export type VisualAssento = "available" | "occupied" | "preferred" | "team" | "blocked";
export function visualDoAssento(classe: Classe, ocupado: boolean): VisualAssento {
  if (ocupado) return "occupied";
  if (classe === "preferencial") return "preferred";
  if (classe === "equipe") return "team";
  if (classe === "bloqueado") return "blocked";
  return "available";
}

export interface StatsSetor {
  id: SetorId;
  nome: string;
  total: number;
  bloqueados: number;
  reservados: number;
  disponiveis: number;
  perc: number;
}
export interface Stats {
  total: number;
  bloqueados: number;
  equipe: number;
  bloqueadosOutros: number;
  reservados: number;
  disponiveis: number;
  capacidade: number; // total - bloqueados
  perc: number;
  porSetor: StatsSetor[];
}

const percDe = (parte: number, todo: number) => (todo > 0 ? (parte / todo) * 100 : 0);

/** Única fonte dos números do dashboard: o layout + os documentos de assento do evento. */
export function calcularStats(docs: Map<string, AssentoEvento>): Stats {
  const setores = new Map<SetorId, StatsSetor>(
    SETORES.map((s) => [s.id, { id: s.id, nome: s.nome, total: 0, bloqueados: 0, reservados: 0, disponiveis: 0, perc: 0 }]),
  );
  let equipe = 0;
  let bloqueadosOutros = 0;
  let reservados = 0;
  for (const a of ASSENTOS) {
    const d = docs.get(a.id);
    const classe = d?.classe ?? a.tipo;
    const s = setores.get(a.setor)!;
    s.total += 1;
    if (classe === "equipe" || classe === "bloqueado") {
      s.bloqueados += 1;
      if (classe === "equipe") equipe += 1;
      else bloqueadosOutros += 1;
    } else if (d?.ocupado) {
      s.reservados += 1;
      reservados += 1;
    }
  }
  const porSetor = [...setores.values()].map((s) => {
    const capacidade = s.total - s.bloqueados;
    return { ...s, disponiveis: capacidade - s.reservados, perc: percDe(s.reservados, capacidade) };
  });
  const bloqueados = equipe + bloqueadosOutros;
  const capacidade = TOTAL_ASSENTOS - bloqueados;
  return {
    total: TOTAL_ASSENTOS,
    bloqueados,
    equipe,
    bloqueadosOutros,
    reservados,
    disponiveis: capacidade - reservados,
    capacidade,
    perc: percDe(reservados, capacidade),
    porSetor,
  };
}
