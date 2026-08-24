export const revalidate = 60;

import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { Pagination, PAGE_SIZE } from "@/components/ui/pagination";
import { QUOTE_STATUS } from "@/lib/labels";
import { PreventiviList } from "@/components/preventivi/preventivi-list";
import type { Prisma } from "@prisma/client";

export default async function PreventiviPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const session = await auth();
  const canWrite = hasPermission(session?.user.permissions, "quotes:write");
  const { status, q, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const where: Prisma.QuoteWhereInput = {};
  if (status) where.status = status as Prisma.EnumQuoteStatusFilter["equals"];
  if (q) {
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { client: { name: { contains: q, mode: "insensitive" } } },
      { client: { surname: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [quotes, total, pipeline] = await Promise.all([
    prisma.quote.findMany({
      where,
      include: { client: { select: { name: true, surname: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.quote.count({ where }),
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
            {total} {total === 1 ? "preventivo" : "preventivi"}
            {pipelineValue > 0 && (
              <span className="ml-2 text-copper font-semibold">
                · Pipeline CHF {pipelineValue.toLocaleString("it-CH", { minimumFractionDigits: 2 })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/preventivi"
            download
            className="flex items-center gap-1.5 rounded-md border border-fog px-3.5 py-2 text-sm font-semibold text-ink2 transition hover:border-copper hover:text-copper"
          >
            ↓ CSV
          </a>
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

      <PreventiviList quotes={quotes} />
      <Pagination page={page} total={total} searchParams={{ status, q }} />
    </div>
  );
}
