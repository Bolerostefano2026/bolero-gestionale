import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Settings } from "lucide-react";
import { ProductForm } from "./product-form";

export default async function ProdottiPage() {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "products:manage")) {
    return (
      <ComingSoon
        icon={Settings}
        title="Prodotti"
        description="Questa sezione è riservata al titolare."
        phase="Accesso limitato"
      />
    );
  }

  const products = await prisma.product.findMany({
    include: { templates: { select: { fields: true } }, _count: { select: { measurements: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <Link
        href="/impostazioni"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-copper"
      >
        <ArrowLeft size={15} />
        Torna a Impostazioni
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Prodotti &amp; schede misure
          </h1>
          <p className="mt-1 text-sm text-ink2">
            Definisci i prodotti e i campi delle rispettive schede di misurazione.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <ProductForm />
      </div>

      <div className="overflow-x-auto rounded-lg border border-fog bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fog bg-sunken text-left text-[11px] uppercase tracking-wide text-ink3">
              <th className="px-4 py-2.5 font-semibold">Prodotto</th>
              <th className="px-4 py-2.5 font-semibold">Categoria</th>
              <th className="px-4 py-2.5 font-semibold">Campi scheda</th>
              <th className="px-4 py-2.5 font-semibold">Misurazioni</th>
              <th className="px-4 py-2.5 font-semibold">Stato</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const fieldCount = Array.isArray(p.templates[0]?.fields)
                ? (p.templates[0].fields as unknown[]).length
                : 0;
              return (
                <tr
                  key={p.id}
                  className="border-b border-fog last:border-0 hover:bg-sunken/60"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/impostazioni/prodotti/${p.id}`}
                      className="font-medium text-ink hover:text-copper"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-ink2">{p.category || "—"}</td>
                  <td className="px-4 py-2.5 text-ink2">
                    {fieldCount} {fieldCount === 1 ? "campo" : "campi"}
                  </td>
                  <td className="px-4 py-2.5 text-ink2">{p._count.measurements}</td>
                  <td className="px-4 py-2.5">
                    <Badge
                      label={p.active ? "Attivo" : "Disattivo"}
                      tone={p.active ? "success" : "neutral"}
                    />
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink3">
                  Nessun prodotto configurato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
