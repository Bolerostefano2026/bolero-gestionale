import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  if (!hasPermission(session.user.permissions, "quotes:read")) {
    return NextResponse.json({ error: "Permesso negato" }, { status: 403 });
  }

  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: { select: { name: true, surname: true } } },
  });

  const header = "Numero,Cliente,Totale CHF,Stato,Data creazione\n";
  const rows = quotes
    .map((q) =>
      [
        q.number,
        `${q.client.name} ${q.client.surname}`,
        Number(q.total).toFixed(2),
        q.status,
        q.createdAt.toLocaleDateString("it-CH"),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  return new Response(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="preventivi.csv"',
    },
  });
}
