import { google, sheets_v4 } from "googleapis";
import type {
  ConfigNegocio,
  Excepcion,
  HorarioSemanal,
  Turno,
  TipoExcepcion,
  EstadoTurno,
} from "./types";

const TAB_CONFIG = "Config";
const TAB_HORARIOS = "Horarios";
const TAB_EXCEPCIONES = "Excepciones";
const TAB_TURNOS = "Turnos";

const TURNOS_HEADER = [
  "id",
  "token",
  "fecha",
  "hora_inicio",
  "hora_fin",
  "nombre_cliente",
  "telefono",
  "email",
  "estado",
  "notas",
  "creado_en",
  "actualizado_en",
];

const HORARIOS_HEADER = ["dia_semana", "hora_inicio", "hora_fin", "activo"];

const EXCEPCIONES_HEADER = ["fecha", "tipo", "hora_inicio", "hora_fin", "nota"];

const DEFAULT_CONFIG: ConfigNegocio = {
  nombreNegocio: "Mi Negocio",
  duracionTurnoMin: 30,
  timezone: process.env.TIMEZONE || "America/Argentina/Buenos_Aires",
  anticipacionMinimaHoras: 2,
  diasMaxAnticipacion: 30,
};

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

let sheetsClient: sheets_v4.Sheets | null = null;

function getSheetsClient(): sheets_v4.Sheets {
  if (sheetsClient) return sheetsClient;

  const email = getEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const rawKey = getEnv("GOOGLE_PRIVATE_KEY");
  const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

function getSpreadsheetId(): string {
  return getEnv("GOOGLE_SHEET_ID");
}

async function readRange(range: string): Promise<string[][]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range,
  });
  return (res.data.values as string[][]) || [];
}

async function writeRange(range: string, values: unknown[][]): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

async function appendRange(range: string, values: unknown[][]): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
}

async function clearRange(range: string): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: getSpreadsheetId(),
    range,
  });
}

// ---------- Config ----------

export async function getConfig(): Promise<ConfigNegocio> {
  const rows = await readRange(`${TAB_CONFIG}!A2:B`);
  const map: Record<string, string> = {};
  for (const row of rows) {
    if (!row[0]) continue;
    map[row[0].trim()] = (row[1] ?? "").trim();
  }
  return {
    nombreNegocio: map["nombre_negocio"] || DEFAULT_CONFIG.nombreNegocio,
    duracionTurnoMin: Number(map["duracion_turno_min"]) || DEFAULT_CONFIG.duracionTurnoMin,
    timezone: map["timezone"] || DEFAULT_CONFIG.timezone,
    anticipacionMinimaHoras:
      Number(map["anticipacion_minima_horas"]) ?? DEFAULT_CONFIG.anticipacionMinimaHoras,
    diasMaxAnticipacion:
      Number(map["dias_max_anticipacion"]) || DEFAULT_CONFIG.diasMaxAnticipacion,
  };
}

export async function setConfig(config: ConfigNegocio): Promise<void> {
  const values = [
    ["nombre_negocio", config.nombreNegocio],
    ["duracion_turno_min", String(config.duracionTurnoMin)],
    ["timezone", config.timezone],
    ["anticipacion_minima_horas", String(config.anticipacionMinimaHoras)],
    ["dias_max_anticipacion", String(config.diasMaxAnticipacion)],
  ];
  await writeRange(`${TAB_CONFIG}!A2:B${values.length + 1}`, values);
}

// ---------- Horarios (plantilla semanal) ----------

export async function getHorarios(): Promise<HorarioSemanal[]> {
  const rows = await readRange(`${TAB_HORARIOS}!A2:D`);
  return rows
    .map((row, i) => ({
      fila: i + 2,
      diaSemana: Number(row[0]),
      horaInicio: row[1] || "",
      horaFin: row[2] || "",
      activo: String(row[3]).toUpperCase() === "TRUE",
    }))
    .filter((h) => isHorarioValido(h));
}

function isHorarioValido(h: HorarioSemanal): boolean {
  return !Number.isNaN(h.diaSemana) && !!h.horaInicio && !!h.horaFin;
}

export async function setHorarios(
  horarios: Omit<HorarioSemanal, "fila">[]
): Promise<void> {
  await clearRange(`${TAB_HORARIOS}!A2:D`);
  if (horarios.length === 0) return;
  const values = horarios.map((h) => [
    h.diaSemana,
    h.horaInicio,
    h.horaFin,
    h.activo ? "TRUE" : "FALSE",
  ]);
  await writeRange(`${TAB_HORARIOS}!A2:D${values.length + 1}`, values);
}

// ---------- Excepciones (feriados / refuerzos puntuales) ----------

