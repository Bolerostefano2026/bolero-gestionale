import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_API = [
  "/api/auth",
  "/api/health",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Le route API non pubbliche richiedono autenticazione
  if (pathname.startsWith("/api/")) {
    const isPublic = PUBLIC_API.some((prefix) => pathname.startsWith(prefix));
    if (!isPublic) {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
