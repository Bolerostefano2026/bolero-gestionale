"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUS } from "@/lib/labels";
import type { InvoiceStatus } from "@prisma/client";

type Invoice = {
  id: string;
  number: string;
  clientId: string;
  total: unknown;
  dueDate: Date;
  status: InvoiceStatus;
  overdue: boolean;
  client: { name: string; surname: string };
};

function fmt(n: unknown) {
  return Number(n).toLocaleString("it-CH", { minimumFractionDigits: 2 });
}

export function FattureList({ invoices }: { invoices: Invoice[] }) {
  const router = useRouter();

  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border border-fog bg-surface px-4 py-12 text-center text-ink3">
        Nessuna fattura trovata.
      </div>
    );
  }

  return (
    <>
      {/* MOBILE: card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {invoices.map((inv) => {
          const s = INVOICE_STATUS[inv.status];
          return (
            <button
              key={inv.id}
              type="button"
              onClick={() => router.push(`/fatture/${inv.id}`)}
              className={`w-full text-left rounded-xl border overflow-hidden active:bg-sunken ${
                inv.overdue ? "border-danger/40 bg-danger/[0.03]" : "border-fog bg-surface"
              }`}
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex items-start justify-between px-4 pt-4 pb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink3">
                      {inv.number}
                    </p>
                    {inv.overdue ? (
                      <Badge label="Scaduta" tone="danger" />
                    ) : (
                      <Badge label={s.label} tone={s.tone} />
                    )}
                  </div>
                  <p className="text-base font-bold text-ink truncate">
                    {inv.client.name} {inv.client.surname}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <p className="text-base font-bold tabular-nums text-ink">
                    CHF {fmt(inv.total)}
                  </p>
                  <ChevronRight size={16} className="text-ink3" />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-fog px-4 py-2 bg-sunken/40">
                <span className="text-xs text-ink3">
                  Scadenza:{" "}
                  <span className={inv.overdue ? "font-semibold text-danger" : ""}>
                    {inv.dueDate.toLocaleDateString("it-IT")}
                  </span>
                </span>
                <Link
                  href={`/clienti/${inv.clientId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-semibold text-copper hover:underline"
                >
                  Cartella →
                </Link>
              </div>
            </button>
          );
        })}
      </div>

      {/* DESKTOP: tabella */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-fog bg-surface">
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
            {invoices.map((inv) => {
              const s = INVOICE_STATUS[inv.status];
              return (
                <tr
                  key={inv.id}
                  className={`border-b border-fog last:border-0 hover:bg-sunken/60 cursor-pointer ${
                    inv.overdue ? "bg-danger/[0.03]" : ""
                  }`}
                  onClick={() => router.push(`/fatture/${inv.id}`)}
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/fatture/${inv.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-ink hover:text-copper"
                    >
                      {inv.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-ink2">
                    <Link
                      href={`/clienti/${inv.clientId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-copper"
                    >
                      {inv.client.name} {inv.client.surname}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-right font-medium text-ink">
                    {fmt(inv.total)}
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
          </tbody>
        </table>
      </div>
    </>
  );
}
