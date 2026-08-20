import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  if (!hasPermission(session.user.permissions, "clients:read_all")) {
    return NextResponse.json({ error: "Permesso negato" }, { status: 403 });
  }

  const clienti = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      surname: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      cap: true,
      status: true,
      createdAt: true,
    },
  });

  const header = "Nome,Cognome,Telefono,Email,Indirizzo,Città,CAP,Stato,Data creazione\n";
  const rows = clienti
    .map((c) =>
      [c.name, c.surname, c.phone ?? "", c.email ?? "", c.address ?? "", c.city ?? "", c.cap ?? "", c.status, c.createdAt.toLocaleDateString("it-CH")]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  return new Response(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="clienti.csv"',
    },
  });
}
