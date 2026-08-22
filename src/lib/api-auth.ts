import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Utility per proteggere le route API.
 * Restituisce la sessione se l'utente ha il permesso richiesto,
 * altrimenti risponde con 401/403.
 */
export async function requirePermission(permission: string) {
  const session = await auth();
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "Non autenticato" }, { status: 401 }) };
  }
  const permissions = (session.user.permissions ?? []) as string[];
  if (!permissions.includes(permission)) {
    return { session: null, error: NextResponse.json({ error: "Accesso negato" }, { status: 403 }) };
  }
  return { session, error: null };
}

export async function requireAnyPermission(...perms: string[]) {
  const session = await auth();
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "Non autenticato" }, { status: 401 }) };
  }
  const permissions = (session.user.permissions ?? []) as string[];
  const ok = perms.some((p) => permissions.includes(p));
  if (!ok) {
    return { session: null, error: NextResponse.json({ error: "Accesso negato" }, { status: 403 }) };
  }
  return { session, error: null };
}
