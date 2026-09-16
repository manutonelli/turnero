import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getConfig, setConfig } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getConfig();
  return NextResponse.json({ config });
}

const configSchema = z.object({
  nombreNegocio: z.string().trim().min(1).max(120),
  duracionTurnoMin: z.number().int().min(5).max(480),
  timezone: z.string().trim().min(1),
  anticipacionMinimaHoras: z.number().min(0).max(720),
  diasMaxAnticipacion: z.number().int().min(1).max(365),
});

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = configSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }
  await setConfig(parsed.data);
  return NextResponse.json({ ok: true });
}
