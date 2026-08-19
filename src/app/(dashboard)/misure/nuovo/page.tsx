import Link from "next/link";
import { ArrowLeft, Ruler } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { ComingSoon } from "@/components/ui/coming-soon";
import { MeasurementForm } from "../measurement-form";
import type { FieldDef } from "@/lib/field-types";

export default async function NuovaMisurazionePage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "measurements:write")) {
    return (
      <ComingSoon
        icon={Ruler}
        title="Nuova misurazione"
        description="Non hai i permessi per registrare misurazioni."
        phase="Accesso limitato"
      />
    );
  }

  const { cliente } = await searchParams;

  const [clients, products] = await Promise.all([
    prisma.client.findMany({
      select: { id: true, name: true, surname: true },
      orderBy: { surname: "asc" },
    }),
    prisma.product.findMany({
      where: { active: true },
      include: { templates: { select: { id: true, fields: true } } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="max-w-2xl">
      <Link
        href="/misure"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-copper"
      >
        <ArrowLeft size={15} />
        Torna alle misure
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">
        Nuova misurazione
      </h1>
      <div className="rounded-lg border border-fog bg-surface p-6">
        <MeasurementForm
          clients={clients}
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            templates: p.templates.map((t) => ({
              id: t.id,
              fields: t.fields as unknown as FieldDef[],
            })),
          }))}
          defaultClientId={cliente}
        />
      </div>
    </div>
  );
}
