import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_API = ["/api/auth", "/api/health"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname === "/login";
  const isStaticOrNext =
    pathname.startsWith("/_next") || pathname.startsWith("/favicon");

  if (isStaticOrNext) return NextResponse.next();

  // Protegge le route API non pubbliche
  if (pathname.startsWith("/api/")) {
    const isPublicApi = PUBLIC_API.some((p) => pathname.startsWith(p));
    if (!isPublicApi && !isLoggedIn) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
