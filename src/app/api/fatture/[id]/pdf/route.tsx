import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { InvoicePdfDocument } from "@/lib/pdf/invoice-document";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "invoices:read")) {
    return new NextResponse("Non autorizzato", { status: 403 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!invoice) return new NextResponse("Fattura non trovata", { status: 404 });

  const inv = invoice as typeof invoice & { notes?: string | null };
  const buffer = await renderToBuffer(
    <InvoicePdfDocument
      number={inv.number}
      issuedAt={inv.issuedAt}
      dueDate={inv.dueDate}
      client={inv.client}
      items={inv.items as { description: string; amount: number }[]}
      total={Number(inv.total)}
      notes={inv.notes}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
    },
  });
}
