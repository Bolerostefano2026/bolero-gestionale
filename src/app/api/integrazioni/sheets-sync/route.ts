import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { exportToSheets, sheetsConfigured } from "@/lib/google-sheets";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "users:manage")) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  if (!sheetsConfigured()) {
    return NextResponse.json(
      { error: "Google Sheets non configurato. Aggiungi GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY e GOOGLE_SHEET_ID nelle variabili d'ambiente." },
      { status: 503 }
    );
  }

  const result = await exportToSheets();
  if (!result.ok) {
    return NextResponse.json({ error: result.errore }, { status: 500 });
  }

  return NextResponse.json({ ok: true, righe: result.righe });
}
