import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { ComingSoon } from "@/components/ui/coming-soon";
import { QuoteForm } from "../quote-form";

export default async function NuovoPreventivoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "quotes:write")) {
    return (
      <ComingSoon
        icon={FileText}
        title="Nuovo preventivo"
        description="Non hai i permessi per creare preventivi."
        phase="Accesso limitato"
      />
    );
  }

  const { cliente } = await searchParams;
  const clients = await prisma.client.findMany({
    select: { id: true, name: true, surname: true },
    orderBy: { surname: "asc" },
  });

  return (
    <div className="max-w-2xl">
      <Link
        href="/preventivi"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-copper"
      >
        <ArrowLeft size={15} />
        Torna ai preventivi
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">
        Nuovo preventivo
      </h1>
      <div className="rounded-lg border border-fog bg-surface p-6">
        <QuoteForm clients={clients} defaultClientId={cliente} />
      </div>
    </div>
  );
}
