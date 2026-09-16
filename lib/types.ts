export interface ConfigNegocio {
  nombreNegocio: string;
  duracionTurnoMin: number;
  timezone: string;
  anticipacionMinimaHoras: number;
  diasMaxAnticipacion: number;
}

export interface HorarioSemanal {
  fila: number; // numero de fila en la hoja (1-indexed, incluye header) - util para editar/borrar
  diaSemana: number; // 0 = domingo ... 6 = sabado
  horaInicio: string; // "HH:mm"
  horaFin: string; // "HH:mm"
  activo: boolean;
}

export type TipoExcepcion = "BLOQUEO" | "EXTRA";

export interface Excepcion {
  fila: number;
  fecha: string; // "YYYY-MM-DD"
  tipo: TipoExcepcion;
  horaInicio: string; // "" = todo el dia (solo aplica a BLOQUEO)
  horaFin: string;
  nota: string;
}

export type EstadoTurno = "CONFIRMADO" | "CANCELADO";

export interface Turno {
  fila: number;
  id: string;
  token: string;
  fecha: string; // "YYYY-MM-DD"
  horaInicio: string; // "HH:mm"
  horaFin: string; // "HH:mm"
  nombreCliente: string;
  telefono: string;
  email: string;
  estado: EstadoTurno;
  notas: string;
  creadoEn: string; // ISO
  actualizadoEn: string; // ISO
}

export interface Slot {
  fecha: string;
  horaInicio: string;
  horaFin: string;
}
