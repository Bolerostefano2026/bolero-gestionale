"use client";

import { useState } from "react";
import { Pencil, Download } from "lucide-react";
import { QuoteForm } from "../quote-form";
import { StatusActions } from "./status-actions";
import { Badge } from "@/components/ui/badge";
import { QUOTE_STATUS } from "@/lib/labels";

type Item = { description: string; quantity: number; unitPrice: number };

function money(n: number) {
  return n.toLocaleString("it-CH", { minimumFractionDigits: 2 });
}

export function QuoteView({
  quote,
  clients,
  canWrite,
  canApprove,
  versionCount,
}: {
  quote: {
    id: string;
    number: string;
    clientId: string;
    status: string;
    version: number;
    items: Item[];
    subtotal: number;
    discount: number;
    vatRate: number;
    total: number;
    notes: string | null;
    validUntil: Date | null;
    createdAt: Date;
  };
  clients: { id: string; name: string; surname: string }[];
  canWrite: boolean;
  canApprove: boolean;
  versionCount: number;
}) {
  const [editing, setEditing] = useState(false);
  const s = QUOTE_STATUS[quote.status];

  if (editing) {
    return (
      <div className="rounded-lg border border-fog bg-surface p-6">
        <QuoteForm clients={clients} quote={quote} />
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mt-3 text-sm font-medium text-ink2 hover:underline"
        >
          Annulla modifica
        </button>
      </div>
    );
  }

  const taxable = Math.max(quote.subtotal - quote.discount, 0);
  const vatAmount = taxable * (quote.vatRate / 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge label={s.label} tone={s.tone} />
          {quote.status === "BOZZA" && quote.version > 1 && (
            <span className="text-xs text-ink3">
              Versione {quote.version} · {versionCount} precedenti salvate
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/preventivi/${quote.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-fog px-3 py-2 text-sm font-medium text-ink2 hover:bg-sunken"
          >
            <Download size={14} />
            PDF
          </a>
          {canWrite && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-md border border-fog px-3 py-2 text-sm font-medium text-ink2 hover:bg-sunken"
            >
              <Pencil size={14} />
              Modifica
            </button>
          )}
        </div>
      </div>

      <StatusActions
        quoteId={quote.id}
        status={quote.status}
        canApprove={canApprove}
        canWrite={canWrite}
      />

      <div className="overflow-hidden rounded-lg border border-fog bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fog bg-sunken text-left text-[11px] uppercase tracking-wide text-ink3">
              <th className="px-4 py-2.5 font-semibold">Descrizione</th>
              <th className="px-4 py-2.5 text-right font-semibold">Qtà</th>
              <th className="px-4 py-2.5 text-right font-semibold">Prezzo</th>
              <th className="px-4 py-2.5 text-right font-semibold">Totale</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item, i) => (
              <tr key={i} className="border-b border-fog last:border-0">
                <td className="px-4 py-2.5 text-ink">{item.description}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ink2">
                  {item.quantity}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ink2">
                  CHF {money(item.unitPrice)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ink">
                  CHF {money(item.quantity * item.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-fog bg-sunken p-4">
          <div className="ml-auto max-w-[240px] space-y-1 text-sm">
            <div className="flex justify-between text-ink2">
              <span>Subtotale</span>
              <span className="tabular-nums">CHF {money(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink2">
              <span>Sconto</span>
              <span className="tabular-nums">−CHF {money(quote.discount)}</span>
            </div>
            <div className="flex justify-between text-ink2">
              <span>IVA ({quote.vatRate}%)</span>
              <span className="tabular-nums">CHF {money(vatAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-fog pt-2 font-display text-base font-bold text-ink">
              <span>Totale</span>
              <span className="tabular-nums">CHF {money(quote.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {quote.notes && (
        <div className="rounded-lg border border-fog bg-surface p-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink3">
            Note
          </h3>
          <p className="whitespace-pre-wrap text-sm text-ink2">{quote.notes}</p>
        </div>
      )}
    </div>
  );
}
