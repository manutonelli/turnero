import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";
  if (isLoginPage || isLoginApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const valid = token ? await verifyAdminSessionToken(token) : false;

  if (!valid) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
