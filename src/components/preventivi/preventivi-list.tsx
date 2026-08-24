"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QUOTE_STATUS } from "@/lib/labels";
import type { QuoteStatus } from "@prisma/client";

type Quote = {
  id: string;
  number: string;
  clientId: string;
  total: unknown;
  status: QuoteStatus;
  validUntil: Date | null;
  createdAt: Date;
  client: { name: string; surname: string };
};

const STATI_CHIUSI: QuoteStatus[] = ["APPROVATO", "CONVERTITO", "COMPLETATO", "RIFIUTATO"];

function fmt(n: unknown) {
  return Number(n).toLocaleString("it-CH", { minimumFractionDigits: 2 });
}

export function PreventiviList({ quotes }: { quotes: Quote[] }) {
  const router = useRouter();

  if (quotes.length === 0) {
    return (
      <div className="rounded-lg border border-fog bg-surface px-4 py-12 text-center text-ink3">
        Nessun preventivo trovato.
      </div>
    );
  }

  return (
    <>
      {/* MOBILE: card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {quotes.map((q) => {
          const s = QUOTE_STATUS[q.status];
          const scaduto =
            q.validUntil && q.validUntil < new Date() && !STATI_CHIUSI.includes(q.status);
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => router.push(`/preventivi/${q.id}`)}
              className="w-full text-left rounded-xl border border-fog bg-surface overflow-hidden active:bg-sunken"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex items-start justify-between px-4 pt-4 pb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink3">
                      {q.number}
                    </p>
                    <Badge label={s.label} tone={s.tone} />
                  </div>
                  <p className="text-base font-bold text-ink truncate">
                    {q.client.name} {q.client.surname}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <p className="text-base font-bold tabular-nums text-ink">
                    CHF {fmt(q.total)}
                  </p>
                  <ChevronRight size={16} className="text-ink3" />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-fog px-4 py-2 bg-sunken/40">
                <span className="text-xs text-ink3">
                  {q.validUntil ? (
                    <span className={scaduto ? "font-semibold text-danger" : ""}>
                      Scade: {q.validUntil.toLocaleDateString("it-IT")}
                    </span>
                  ) : (
                    q.createdAt.toLocaleDateString("it-IT")
                  )}
                </span>
                <Link
                  href={`/clienti/${q.clientId}`}
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
              <th className="px-4 py-2.5 font-semibold">Stato</th>
              <th className="px-4 py-2.5 font-semibold hidden sm:table-cell">Scadenza</th>
              <th className="px-4 py-2.5 font-semibold">Data</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => {
              const s = QUOTE_STATUS[q.status];
              const scaduto =
                q.validUntil && q.validUntil < new Date() && !STATI_CHIUSI.includes(q.status);
              return (
                <tr
                  key={q.id}
                  className="border-b border-fog last:border-0 hover:bg-sunken/60 cursor-pointer"
                  onClick={() => router.push(`/preventivi/${q.id}`)}
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/preventivi/${q.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-ink hover:text-copper"
                    >
                      {q.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-ink2">
                    <Link
                      href={`/clienti/${q.clientId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-copper"
                    >
                      {q.client.name} {q.client.surname}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-right text-ink font-medium">
                    {fmt(q.total)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge label={s.label} tone={s.tone} />
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    {q.validUntil ? (
                      <span className={scaduto ? "font-semibold text-danger" : "text-ink3"}>
                        {q.validUntil.toLocaleDateString("it-IT")}
                      </span>
                    ) : (
                      <span className="text-ink3">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-ink3">
                    {q.createdAt.toLocaleDateString("it-IT")}
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
