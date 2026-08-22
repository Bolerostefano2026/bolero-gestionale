import Link from "next/link";
import { Plus, Clock } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { WORKFLOW_STAGES } from "@/lib/labels";

export default async function WorkflowPage() {
  const session = await auth();
  const canWrite = hasPermission(session?.user.permissions, "workflow:write");

  const projects = await prisma.project.findMany({
    include: {
      client: { select: { name: true, surname: true } },
      quote: { select: { number: true, total: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const byStage = new Map<string, typeof projects>();
  for (const stage of WORKFLOW_STAGES) byStage.set(stage.value, []);
  for (const p of projects) byStage.get(p.stage)?.push(p);

  const now = new Date();

  // Mostra solo le stage che hanno almeno un progetto, più le prime 5 sempre visibili
  const ALWAYS_VISIBLE = ["CONTATTO", "SOPRALLUOGO", "PREVENTIVO", "MONTAGGIO", "FATTURAZIONE"];
  const visibleStages = WORKFLOW_STAGES.filter(
    (s) => ALWAYS_VISIBLE.includes(s.value) || (byStage.get(s.value)?.length ?? 0) > 0
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Workflow</h1>
          <p className="mt-1 text-sm text-ink2">
            {projects.length} {projects.length === 1 ? "progetto" : "progetti"} · {visibleStages.length}/{WORKFLOW_STAGES.length} fasi visibili
          </p>
        </div>
        {canWrite && (
          <Link
            href="/workflow/nuovo"
            className="flex items-center gap-1.5 rounded-md bg-copper px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt"
          >
            <Plus size={15} />
            Nuovo progetto
          </Link>
        )}
      </div>

      {/* Barra progresso pipeline */}
      {projects.length > 0 && (
        <div className="mb-5 rounded-lg border border-fog bg-surface p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink3">
            Distribuzione pipeline
          </p>
          <div className="flex h-3 overflow-hidden rounded-full">
            {WORKFLOW_STAGES.map((stage) => {
              const count = byStage.get(stage.value)?.length ?? 0;
              if (count === 0) return null;
              const pct = (count / projects.length) * 100;
              const colors: Record<string, string> = {
                CONTATTO: "bg-ink3",
                APPUNTAMENTO: "bg-ink2",
                SOPRALLUOGO: "bg-copper/50",
                MISURE: "bg-copper/70",
                PROGETTAZIONE: "bg-copper",
                PREVENTIVO: "bg-warn/70",
                PREVENTIVO_INVIATO: "bg-warn",
                APPROVAZIONE: "bg-success/50",
                ORDINE: "bg-success/70",
                PRODUZIONE: "bg-success",
                PROGRAMMAZIONE_MONTAGGIO: "bg-success",
                MONTAGGIO: "bg-success",
                FATTURAZIONE: "bg-copper",
                PAGAMENTO: "bg-success",
                CHIUSO: "bg-ink3",
              };
              return (
                <div
                  key={stage.value}
                  className={`${colors[stage.value] ?? "bg-fog"}`}
                  style={{ width: `${pct}%` }}
                  title={`${stage.label}: ${count}`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {WORKFLOW_STAGES.filter((s) => (byStage.get(s.value)?.length ?? 0) > 0).map((s) => (
              <span key={s.value} className="text-xs text-ink3">
                <strong className="text-ink">{byStage.get(s.value)?.length}</strong> {s.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3" style={{ minWidth: `${visibleStages.length * 216}px` }}>
          {visibleStages.map((stage) => {
            const items = byStage.get(stage.value) ?? [];
            return (
              <div key={stage.value} className="w-52 shrink-0">
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-ink2">
                    {stage.label}
                  </h2>
                  <span className="text-xs tabular-nums text-ink3">{items.length}</span>
                </div>
                <div className="space-y-2 rounded-lg border border-fog bg-sunken p-2 min-h-[80px]">
                  {items.map((p) => {
                    const daysSince = Math.floor((now.getTime() - p.updatedAt.getTime()) / 86400000);
                    const isStale = daysSince > 7;
                    return (
                      <Link
                        key={p.id}
                        href={`/workflow/${p.id}`}
                        className={`block rounded-md border bg-surface p-2.5 text-xs hover:border-copper transition-colors ${isStale ? "border-warn/40" : "border-fog"}`}
                      >
                        <p className="font-medium text-ink leading-snug">{p.title}</p>
                        <p className="mt-0.5 text-ink3">
                          {p.client.name} {p.client.surname}
                        </p>
                        {p.quote && (
                          <p className="mt-1 text-ink2 font-medium">
                            CHF {Number(p.quote.total).toLocaleString("it-CH", { minimumFractionDigits: 0 })}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-1 text-ink3">
                          <Clock size={10} />
                          <span className={isStale ? "text-warn font-medium" : ""}>
                            {daysSince === 0 ? "oggi" : `${daysSince}g fa`}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                  {items.length === 0 && (
                    <p className="px-1 py-2 text-center text-[11px] text-ink3">—</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
