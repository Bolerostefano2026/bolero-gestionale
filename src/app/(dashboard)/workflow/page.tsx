import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { WORKFLOW_STAGES } from "@/lib/labels";

export default async function WorkflowPage() {
  const session = await auth();
  const canWrite = hasPermission(session?.user.permissions, "workflow:write");

  const projects = await prisma.project.findMany({
    include: { client: { select: { name: true, surname: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const byStage = new Map<string, typeof projects>();
  for (const stage of WORKFLOW_STAGES) byStage.set(stage.value, []);
  for (const p of projects) byStage.get(p.stage)?.push(p);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Workflow</h1>
          <p className="mt-1 text-sm text-ink2">
            {projects.length} {projects.length === 1 ? "progetto attivo" : "progetti attivi"}
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

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {WORKFLOW_STAGES.map((stage) => {
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
                  {items.map((p) => (
                    <Link
                      key={p.id}
                      href={`/workflow/${p.id}`}
                      className="block rounded-md border border-fog bg-surface p-2.5 text-xs hover:border-copper"
                    >
                      <p className="font-medium text-ink">{p.title}</p>
                      <p className="mt-0.5 text-ink3">
                        {p.client.name} {p.client.surname}
                      </p>
                    </Link>
                  ))}
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
