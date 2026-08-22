import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Receipt } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { ComingSoon } from "@/components/ui/coming-soon";
import { INVOICE_STATUS } from "@/lib/labels";
import { FileDown } from "lucide-react";
import { PaymentForm } from "./payment-form";
import { ReminderButton } from "./reminder-button";
import { MarkSentButton } from "./mark-sent-button";

function money(n: number) {
  return n.toLocaleString("it-CH", { minimumFractionDigits: 2 });
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!hasPermission(session?.user.permissions, "invoices:read")) {
    return (
      <ComingSoon
        icon={Receipt}
        title="Fattura"
        description="Non hai i permessi per visualizzare questa sezione."
        phase="Accesso limitato"
      />
    );
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      payments: { orderBy: { paidAt: "desc" }, include: { recordedBy: true } },
      quote: { select: { number: true } },
    },
  });

  if (!invoice) notFound();

  const canWrite = hasPermission(session?.user.permissions, "invoices:write");
  const items = invoice.items as { description: string; amount: number }[];
  const paidTotal = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.max(Number(invoice.total) - paidTotal, 0);
  const overdue = invoice.status === "SCADUTA";
  const s = INVOICE_STATUS[invoice.status];

  return (
    <div className="max-w-2xl">
      <Link
        href="/fatture"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-copper"
      >
        <ArrowLeft size={15} />
        Torna alle fatture
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-ink">{invoice.number}</h1>
            {overdue ? (
              <Badge label="Scaduta" tone="danger" />
            ) : (
              <Badge label={s.label} tone={s.tone} />
            )}
          </div>
          <Link
            href={`/clienti/${invoice.clientId}`}
            className="mt-1 inline-block text-sm text-ink2 hover:text-copper"
          >
            {invoice.client.name} {invoice.client.surname}
          </Link>
          {invoice.quote && (
            <p className="mt-0.5 text-xs text-ink3">Da preventivo {invoice.quote.number}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/fatture/${invoice.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-fog px-3 py-1.5 text-sm font-medium text-ink2 hover:border-copper hover:text-copper"
          >
            <FileDown size={14} />
            PDF
          </a>
          {canWrite && invoice.status === "BOZZA" && (
            <MarkSentButton invoiceId={invoice.id} />
          )}
        </div>
      </div>

      {(overdue || invoice.status === "INVIATA") && canWrite && (
        <div className="mb-6">
          <ReminderButton invoiceId={invoice.id} />
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-fog bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fog bg-sunken text-left text-[11px] uppercase tracking-wide text-ink3">
              <th className="px-4 py-2.5 font-semibold">Descrizione</th>
              <th className="px-4 py-2.5 text-right font-semibold">Importo</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-fog last:border-0">
                <td className="px-4 py-2.5 text-ink">{item.description}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ink">
                  CHF {money(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-fog bg-sunken p-4">
          <div className="ml-auto max-w-[240px] space-y-1 text-sm">
            <div className="flex justify-between text-ink2">
              <span>Totale</span>
              <span className="tabular-nums">CHF {money(Number(invoice.total))}</span>
            </div>
            <div className="flex justify-between text-ink2">
              <span>Pagato</span>
              <span className="tabular-nums">CHF {money(paidTotal)}</span>
            </div>
            <div className="flex justify-between border-t border-fog pt-2 font-display text-base font-bold text-ink">
              <span>Residuo</span>
              <span className="tabular-nums">CHF {money(remaining)}</span>
            </div>
          </div>
        </div>
      </div>

      {remaining > 0 && canWrite && invoice.status !== "BOZZA" && (
        <div className="mt-6 rounded-lg border border-fog bg-surface p-5">
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink">
            Registra pagamento
          </h2>
          <PaymentForm invoiceId={invoice.id} remaining={remaining} />
        </div>
      )}

      {invoice.payments.length > 0 && (
        <div className="mt-6 rounded-lg border border-fog bg-surface p-5">
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink">
            Pagamenti registrati
          </h2>
          <ul className="space-y-2">
            {invoice.payments.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-md border border-fog px-3 py-2 text-sm"
              >
                <span className="text-ink">
                  CHF {money(Number(p.amount))} · {p.method}
                </span>
                <span className="text-xs text-ink3">
                  {p.paidAt.toLocaleDateString("it-IT")}
                  {p.recordedBy && ` · ${p.recordedBy.name}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
