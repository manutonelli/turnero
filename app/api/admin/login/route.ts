import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE_NAME, ADMIN_SESSION_MAX_AGE, checkAdminPassword, createAdminSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const loginSchema = z.object({ password: z.string().min(1) });

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Contrasena requerida" }, { status: 400 });
  }

  let valido: boolean;
  try {
    valido = checkAdminPassword(parsed.data.password);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "El servidor no tiene configurada la contrasena de administrador" },
      { status: 500 }
    );
  }

  if (!valido) {
    return NextResponse.json({ error: "Contrasena incorrecta" }, { status: 401 });
  }

  const token = await createAdminSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return response;
}
