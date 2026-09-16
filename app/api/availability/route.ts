import { NextRequest, NextResponse } from "next/server";
import { getConfig, getExcepciones, getHorarios, getTurnos } from "@/lib/sheets";
import { calcularDisponibilidad, addDaysStr, nowParts } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const config = await getConfig();
    const { dateStr: hoy } = nowParts(config.timezone);

    const desde = searchParams.get("desde") || hoy;
    const hasta = searchParams.get("hasta") || addDaysStr(hoy, config.diasMaxAnticipacion);

    const [horarios, excepciones, turnos] = await Promise.all([
      getHorarios(),
      getExcepciones(),
      getTurnos(),
    ]);

    const disponibilidad = calcularDisponibilidad({
      desde,
      hasta,
      config,
      horarios,
      excepciones,
      turnos,
    });

    return NextResponse.json({
      config: {
        nombreNegocio: config.nombreNegocio,
        duracionTurnoMin: config.duracionTurnoMin,
        timezone: config.timezone,
      },
      disponibilidad,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo calcular la disponibilidad" },
      { status: 500 }
    );
  }
}
