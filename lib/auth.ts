import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE_NAME = "turnero_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12; // 12 horas

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Falta la variable de entorno SESSION_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("Falta la variable de entorno ADMIN_PASSWORD");
  }
  return password === expected;
}

export async function createAdminSessionToken(): Promise<string> {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyAdminSessionToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export const ADMIN_SESSION_MAX_AGE = SESSION_DURATION_SECONDS;
