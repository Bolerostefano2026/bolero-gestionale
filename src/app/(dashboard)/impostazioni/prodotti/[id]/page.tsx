import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { ComingSoon } from "@/components/ui/coming-soon";
import { FieldBuilder } from "./field-builder";
import type { FieldType } from "@/lib/field-types";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "products:manage")) {
    return (
      <ComingSoon
        icon={Settings}
        title="Prodotto"
        description="Questa sezione è riservata al titolare."
        phase="Accesso limitato"
      />
    );
  }

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { templates: true },
  });

  if (!product) notFound();

  const template = product.templates[0];

  return (
    <div className="max-w-3xl">
      <Link
        href="/impostazioni/prodotti"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-copper"
      >
        <ArrowLeft size={15} />
        Torna ai prodotti
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">{product.name}</h1>
        <Badge
          label={product.active ? "Attivo" : "Disattivo"}
          tone={product.active ? "success" : "neutral"}
        />
      </div>
      {product.description && (
        <p className="mb-6 text-sm text-ink2">{product.description}</p>
      )}

      <div className="rounded-lg border border-fog bg-surface p-6">
        <h2 className="mb-1 font-display text-sm font-bold uppercase tracking-wide text-ink">
          Scheda di misurazione
        </h2>
        <p className="mb-4 text-xs text-ink3">
          Definisci i campi che i collaboratori compileranno durante il sopralluogo per
          questo prodotto.
        </p>
        {template && (
          <FieldBuilder
            templateId={template.id}
            initialFields={
              template.fields as unknown as {
                label: string;
                type: FieldType;
                required: boolean;
                unit?: string;
                options?: string[];
              }[]
            }
          />
        )}
      </div>
    </div>
  );
}
