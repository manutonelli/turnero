import { nanoid } from "nanoid";
import { calcularDisponibilidad, timeToMinutes } from "./availability";
import type { ConfigNegocio, Excepcion, HorarioSemanal, Turno } from "./types";

export function nuevoId(): string {
  return nanoid(10);
}

export function nuevoToken(): string {
  return nanoid(24);
}

export interface VerificarSlotParams {
  fecha: string;
  horaInicio: string;
  config: ConfigNegocio;
  horarios: HorarioSemanal[];
  excepciones: Excepcion[];
  turnos: Turno[];
  excluirTurnoId?: string;
}

/** Verifica que el slot pedido siga apareciendo entre los disponibles calculados en el momento. */
export function verificarSlotDisponible(params: VerificarSlotParams): boolean {
  const { fecha, horaInicio, config, horarios, excepciones, turnos, excluirTurnoId } = params;
  const turnosRelevantes = excluirTurnoId
    ? turnos.filter((t) => t.id !== excluirTurnoId)
    : turnos;

  const disponibilidad = calcularDisponibilidad({
    desde: fecha,
    hasta: fecha,
    config,
    horarios,
    excepciones,
    turnos: turnosRelevantes,
  });

  const slotsDelDia = disponibilidad[fecha] || [];
  return slotsDelDia.some((s) => s.horaInicio === horaInicio);
}

export function calcularHoraFin(horaInicio: string, duracionMin: number): string {
  const inicio = timeToMinutes(horaInicio);
  const fin = inicio + duracionMin;
  const h = Math.floor(fin / 60)
    .toString()
    .padStart(2, "0");
  const m = (fin % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
