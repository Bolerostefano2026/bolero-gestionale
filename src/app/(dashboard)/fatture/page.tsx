import Link from "next/link";
import { Plus, Inbox, Receipt } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { ComingSoon } from "@/components/ui/coming-soon";
import { INVOICE_STATUS } from "@/lib/labels";

export default async function FatturePage() {
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

  const [invoices, pendingReminders] = await Promise.all([
    prisma.invoice.findMany({
      include: { client: { select: { name: true, surname: true } } },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.emailDraft.count({ where: { status: "IN_ATTESA_APPROVAZIONE" } }),
  ]);

  const now = new Date();
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

      <div className="overflow-x-auto rounded-lg border border-fog bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fog bg-sunken text-left text-[11px] uppercase tracking-wide text-ink3">
              <th className="px-4 py-2.5 font-semibold">Numero</th>
              <th className="px-4 py-2.5 font-semibold">Cliente</th>
              <th className="px-4 py-2.5 font-semibold">Totale</th>
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
                  className="border-b border-fog last:border-0 hover:bg-sunken/60"
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
                    {inv.client.name} {inv.client.surname}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-ink2">
                    €{Number(inv.total).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2.5 text-ink3">
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
                  Nessuna fattura registrata.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
