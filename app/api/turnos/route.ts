import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createTurno, getConfig, getExcepciones, getHorarios, getTurnos } from "@/lib/sheets";
import { calcularHoraFin, nuevoId, nuevoToken, verificarSlotDisponible } from "@/lib/booking";

export const dynamic = "force-dynamic";

const crearTurnoSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  nombreCliente: z.string().trim().min(2).max(120),
  telefono: z.string().trim().min(6).max(30),
  email: z.string().trim().email().optional().or(z.literal("")),
  notas: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = crearTurnoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos", detalles: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { fecha, horaInicio, nombreCliente, telefono, email, notas } = parsed.data;

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
    });

    if (!disponible) {
      return NextResponse.json(
        { error: "Ese horario ya no esta disponible. Elegi otro." },
        { status: 409 }
      );
    }

    const ahora = new Date().toISOString();
    const token = nuevoToken();
    const turno = {
      id: nuevoId(),
      token,
      fecha,
      horaInicio,
      horaFin: calcularHoraFin(horaInicio, config.duracionTurnoMin),
      nombreCliente,
      telefono,
      email: email || "",
      estado: "CONFIRMADO" as const,
      notas: notas || "",
      creadoEn: ahora,
      actualizadoEn: ahora,
    };

    await createTurno(turno);

    return NextResponse.json({ token: turno.token, turno }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo crear el turno" }, { status: 500 });
  }
}
