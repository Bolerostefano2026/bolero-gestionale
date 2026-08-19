import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Mail } from "lucide-react";
import { EMAIL_DRAFT_STATUS } from "@/lib/labels";
import { ApprovalActions } from "./approval-actions";

export default async function PromemoriaPage() {
  const session = await auth();

  if (!hasPermission(session?.user.permissions, "invoices:approve_reminder")) {
    return (
      <ComingSoon
        icon={Mail}
        title="Promemoria"
        description="Questa sezione è riservata al titolare."
        phase="Accesso limitato"
      />
    );
  }

  const drafts = await prisma.emailDraft.findMany({
    include: { client: true, invoice: true, createdBy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl">
      <Link
        href="/fatture"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-copper"
      >
        <ArrowLeft size={15} />
        Torna alle fatture
      </Link>

      <h1 className="mb-1 font-display text-2xl font-bold text-ink">
        Promemoria da approvare
      </h1>
      <p className="mb-6 text-sm text-ink2">
        L&apos;AI e il sistema non inviano mai email autonomamente: ogni comunicazione al
        cliente richiede la tua conferma esplicita.
      </p>

      <div className="space-y-4">
        {drafts.map((d) => {
          const s = EMAIL_DRAFT_STATUS[d.status];
          return (
            <div key={d.id} className="rounded-lg border border-fog bg-surface p-5">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {d.client.name} {d.client.surname}
                    {d.invoice && ` — ${d.invoice.number}`}
                  </p>
                  <p className="text-xs text-ink3">
                    Creato da {d.createdBy?.name ?? "sistema"} il{" "}
                    {d.createdAt.toLocaleDateString("it-IT")}
                  </p>
                </div>
                <Badge label={s.label} tone={s.tone} />
              </div>

              <div className="mb-3 rounded-md bg-sunken p-3 text-sm">
                <p className="mb-1 font-semibold text-ink">{d.subject}</p>
                <p className="whitespace-pre-wrap text-ink2">{d.body}</p>
              </div>

              {d.status === "IN_ATTESA_APPROVAZIONE" && (
                <ApprovalActions draftId={d.id} />
              )}
            </div>
          );
        })}
        {drafts.length === 0 && (
          <p className="rounded-lg border border-fog bg-surface p-8 text-center text-sm text-ink3">
            Nessun promemoria in coda.
          </p>
        )}
      </div>
    </div>
  );
}
