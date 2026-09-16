import type { ConfigNegocio, Excepcion, HorarioSemanal, Turno } from "./types";

/**
 * Store en memoria que imita lib/googleSheetsBackend.ts, para poder probar
 * y mostrar la app sin necesidad de configurar credenciales de Google.
 * Se activa con la variable de entorno DEMO_MODE=true. Los datos se pierden
 * al reiniciar el servidor.
 */

let config: ConfigNegocio = {
  nombreNegocio: "Peluqueria Demo",
  duracionTurnoMin: 30,
  timezone: process.env.TIMEZONE || "America/Argentina/Buenos_Aires",
  anticipacionMinimaHoras: 1,
  diasMaxAnticipacion: 14,
};

let horarios: HorarioSemanal[] = [
  { fila: 2, diaSemana: 1, horaInicio: "09:00", horaFin: "13:00", activo: true },
  { fila: 3, diaSemana: 1, horaInicio: "14:00", horaFin: "18:00", activo: true },
  { fila: 4, diaSemana: 2, horaInicio: "09:00", horaFin: "13:00", activo: true },
  { fila: 5, diaSemana: 2, horaInicio: "14:00", horaFin: "18:00", activo: true },
  { fila: 6, diaSemana: 3, horaInicio: "09:00", horaFin: "13:00", activo: true },
  { fila: 7, diaSemana: 3, horaInicio: "14:00", horaFin: "18:00", activo: true },
  { fila: 8, diaSemana: 4, horaInicio: "09:00", horaFin: "13:00", activo: true },
  { fila: 9, diaSemana: 4, horaInicio: "14:00", horaFin: "18:00", activo: true },
  { fila: 10, diaSemana: 5, horaInicio: "09:00", horaFin: "13:00", activo: true },
  { fila: 11, diaSemana: 5, horaInicio: "14:00", horaFin: "18:00", activo: true },
  { fila: 12, diaSemana: 6, horaInicio: "09:00", horaFin: "13:00", activo: true },
];

let excepciones: Excepcion[] = [];

let turnos: Turno[] = [];
let filaCounter = 2;

function hoyMasDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function sembrarTurnosDemo() {
  const manana = hoyMasDias(1);
  const pasado = hoyMasDias(2);
  turnos = [
    {
      fila: filaCounter++,
      id: "demo1",
      token: "demo-token-1",
      fecha: manana,
      horaInicio: "10:00",
      horaFin: "10:30",
      nombreCliente: "Maria Gomez",
      telefono: "11-5555-0001",
      email: "maria@ejemplo.com",
      estado: "CONFIRMADO",
      notas: "",
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    },
    {
      fila: filaCounter++,
      id: "demo2",
      token: "demo-token-2",
      fecha: pasado,
      horaInicio: "15:00",
      horaFin: "15:30",
      nombreCliente: "Carlos Ruiz",
      telefono: "11-5555-0002",
      email: "",
      estado: "CONFIRMADO",
      notas: "Primera vez",
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    },
  ];
}
sembrarTurnosDemo();

export async function getConfig(): Promise<ConfigNegocio> {
  return { ...config };
}

export async function setConfig(nuevo: ConfigNegocio): Promise<void> {
  config = { ...nuevo };
}

export async function getHorarios(): Promise<HorarioSemanal[]> {
  return horarios.map((h) => ({ ...h }));
}

export async function setHorarios(nuevos: Omit<HorarioSemanal, "fila">[]): Promise<void> {
  horarios = nuevos.map((h, i) => ({ ...h, fila: i + 2 }));
}

export async function getExcepciones(): Promise<Excepcion[]> {
  return excepciones.map((e) => ({ ...e }));
}

export async function addExcepcion(excepcion: Omit<Excepcion, "fila">): Promise<void> {
  excepciones.push({ ...excepcion, fila: filaCounter++ });
}

export async function deleteExcepcion(fila: number): Promise<void> {
  excepciones = excepciones.filter((e) => e.fila !== fila);
}

export async function getTurnos(): Promise<Turno[]> {
  return turnos.map((t) => ({ ...t }));
}

export async function getTurnoByToken(token: string): Promise<Turno | null> {
  return turnos.find((t) => t.token === token) || null;
}

export async function getTurnoById(id: string): Promise<Turno | null> {
  return turnos.find((t) => t.id === id) || null;
}

export async function createTurno(turno: Omit<Turno, "fila">): Promise<void> {
  turnos.push({ ...turno, fila: filaCounter++ });
}

export async function updateTurno(
  fila: number,
  changes: Partial<
    Pick<Turno, "fecha" | "horaInicio" | "horaFin" | "estado" | "notas" | "actualizadoEn">
  >
): Promise<void> {
  turnos = turnos.map((t) => (t.fila === fila ? { ...t, ...changes } : t));
}

export async function ensureHeaders(): Promise<void> {
  // No-op: el store en memoria ya arranca con datos de ejemplo.
}
