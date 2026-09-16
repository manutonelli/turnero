import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getConfig,
  getExcepciones,
  getHorarios,
  getTurnoById,
  getTurnos,
  updateTurno,
} from "@/lib/sheets";
import { calcularHoraFin, verificarSlotDisponible } from "@/lib/booking";

export const dynamic = "force-dynamic";

const reprogramarSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const turno = await getTurnoById(params.id);
  if (!turno) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reprogramarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }
  const { fecha, horaInicio } = parsed.data;

  const [config, horarios, excepciones, turnos] = await Promise.all([
    getConfig(),
    getHorarios(),
    getExcepciones(),
    getTurnos(),
  ]);

  const disponible = verificarSlotDisponible({
    fecha,
    horaInicio,
    config,
    horarios,
    excepciones,
    turnos,
    excluirTurnoId: turno.id,
  });

  if (!disponible) {
    return NextResponse.json(
      { error: "Ese horario ya no esta disponible" },
      { status: 409 }
    );
  }

  await updateTurno(turno.fila, {
    fecha,
    horaInicio,
    horaFin: calcularHoraFin(horaInicio, config.duracionTurnoMin),
    actualizadoEn: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const turno = await getTurnoById(params.id);
  if (!turno) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }
  await updateTurno(turno.fila, {
    estado: "CANCELADO",
    actualizadoEn: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}
