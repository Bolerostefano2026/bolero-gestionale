import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { WORKFLOW_STAGE_LABEL, WORKFLOW_STAGES } from "@/lib/labels";
import { propose, type ToolSession } from "../propose";

export const WORKFLOW_AGENT = {
  name: "workflow",
  description:
    "Controlla lo stato dei lavori: stadio del workflow, scadenze, progetti fermi da tempo. Propone avanzamenti di stadio.",
  systemPrompt: `Sei il Workflow Agent di BOLERO. Ti occupi solo dello stato di avanzamento
dei progetti (la macchina a stati Contatto → ... → Chiuso). Per avanzare un progetto usa
proposeAdvanceWorkflow: non modifica nulla direttamente, crea solo una proposta che l'utente
deve confermare. Non è mai possibile saltare stadi.`,
  buildTools(session: ToolSession) {
    return {
      getStalledProjects: tool({
        description:
          "Elenca i progetti che non hanno ricevuto aggiornamenti da più di N giorni (default 14), utile per capire cosa è fermo.",
        inputSchema: z.object({
          days: z.number().int().min(1).max(90).default(14),
        }),
        execute: async ({ days }) => {
          if (!hasPermission(session.permissions, "workflow:read")) {
            return { error: "Permesso negato" };
          }
          const threshold = new Date();
          threshold.setDate(threshold.getDate() - days);
          const projects = await prisma.project.findMany({
            where: { stage: { not: "CHIUSO" }, updatedAt: { lt: threshold } },
            include: { client: { select: { name: true, surname: true } } },
            orderBy: { updatedAt: "asc" },
            take: 10,
          });
          return {
            projects: projects.map((p) => ({
              id: p.id,
              title: p.title,
              stageLabel: WORKFLOW_STAGE_LABEL[p.stage],
              client: `${p.client.name} ${p.client.surname}`,
              lastUpdate: p.updatedAt,
            })),
          };
        },
      }),

      proposeAdvanceWorkflow: tool({
        description:
          "Propone di far avanzare un progetto allo stadio successivo del workflow.",
        inputSchema: z.object({
          projectId: z.string().uuid(),
          projectLabel: z.string().describe("Titolo del progetto, per il riepilogo"),
          note: z.string().optional(),
        }),
        execute: async (input) => {
          if (!hasPermission(session.permissions, "workflow:write")) {
            return { error: "Permesso negato" };
          }
          const project = await prisma.project.findUnique({ where: { id: input.projectId } });
          if (!project) return { error: "Progetto non trovato" };
          const idx = WORKFLOW_STAGES.findIndex((s) => s.value === project.stage);
          const next = WORKFLOW_STAGES[idx + 1];
          if (!next) return { error: "Il progetto è già all'ultimo stadio del workflow" };
          return propose(
            session,
            "advanceWorkflow",
            `Far avanzare "${input.projectLabel}" a "${next.label}"`,
            input
          );
        },
      }),
    };
  },
};
