import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addExcepcion, deleteExcepcion, getExcepciones } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  const excepciones = await getExcepciones();
  return NextResponse.json({ excepciones });
}

const excepcionSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tipo: z.enum(["BLOQUEO", "EXTRA"]),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  nota: z.string().trim().max(200).optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = excepcionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { fecha, tipo, horaInicio, horaFin, nota } = parsed.data;

  if (tipo === "EXTRA" && (!horaInicio || !horaFin)) {
    return NextResponse.json(
      { error: "Un refuerzo puntual necesita hora de inicio y fin" },
      { status: 400 }
    );
  }
  if ((horaInicio && !horaFin) || (!horaInicio && horaFin)) {
    return NextResponse.json(
      { error: "Completa hora de inicio y fin, o dejalas ambas vacias" },
      { status: 400 }
    );
  }

  await addExcepcion({
    fecha,
    tipo,
    horaInicio: horaInicio || "",
    horaFin: horaFin || "",
    nota: nota || "",
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}

const deleteSchema = z.object({ fila: z.number().int().min(2) });

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filaParam = searchParams.get("fila");
  const parsed = deleteSchema.safeParse({ fila: Number(filaParam) });
  if (!parsed.success) {
    return NextResponse.json({ error: "Fila invalida" }, { status: 400 });
  }
  await deleteExcepcion(parsed.data.fila);
  return NextResponse.json({ ok: true });
}
