import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { QUOTE_STATUS } from "@/lib/labels";

export default async function PreventiviPage() {
  const session = await auth();
  const canWrite = hasPermission(session?.user.permissions, "quotes:write");

  const quotes = await prisma.quote.findMany({
    include: { client: { select: { name: true, surname: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Preventivi</h1>
          <p className="mt-1 text-sm text-ink2">
            {quotes.length} {quotes.length === 1 ? "preventivo" : "preventivi"}
          </p>
        </div>
        {canWrite && (
          <Link
            href="/preventivi/nuovo"
            className="flex items-center gap-1.5 rounded-md bg-copper px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt"
          >
            <Plus size={15} />
            Nuovo preventivo
          </Link>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-fog bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fog bg-sunken text-left text-[11px] uppercase tracking-wide text-ink3">
              <th className="px-4 py-2.5 font-semibold">Numero</th>
              <th className="px-4 py-2.5 font-semibold">Cliente</th>
              <th className="px-4 py-2.5 font-semibold">Totale</th>
              <th className="px-4 py-2.5 font-semibold">Stato</th>
              <th className="px-4 py-2.5 font-semibold">Data</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => {
              const s = QUOTE_STATUS[q.status];
              return (
                <tr
                  key={q.id}
                  className="border-b border-fog last:border-0 hover:bg-sunken/60"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/preventivi/${q.id}`}
                      className="font-medium text-ink hover:text-copper"
                    >
                      {q.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-ink2">
                    {q.client.name} {q.client.surname}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-ink2">
                    CHF {Number(q.total).toLocaleString("it-CH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge label={s.label} tone={s.tone} />
                  </td>
                  <td className="px-4 py-2.5 text-ink3">
                    {q.createdAt.toLocaleDateString("it-IT")}
                  </td>
                </tr>
              );
            })}
            {quotes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink3">
                  Nessun preventivo trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
