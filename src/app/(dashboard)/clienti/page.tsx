export const revalidate = 60;

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Pagination, PAGE_SIZE, buildPageUrl } from "@/components/ui/pagination";
import { CLIENT_STATUS } from "@/lib/labels";
import type { Prisma } from "@prisma/client";

export default async function ClientiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await auth();
  const canWrite = hasPermission(session?.user.permissions, "clients:write");
  const { q, status, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const where: Prisma.ClientWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { surname: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ];
  }
  if (status) {
    where.status = status as Prisma.EnumClientStatusFilter["equals"];
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.client.count({ where }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Clienti</h1>
          <p className="mt-1 text-sm text-ink2">
            {total} {total === 1 ? "cliente" : "clienti"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission(session?.user.permissions, "clients:read_all") && (
            <a
              href="/api/export/clienti"
              className="flex items-center gap-1.5 rounded-md border border-fog px-3.5 py-2 text-sm font-semibold text-ink2 transition hover:border-copper hover:text-copper"
              download
            >
              ↓ CSV
            </a>
          )}
          {canWrite && (
            <Link
              href="/clienti/nuovo"
              className="flex items-center gap-1.5 rounded-md bg-copper px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt"
            >
              <Plus size={15} />
              Nuovo cliente
            </Link>
          )}
        </div>
      </div>

      <form className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink3"
          />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Cerca per nome, email, telefono…"
            className="w-full rounded-md border border-fog bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-fog bg-surface px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper"
        >
          <option value="">Tutti gli stati</option>
          {Object.entries(CLIENT_STATUS).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-sunken px-4 py-2 text-sm font-medium text-ink2 hover:bg-fog"
        >
          Filtra
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-fog bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fog bg-sunken text-left text-[11px] uppercase tracking-wide text-ink3">
              <th className="px-4 py-2.5 font-semibold">Nome</th>
              <th className="px-4 py-2.5 font-semibold">Contatti</th>
              <th className="px-4 py-2.5 font-semibold">Città</th>
              <th className="px-4 py-2.5 font-semibold">Stato</th>
              <th className="px-4 py-2.5 font-semibold">Creato</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const statusInfo = CLIENT_STATUS[c.status];
              return (
                <tr
                  key={c.id}
                  className="border-b border-fog last:border-0 hover:bg-sunken/60"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/clienti/${c.id}`}
                      className="font-medium text-ink hover:text-copper"
                    >
                      {c.name} {c.surname}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-ink2">
                    {c.phone || c.email || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-ink2">{c.city || "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge label={statusInfo.label} tone={statusInfo.tone} />
                  </td>
                  <td className="px-4 py-2.5 text-ink3">
                    {c.createdAt.toLocaleDateString("it-IT")}
                  </td>
                </tr>
              );
            })}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink3">
                  Nessun cliente trovato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} searchParams={{ q, status }} />
    </div>
  );
}
