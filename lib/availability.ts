import type { ConfigNegocio, Excepcion, HorarioSemanal, Slot, Turno } from "./types";

type Rango = [number, number]; // minutos desde las 00:00

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Dia de la semana (0=domingo..6=sabado) para una fecha "YYYY-MM-DD", sin depender del huso del servidor. */
export function getWeekday(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

export function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Fecha y minutos-del-dia actuales, en el huso horario del negocio. */
export function nowParts(timezone: string): { dateStr: string; minutes: number } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const dateStr = `${get("year")}-${get("month")}-${get("day")}`;
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  return { dateStr, minutes: hour * 60 + minute };
}

function subtractRango(rangos: Rango[], resta: Rango): Rango[] {
  const resultado: Rango[] = [];
  for (const [start, end] of rangos) {
    const [rStart, rEnd] = resta;
    if (rEnd <= start || rStart >= end) {
      resultado.push([start, end]);
      continue;
    }
    if (rStart > start) resultado.push([start, Math.min(rStart, end)]);
    if (rEnd < end) resultado.push([Math.max(rEnd, start), end]);
  }
  return resultado;
}

function mergeRangos(rangos: Rango[]): Rango[] {
  const ordenados = [...rangos].sort((a, b) => a[0] - b[0]);
  const resultado: Rango[] = [];
  for (const rango of ordenados) {
    const ultimo = resultado[resultado.length - 1];
    if (ultimo && rango[0] <= ultimo[1]) {
      ultimo[1] = Math.max(ultimo[1], rango[1]);
    } else {
      resultado.push([...rango]);
    }
  }
  return resultado;
}

export interface CalcularSlotsParams {
  dateStr: string;
  config: ConfigNegocio;
  horarios: HorarioSemanal[];
  excepciones: Excepcion[];
  turnosOcupados: Turno[]; // ya filtrados por fecha + estado CONFIRMADO
  nowDateStr: string;
  nowMinutes: number;
}

export function calcularSlotsParaFecha(params: CalcularSlotsParams): Slot[] {
  const { dateStr, config, horarios, excepciones, turnosOcupados, nowDateStr, nowMinutes } =
    params;

  const weekday = getWeekday(dateStr);
  let rangos: Rango[] = horarios
    .filter((h) => h.activo && h.diaSemana === weekday)
    .map((h): Rango => [timeToMinutes(h.horaInicio), timeToMinutes(h.horaFin)]);

  const excepcionesDelDia = excepciones.filter((e) => e.fecha === dateStr);
  for (const exc of excepcionesDelDia) {
    if (exc.tipo === "BLOQUEO") {
      if (!exc.horaInicio || !exc.horaFin) {
        rangos = [];
      } else {
        const bloqueo: Rango = [timeToMinutes(exc.horaInicio), timeToMinutes(exc.horaFin)];
        rangos = rangos.flatMap((r) => subtractRango([r], bloqueo));
      }
    } else if (exc.tipo === "EXTRA" && exc.horaInicio && exc.horaFin) {
      rangos.push([timeToMinutes(exc.horaInicio), timeToMinutes(exc.horaFin)]);
    }
  }

  rangos = mergeRangos(rangos);

  const duracion = config.duracionTurnoMin;
  let slots: Rango[] = [];
  for (const [start, end] of rangos) {
    for (let inicio = start; inicio + duracion <= end; inicio += duracion) {
      slots.push([inicio, inicio + duracion]);
    }
  }

  // Sacar los horarios ya ocupados por turnos confirmados
  for (const turno of turnosOcupados) {
    const ocupado: Rango = [timeToMinutes(turno.horaInicio), timeToMinutes(turno.horaFin)];
    slots = slots.filter(([s, e]) => e <= ocupado[0] || s >= ocupado[1]);
  }

  // Aplicar anticipacion minima si la fecha es hoy
  if (dateStr === nowDateStr) {
    const minimoDesde = nowMinutes + config.anticipacionMinimaHoras * 60;
    slots = slots.filter(([s]) => s >= minimoDesde);
  } else if (dateStr < nowDateStr) {
    slots = [];
  }

  return slots.map(([s, e]) => ({
    fecha: dateStr,
    horaInicio: minutesToTime(s),
    horaFin: minutesToTime(e),
  }));
}

export interface CalcularDisponibilidadParams {
  desde: string;
  hasta: string;
  config: ConfigNegocio;
  horarios: HorarioSemanal[];
  excepciones: Excepcion[];
  turnos: Turno[];
}

export function calcularDisponibilidad(
  params: CalcularDisponibilidadParams
): Record<string, Slot[]> {
  const { desde, hasta, config, horarios, excepciones, turnos } = params;
  const { dateStr: nowDateStr, minutes: nowMinutes } = nowParts(config.timezone);

  const limiteMax = addDaysStr(nowDateStr, config.diasMaxAnticipacion);
  const finReal = hasta > limiteMax ? limiteMax : hasta;

  const turnosConfirmados = turnos.filter((t) => t.estado === "CONFIRMADO");

  const resultado: Record<string, Slot[]> = {};
  let cursor = desde < nowDateStr ? nowDateStr : desde;
  while (cursor <= finReal) {
    const turnosDelDia = turnosConfirmados.filter((t) => t.fecha === cursor);
    resultado[cursor] = calcularSlotsParaFecha({
      dateStr: cursor,
      config,
      horarios,
      excepciones,
      turnosOcupados: turnosDelDia,
      nowDateStr,
      nowMinutes,
    });
    cursor = addDaysStr(cursor, 1);
  }
  return resultado;
}
