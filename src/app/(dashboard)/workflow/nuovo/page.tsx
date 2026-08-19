import Link from "next/link";
import { ArrowLeft, GitBranch } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { ComingSoon } from "@/components/ui/coming-soon";
import { ProjectForm } from "../project-form";

export default async function NuovoProgettoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "workflow:write")) {
    return (
      <ComingSoon
        icon={GitBranch}
        title="Nuovo progetto"
        description="Non hai i permessi per creare progetti."
        phase="Accesso limitato"
      />
    );
  }

  const { cliente } = await searchParams;

  const [clients, quotes, measurements] = await Promise.all([
    prisma.client.findMany({
      select: { id: true, name: true, surname: true },
      orderBy: { surname: "asc" },
    }),
    prisma.quote.findMany({ select: { id: true, number: true, clientId: true } }),
    prisma.measurement.findMany({
      select: { id: true, clientId: true, product: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="max-w-xl">
      <Link
        href="/workflow"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-copper"
      >
        <ArrowLeft size={15} />
        Torna al workflow
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Nuovo progetto</h1>
      <div className="rounded-lg border border-fog bg-surface p-6">
        <ProjectForm
          clients={clients}
          quotes={quotes}
          measurements={measurements.map((m) => ({
            id: m.id,
            clientId: m.clientId,
            productName: m.product.name,
          }))}
          defaultClientId={cliente}
        />
      </div>
    </div>
  );
}
