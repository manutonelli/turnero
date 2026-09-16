import { NextRequest, NextResponse } from "next/server";
import { getTurnos } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const desde = searchParams.get("desde");
  const incluirCancelados = searchParams.get("incluirCancelados") === "1";

  let turnos = await getTurnos();
  if (desde) {
    turnos = turnos.filter((t) => t.fecha >= desde);
  }
  if (!incluirCancelados) {
    turnos = turnos.filter((t) => t.estado === "CONFIRMADO");
  }
  turnos.sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio));

  return NextResponse.json({ turnos });
}
