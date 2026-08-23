import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { QuoteView } from "./view";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user;

  const [quote, clients, versionCount] = await Promise.all([
    prisma.quote.findUnique({ where: { id }, include: { client: true } }),
    prisma.client.findMany({
      select: { id: true, name: true, surname: true },
      orderBy: { surname: "asc" },
    }),
    prisma.quoteVersion.count({ where: { quoteId: id } }),
  ]);

  if (!quote) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/preventivi"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-copper"
      >
        <ArrowLeft size={15} />
        Torna ai preventivi
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">{quote.number}</h1>
        <Link
          href={`/clienti/${quote.clientId}`}
          className="mt-1 inline-block text-sm text-ink2 hover:text-copper"
        >
          {quote.client.name} {quote.client.surname}
        </Link>
      </div>

      <QuoteView
        quote={{
          id: quote.id,
          number: quote.number,
          clientId: quote.clientId,
          status: quote.status,
          version: quote.version,
          items: quote.items as { description: string; quantity: number; unitPrice: number }[],
          subtotal: Number(quote.subtotal),
          discount: Number(quote.discount),
          vatRate: Number(quote.vatRate),
          total: Number(quote.total),
          notes: quote.notes,
          validUntil: quote.validUntil,
          createdAt: quote.createdAt,
        }}
        clients={clients}
        canWrite={hasPermission(user.permissions, "quotes:write")}
        canApprove={hasPermission(user.permissions, "quotes:approve")}
        canWriteInvoices={hasPermission(user.permissions, "invoices:write")}
        versionCount={versionCount}
      />
    </div>
  );
}
