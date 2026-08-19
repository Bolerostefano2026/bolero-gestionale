import Link from "next/link";
import { ArrowLeft, Receipt } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { ComingSoon } from "@/components/ui/coming-soon";
import { InvoiceForm } from "../invoice-form";

export default async function NuovaFatturaPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "invoices:write")) {
    return (
      <ComingSoon
        icon={Receipt}
        title="Nuova fattura"
        description="Non hai i permessi per creare fatture."
        phase="Accesso limitato"
      />
    );
  }

  const { cliente } = await searchParams;

  const [clients, quotes] = await Promise.all([
    prisma.client.findMany({
      select: { id: true, name: true, surname: true },
      orderBy: { surname: "asc" },
    }),
    prisma.quote.findMany({
      where: { status: { in: ["APPROVATO", "CONVERTITO"] } },
      select: { id: true, number: true, clientId: true, total: true },
    }),
  ]);

  return (
    <div className="max-w-2xl">
      <Link
        href="/fatture"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-copper"
      >
        <ArrowLeft size={15} />
        Torna alle fatture
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Nuova fattura</h1>
      <div className="rounded-lg border border-fog bg-surface p-6">
        <InvoiceForm
          clients={clients}
          quotes={quotes.map((q) => ({ ...q, total: Number(q.total) }))}
          defaultClientId={cliente}
        />
      </div>
    </div>
  );
}
