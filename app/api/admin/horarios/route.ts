import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getHorarios, setHorarios } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  const horarios = await getHorarios();
  return NextResponse.json({ horarios });
}

const horarioSchema = z.object({
  diaSemana: z.number().int().min(0).max(6),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/),
  activo: z.boolean(),
});

const putSchema = z.object({ horarios: z.array(horarioSchema) });

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  for (const h of parsed.data.horarios) {
    if (h.horaInicio >= h.horaFin) {
      return NextResponse.json(
        { error: "La hora de inicio debe ser anterior a la hora de fin" },
        { status: 400 }
      );
    }
  }

  await setHorarios(parsed.data.horarios);
  return NextResponse.json({ ok: true });
}
