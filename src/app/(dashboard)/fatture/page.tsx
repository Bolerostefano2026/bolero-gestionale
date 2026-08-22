import Link from "next/link";
import { Plus, Inbox, Receipt } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { ComingSoon } from "@/components/ui/coming-soon";
import { INVOICE_STATUS } from "@/lib/labels";
import type { Prisma } from "@prisma/client";

export default async function FatturePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await auth();

  if (!hasPermission(session?.user.permissions, "invoices:read")) {
    return (
      <ComingSoon
        icon={Receipt}
        title="Fatture"
        description="Non hai i permessi per visualizzare questa sezione."
        phase="Accesso limitato"
      />
    );
  }

  const canWrite = hasPermission(session?.user.permissions, "invoices:write");
  const canApprove = hasPermission(session?.user.permissions, "invoices:approve_reminder");
  const { status, q } = await searchParams;

  const where: Prisma.InvoiceWhereInput = {};
  if (status) where.status = status as Prisma.EnumInvoiceStatusFilter["equals"];
  if (q) {
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { client: { name: { contains: q, mode: "insensitive" } } },
      { client: { surname: { contains: q, mode: "insensitive" } } },
    ];
  }

  const now = new Date();

  const [invoices, kpi, pendingReminders] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { client: { select: { name: true, surname: true } } },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.emailDraft.count({ where: { status: "IN_ATTESA_APPROVAZIONE" } }),
  ]);

  const totalPagato = kpi.find((k) => k.status === "PAGATA")?._sum.total ?? 0;
  const totalInviato = kpi.find((k) => k.status === "INVIATA")?._sum.total ?? 0;
  const countScadute = invoices.filter(
    (inv) => inv.status === "INVIATA" && inv.dueDate < now
  ).length;

  const invoicesWithOverdue = invoices.map((inv) => ({
    ...inv,
    overdue: inv.status === "INVIATA" && inv.dueDate < now,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Fatture</h1>
          <p className="mt-1 text-sm text-ink2">
            {invoices.length} {invoices.length === 1 ? "fattura" : "fatture"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/fatture"
            download
            className="flex items-center gap-1.5 rounded-md border border-fog px-3.5 py-2 text-sm font-semibold text-ink2 transition hover:border-copper hover:text-copper"
          >
            ↓ CSV
          </a>
          {canApprove && (
            <Link
              href="/fatture/promemoria"
              className="relative flex items-center gap-1.5 rounded-md border border-fog px-3.5 py-2 text-sm font-medium text-ink2 hover:bg-sunken"
            >
              <Inbox size={15} />
              Promemoria
              {pendingReminders > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-copper px-1 text-[10px] font-bold text-white">
                  {pendingReminders}
                </span>
              )}
            </Link>
          )}
          {canWrite && (
            <Link
              href="/fatture/nuovo"
              className="flex items-center gap-1.5 rounded-md bg-copper px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt"
            >
              <Plus size={15} />
              Nuova fattura
            </Link>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-fog bg-surface p-4">
          <p className="text-[11px] uppercase tracking-wide text-ink3">Incassato</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-success">
            CHF {Number(totalPagato).toLocaleString("it-CH", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-lg border border-fog bg-surface p-4">
          <p className="text-[11px] uppercase tracking-wide text-ink3">Da incassare</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-copper">
            CHF {Number(totalInviato).toLocaleString("it-CH", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-lg border border-fog bg-surface p-4">
          <p className="text-[11px] uppercase tracking-wide text-ink3">Fatture totali</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-ink">
            {kpi.reduce((s, k) => s + k._count.id, 0)}
          </p>
        </div>
        <div className={`rounded-lg border p-4 ${countScadute > 0 ? "border-danger/40 bg-danger/5" : "border-fog bg-surface"}`}>
          <p className="text-[11px] uppercase tracking-wide text-ink3">Scadute</p>
          <p className={`mt-1 text-lg font-bold tabular-nums ${countScadute > 0 ? "text-danger" : "text-ink"}`}>
            {countScadute}
          </p>
        </div>
      </div>

      {/* Filtri */}
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
          {Object.entries(INVOICE_STATUS).map(([value, { label }]) => (
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
          <Link href="/fatture" className="text-sm text-ink3 hover:text-copper">
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
              <th className="px-4 py-2.5 font-semibold">Scadenza</th>
              <th className="px-4 py-2.5 font-semibold">Stato</th>
            </tr>
          </thead>
          <tbody>
            {invoicesWithOverdue.map((inv) => {
              const s = INVOICE_STATUS[inv.status];
              return (
                <tr
                  key={inv.id}
                  className={`border-b border-fog last:border-0 hover:bg-sunken/60 ${inv.overdue ? "bg-danger/[0.03]" : ""}`}
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/fatture/${inv.id}`}
                      className="font-medium text-ink hover:text-copper"
                    >
                      {inv.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-ink2">
                    <Link href={`/clienti/${inv.clientId}`} className="hover:text-copper">
                      {inv.client.name} {inv.client.surname}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-right font-medium text-ink">
                    {Number(inv.total).toLocaleString("it-CH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`px-4 py-2.5 ${inv.overdue ? "font-semibold text-danger" : "text-ink3"}`}>
                    {inv.dueDate.toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-2.5">
                    {inv.overdue ? (
                      <Badge label="Scaduta" tone="danger" />
                    ) : (
                      <Badge label={s.label} tone={s.tone} />
                    )}
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink3">
                  Nessuna fattura trovata.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
