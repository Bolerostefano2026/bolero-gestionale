import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { QuotePdfDocument } from "@/lib/pdf/quote-document";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "quotes:read")) {
    return new NextResponse("Non autorizzato", { status: 403 });
  }

  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!quote) {
    return new NextResponse("Preventivo non trovato", { status: 404 });
  }

  const buffer = await renderToBuffer(
    <QuotePdfDocument
      number={quote.number}
      createdAt={quote.createdAt}
      validUntil={quote.validUntil}
      client={quote.client}
      items={quote.items as { description: string; quantity: number; unitPrice: number }[]}
      subtotal={Number(quote.subtotal)}
      discount={Number(quote.discount)}
      vatRate={Number(quote.vatRate)}
      total={Number(quote.total)}
      notes={quote.notes}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quote.number}.pdf"`,
    },
  });
}
