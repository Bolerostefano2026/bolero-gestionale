import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { QUOTE_STATUS } from "@/lib/labels";
import type { Prisma } from "@prisma/client";

export default async function PreventiviPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await auth();
  const canWrite = hasPermission(session?.user.permissions, "quotes:write");
  const { status, q } = await searchParams;

  const where: Prisma.QuoteWhereInput = {};
  if (status) where.status = status as Prisma.EnumQuoteStatusFilter["equals"];
  if (q) {
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { client: { name: { contains: q, mode: "insensitive" } } },
      { client: { surname: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [quotes, pipeline] = await Promise.all([
    prisma.quote.findMany({
      where,
      include: { client: { select: { name: true, surname: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.quote.aggregate({
      where: { status: { in: ["INVIATO", "IN_ATTESA", "APPROVATO"] } },
      _sum: { total: true },
      _count: { id: true },
    }),
  ]);

  const pipelineValue = Number(pipeline._sum.total ?? 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Preventivi</h1>
          <p className="mt-1 text-sm text-ink2">
            {quotes.length} {quotes.length === 1 ? "preventivo" : "preventivi"}
            {pipelineValue > 0 && (
              <span className="ml-2 text-copper font-semibold">
                · Pipeline CHF {pipelineValue.toLocaleString("it-CH", { minimumFractionDigits: 2 })}
              </span>
            )}
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

      <form className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Cerca per numero o cliente…"
          className="flex-1 min-w-[180px] rounded-md border border-fog bg-surface py-2 px-3 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-fog bg-surface px-3 py-2 text-sm outline-none focus:border-copper"
        >
          <option value="">Tutti gli stati</option>
          {Object.entries(QUOTE_STATUS).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-sunken px-4 py-2 text-sm font-medium text-ink2 hover:bg-fog"
        >
          Filtra
        </button>
        {(status || q) && (
          <Link
            href="/preventivi"
            className="text-sm text-ink3 hover:text-copper"
          >
            Azzera
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-fog bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fog bg-sunken text-left text-[11px] uppercase tracking-wide text-ink3">
              <th className="px-4 py-2.5 font-semibold">Numero</th>
              <th className="px-4 py-2.5 font-semibold">Cliente</th>
              <th className="px-4 py-2.5 text-right font-semibold">Totale CHF</th>
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
                    <Link href={`/clienti/${q.clientId}`} className="hover:text-copper">
                      {q.client.name} {q.client.surname}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-right text-ink font-medium">
                    {Number(q.total).toLocaleString("it-CH", { minimumFractionDigits: 2 })}
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
