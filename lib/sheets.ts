import type { ConfigNegocio, Excepcion, HorarioSemanal, Turno } from "./types";
import * as real from "./googleSheetsBackend";
import * as demo from "./demoStore";

/**
 * Con DEMO_MODE=true se usa un store en memoria (lib/demoStore.ts) en vez de
 * Google Sheets, para poder probar la app sin configurar credenciales.
 */
function backend() {
  return process.env.DEMO_MODE === "true" ? demo : real;
}

export function getConfig(): Promise<ConfigNegocio> {
  return backend().getConfig();
}

export function setConfig(config: ConfigNegocio): Promise<void> {
  return backend().setConfig(config);
}

export function getHorarios(): Promise<HorarioSemanal[]> {
  return backend().getHorarios();
}

export function setHorarios(horarios: Omit<HorarioSemanal, "fila">[]): Promise<void> {
  return backend().setHorarios(horarios);
}

export function getExcepciones(): Promise<Excepcion[]> {
  return backend().getExcepciones();
}

export function addExcepcion(excepcion: Omit<Excepcion, "fila">): Promise<void> {
  return backend().addExcepcion(excepcion);
}

export function deleteExcepcion(fila: number): Promise<void> {
  return backend().deleteExcepcion(fila);
}

export function getTurnos(): Promise<Turno[]> {
  return backend().getTurnos();
}

export function getTurnoByToken(token: string): Promise<Turno | null> {
  return backend().getTurnoByToken(token);
}

export function getTurnoById(id: string): Promise<Turno | null> {
  return backend().getTurnoById(id);
}

export function createTurno(turno: Omit<Turno, "fila">): Promise<void> {
  return backend().createTurno(turno);
}

export function updateTurno(
  fila: number,
  changes: Partial<
    Pick<Turno, "fecha" | "horaInicio" | "horaFin" | "estado" | "notas" | "actualizadoEn">
  >
): Promise<void> {
  return backend().updateTurno(fila, changes);
}

export function ensureHeaders(): Promise<void> {
  return backend().ensureHeaders();
}
