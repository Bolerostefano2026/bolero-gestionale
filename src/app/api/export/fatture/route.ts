import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  if (!hasPermission(session.user.permissions, "invoices:read")) {
    return NextResponse.json({ error: "Permesso negato" }, { status: 403 });
  }

  const fatture = await prisma.invoice.findMany({
    orderBy: { issuedAt: "desc" },
    include: {
      client: { select: { name: true, surname: true } },
    },
  });

  const header = "Numero,Cliente,Totale CHF,Stato,Data emissione,Scadenza\n";
  const rows = fatture
    .map((f) =>
      [
        f.number,
        `${f.client.name} ${f.client.surname}`,
        Number(f.total).toFixed(2),
        f.status,
        f.issuedAt.toLocaleDateString("it-CH"),
        f.dueDate.toLocaleDateString("it-CH"),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  return new Response(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="fatture.csv"',
    },
  });
}