export async function getExcepciones(): Promise<Excepcion[]> {
  const rows = await readRange(`${TAB_EXCEPCIONES}!A2:E`);
  return rows
    .map((row, i) => ({
      fila: i + 2,
      fecha: row[0] || "",
      tipo: (row[1] || "BLOQUEO") as TipoExcepcion,
      horaInicio: row[2] || "",
      horaFin: row[3] || "",
      nota: row[4] || "",
    }))
    .filter((e) => !!e.fecha);
}

export async function addExcepcion(
  excepcion: Omit<Excepcion, "fila">
): Promise<void> {
  await appendRange(`${TAB_EXCEPCIONES}!A2:E`, [
    [
      excepcion.fecha,
      excepcion.tipo,
      excepcion.horaInicio,
      excepcion.horaFin,
      excepcion.nota,
    ],
  ]);
}

export async function deleteExcepcion(fila: number): Promise<void> {
  await clearRange(`${TAB_EXCEPCIONES}!A${fila}:E${fila}`);
}

// ---------- Turnos ----------

function parseTurnoRow(row: string[], fila: number): Turno {
  return {
    fila,
    id: row[0] || "",
    token: row[1] || "",
    fecha: row[2] || "",
    horaInicio: row[3] || "",
    horaFin: row[4] || "",
    nombreCliente: row[5] || "",
    telefono: row[6] || "",
    email: row[7] || "",
    estado: (row[8] || "CONFIRMADO") as EstadoTurno,
    notas: row[9] || "",
    creadoEn: row[10] || "",
    actualizadoEn: row[11] || "",
  };
}

export async function getTurnos(): Promise<Turno[]> {
  const rows = await readRange(`${TAB_TURNOS}!A2:L`);
  return rows
    .map((row, i) => parseTurnoRow(row, i + 2))
    .filter((t) => !!t.id);
}

export async function getTurnoByToken(token: string): Promise<Turno | null> {
  const turnos = await getTurnos();
  return turnos.find((t) => t.token === token) || null;
}

export async function getTurnoById(id: string): Promise<Turno | null> {
  const turnos = await getTurnos();
  return turnos.find((t) => t.id === id) || null;
}

export async function createTurno(
  turno: Omit<Turno, "fila">
): Promise<void> {
  await appendRange(`${TAB_TURNOS}!A2:L`, [
    [
      turno.id,
      turno.token,
      turno.fecha,
      turno.horaInicio,
      turno.horaFin,
      turno.nombreCliente,
      turno.telefono,
      turno.email,
      turno.estado,
      turno.notas,
      turno.creadoEn,
      turno.actualizadoEn,
    ],
  ]);
}

export async function updateTurno(
  fila: number,
  changes: Partial<
    Pick<
      Turno,
      "fecha" | "horaInicio" | "horaFin" | "estado" | "notas" | "actualizadoEn"
    >
  >
): Promise<void> {
  const current = (await readRange(`${TAB_TURNOS}!A${fila}:L${fila}`))[0];
  if (!current) throw new Error("Turno no encontrado");
  const turno = parseTurnoRow(current, fila);
  const updated: Turno = { ...turno, ...changes };
  await writeRange(`${TAB_TURNOS}!A${fila}:L${fila}`, [
    [
      updated.id,
      updated.token,
      updated.fecha,
      updated.horaInicio,
      updated.horaFin,
      updated.nombreCliente,
      updated.telefono,
      updated.email,
      updated.estado,
      updated.notas,
      updated.creadoEn,
      updated.actualizadoEn,
    ],
  ]);
}

// ---------- Inicializacion (usada por scripts/setup-sheet.ts) ----------

export async function ensureHeaders(): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingTitles = new Set(
    (meta.data.sheets || []).map((s) => s.properties?.title)
  );

  const requests: sheets_v4.Schema$Request[] = [];
  for (const title of [TAB_CONFIG, TAB_HORARIOS, TAB_EXCEPCIONES, TAB_TURNOS]) {
    if (!existingTitles.has(title)) {
      requests.push({ addSheet: { properties: { title } } });
    }
  }
  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }

  await writeRange(`${TAB_CONFIG}!A1:B1`, [["clave", "valor"]]);
  await writeRange(`${TAB_HORARIOS}!A1:D1`, [HORARIOS_HEADER]);
  await writeRange(`${TAB_EXCEPCIONES}!A1:E1`, [EXCEPCIONES_HEADER]);
  await writeRange(`${TAB_TURNOS}!A1:L1`, [TURNOS_HEADER]);

  const existingConfig = await readRange(`${TAB_CONFIG}!A2:B`);
  if (existingConfig.length === 0) {
    await setConfig(DEFAULT_CONFIG);
  }
}
