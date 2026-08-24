export const revalidate = 60;

import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { MisureList } from "@/components/misure/misure-list";
import type { Prisma } from "@prisma/client";

export default async function MisurePage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; prodotto?: string }>;
}) {
  const session = await auth();
  const canWrite = hasPermission(session?.user.permissions, "measurements:write");
  const { cliente, prodotto } = await searchParams;

  const where: Prisma.MeasurementWhereInput = {};
  if (cliente) where.clientId = cliente;
  if (prodotto) where.productId = prodotto;

  const [measurements, clients, products] = await Promise.all([
    prisma.measurement.findMany({
      where,
      include: {
        client: { select: { name: true, surname: true } },
        product: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.client.findMany({
      select: { id: true, name: true, surname: true },
      orderBy: { surname: "asc" },
    }),
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Misure</h1>
          <p className="mt-1 text-sm text-ink2">
            {measurements.length} {measurements.length === 1 ? "misurazione" : "misurazioni"}
          </p>
        </div>
        {canWrite && (
          <Link
            href="/misure/nuovo"
            className="flex items-center gap-1.5 rounded-md bg-copper px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt"
          >
            <Plus size={15} />
            Nuova misurazione
          </Link>
        )}
      </div>

      <form className="mb-4 flex flex-wrap items-center gap-2">
        <select
          name="cliente"
          defaultValue={cliente ?? ""}
          className="flex-1 min-w-[160px] rounded-md border border-fog bg-surface px-3 py-2 text-sm outline-none focus:border-copper"
        >
          <option value="">Tutti i clienti</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name} {c.surname}</option>
          ))}
        </select>
        <select
          name="prodotto"
          defaultValue={prodotto ?? ""}
          className="rounded-md border border-fog bg-surface px-3 py-2 text-sm outline-none focus:border-copper"
        >
          <option value="">Tutti i prodotti</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-sunken px-4 py-2 text-sm font-medium text-ink2 hover:bg-fog"
        >
          Filtra
        </button>
        {(cliente || prodotto) && (
          <Link href="/misure" className="text-sm text-ink3 hover:text-copper">Azzera</Link>
        )}
      </form>

      <MisureList measurements={measurements} />
    </div>
  );
}
