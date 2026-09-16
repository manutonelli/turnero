import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getConfig,
  getExcepciones,
  getHorarios,
  getTurnoByToken,
  getTurnos,
  updateTurno,
} from "@/lib/sheets";
import { calcularHoraFin, verificarSlotDisponible } from "@/lib/booking";

export const dynamic = "force-dynamic";

function turnoPublico(turno: NonNullable<Awaited<ReturnType<typeof getTurnoByToken>>>) {
  return {
    id: turno.id,
    fecha: turno.fecha,
    horaInicio: turno.horaInicio,
    horaFin: turno.horaFin,
    nombreCliente: turno.nombreCliente,
    telefono: turno.telefono,
    email: turno.email,
    estado: turno.estado,
    notas: turno.notas,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const turno = await getTurnoByToken(params.token);
  if (!turno) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ turno: turnoPublico(turno) });
}

const reprogramarSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const turno = await getTurnoByToken(params.token);
    if (!turno) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }
    if (turno.estado === "CANCELADO") {
      return NextResponse.json(
        { error: "Este turno ya fue cancelado" },
        { status: 409 }
      );
    }

    const body = await request.json();
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
        { error: "Ese horario ya no esta disponible. Elegi otro." },
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
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo reprogramar el turno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const turno = await getTurnoByToken(params.token);
    if (!turno) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }
    if (turno.estado === "CANCELADO") {
      return NextResponse.json({ ok: true });
    }
    await updateTurno(turno.fila, {
      estado: "CANCELADO",
      actualizadoEn: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo cancelar el turno" }, { status: 500 });
  }
}
