export const revalidate = 60;

import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
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

      <div className="overflow-x-auto rounded-lg border border-fog bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fog bg-sunken text-left text-[11px] uppercase tracking-wide text-ink3">
              <th className="px-4 py-2.5 font-semibold">Cliente</th>
              <th className="px-4 py-2.5 font-semibold">Prodotto</th>
              <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">Rilevato da</th>
              <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">Foto</th>
              <th className="px-4 py-2.5 font-semibold">Data</th>
            </tr>
          </thead>
          <tbody>
            {measurements.map((m) => {
              const photoCount = Array.isArray(m.photos) ? (m.photos as unknown[]).length : 0;
              return (
                <tr key={m.id} className="border-b border-fog last:border-0 hover:bg-sunken/60">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/misure/${m.id}`}
                      className="font-medium text-ink hover:text-copper"
                    >
                      {m.client.name} {m.client.surname}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-ink2">{m.product.name}</td>
                  <td className="px-4 py-2.5 text-ink3 hidden sm:table-cell">
                    {m.createdBy?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-ink2 hidden sm:table-cell">
                    {photoCount > 0 ? `${photoCount} foto` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-ink3">
                    {m.createdAt.toLocaleDateString("it-IT")}
                  </td>
                </tr>
              );
            })}
            {measurements.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink3">
                  Nessuna misurazione trovata.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
