import type { Papel } from "../types";

export const podeGerirEventos = (p: Papel) => p === "administrator";
export const podeEditarMapa = (p: Papel) => p === "administrator";
export const podeReservar = (p: Papel) => p === "administrator" || p === "operator";
export const podeVerReservas = podeReservar;
export const podeExportar = (p: Papel) => p === "administrator";
