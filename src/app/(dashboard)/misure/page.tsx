import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export default async function MisurePage() {
  const session = await auth();
  const canWrite = hasPermission(session?.user.permissions, "measurements:write");

  const measurements = await prisma.measurement.findMany({
    include: {
      client: { select: { name: true, surname: true } },
      product: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

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

      <div className="overflow-x-auto rounded-lg border border-fog bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fog bg-sunken text-left text-[11px] uppercase tracking-wide text-ink3">
              <th className="px-4 py-2.5 font-semibold">Cliente</th>
              <th className="px-4 py-2.5 font-semibold">Prodotto</th>
              <th className="px-4 py-2.5 font-semibold">Foto</th>
              <th className="px-4 py-2.5 font-semibold">Data</th>
            </tr>
          </thead>
          <tbody>
            {measurements.map((m) => {
              const photoCount = Array.isArray(m.photos)
                ? (m.photos as unknown[]).length
                : 0;
              return (
                <tr
                  key={m.id}
                  className="border-b border-fog last:border-0 hover:bg-sunken/60"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/misure/${m.id}`}
                      className="font-medium text-ink hover:text-copper"
                    >
                      {m.client.name} {m.client.surname}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-ink2">{m.product.name}</td>
                  <td className="px-4 py-2.5 text-ink2">{photoCount}</td>
                  <td className="px-4 py-2.5 text-ink3">
                    {m.createdAt.toLocaleDateString("it-IT")}
                  </td>
                </tr>
              );
            })}
            {measurements.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-ink3">
                  Nessuna misurazione registrata.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
