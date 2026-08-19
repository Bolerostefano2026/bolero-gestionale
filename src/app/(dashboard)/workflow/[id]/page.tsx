import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { WORKFLOW_STAGES, WORKFLOW_STAGE_LABEL } from "@/lib/labels";
import { WorkflowStepper } from "./stepper";
import { AdvanceButton } from "./advance-button";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: true,
      quote: true,
      measurement: { include: { product: true } },
      events: { orderBy: { createdAt: "asc" }, include: { triggeredBy: true } },
    },
  });

  if (!project) notFound();

  const canWrite = hasPermission(session?.user.permissions, "workflow:write");
  const currentIndex = WORKFLOW_STAGES.findIndex((s) => s.value === project.stage);
  const nextStage = WORKFLOW_STAGES[currentIndex + 1];

  return (
    <div className="max-w-4xl">
      <Link
        href="/workflow"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-copper"
      >
        <ArrowLeft size={15} />
        Torna al workflow
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">{project.title}</h1>
        <Link
          href={`/clienti/${project.clientId}`}
          className="mt-1 inline-block text-sm text-ink2 hover:text-copper"
        >
          {project.client.name} {project.client.surname}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="rounded-lg border border-fog bg-surface p-5">
          <WorkflowStepper currentStage={project.stage} />
        </div>

        <div className="space-y-6">
          {canWrite && nextStage && (
            <AdvanceButton projectId={project.id} nextStageLabel={nextStage.label} />
          )}

          {(project.quote || project.measurement) && (
            <div className="rounded-lg border border-fog bg-surface p-5">
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink">
                Riferimenti collegati
              </h2>
              <div className="flex flex-wrap gap-2">
                {project.quote && (
                  <Link
                    href={`/preventivi/${project.quote.id}`}
                    className="rounded-md border border-fog px-3 py-1.5 text-sm text-ink2 hover:border-copper hover:text-copper"
                  >
                    Preventivo {project.quote.number}
                  </Link>
                )}
                {project.measurement && (
                  <Link
                    href={`/misure/${project.measurement.id}`}
                    className="rounded-md border border-fog px-3 py-1.5 text-sm text-ink2 hover:border-copper hover:text-copper"
                  >
                    Misure — {project.measurement.product.name}
                  </Link>
                )}
              </div>
            </div>
          )}

          {project.notes && (
            <div className="rounded-lg border border-fog bg-surface p-5">
              <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink">
                Note
              </h2>
              <p className="whitespace-pre-wrap text-sm text-ink2">{project.notes}</p>
            </div>
          )}

          <div className="rounded-lg border border-fog bg-surface p-5">
            <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink">
              Storico transizioni
            </h2>
            <ul className="space-y-3">
              {project.events.map((e) => (
                <li key={e.id} className="text-sm">
                  <p className="text-ink">
                    {e.fromStage ? WORKFLOW_STAGE_LABEL[e.fromStage] : "Creato"}
                    {e.fromStage && " → "}
                    {e.fromStage ? WORKFLOW_STAGE_LABEL[e.toStage] : ""}
                  </p>
                  {e.note && <p className="mt-0.5 text-xs text-ink2">{e.note}</p>}
                  <p className="mt-0.5 text-[11px] text-ink3">
                    {e.createdAt.toLocaleDateString("it-IT", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {e.triggeredBy && ` · ${e.triggeredBy.name}`}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
