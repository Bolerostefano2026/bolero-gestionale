"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { WORKFLOW_STAGES } from "@/lib/labels";

const STAGE_ORDER = WORKFLOW_STAGES.map((s) => s.value);

async function requireWrite() {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "workflow:write")) {
    throw new Error("Permesso negato");
  }
  return session!;
}

const createSchema = z.object({
  clientId: z.string().uuid("Seleziona un cliente"),
  title: z.string().min(1, "Il titolo è obbligatorio"),
  quoteId: z.string().uuid().optional().or(z.literal("")),
  measurementId: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function createProject(formData: FormData) {
  const session = await requireWrite();

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
  }

  const { clientId, title, quoteId, measurementId, notes } = parsed.data;

  const project = await prisma.project.create({
    data: {
      clientId,
      title,
      quoteId: quoteId || null,
      measurementId: measurementId || null,
      notes,
      createdById: session.user.id,
      events: {
        create: {
          fromStage: null,
          toStage: "CONTATTO",
          triggeredById: session.user.id,
          source: "manual",
        },
      },
    },
  });

  revalidatePath("/workflow");
  revalidatePath(`/clienti/${clientId}`);
  return project.id;
}

export async function advanceStage(projectId: string, note?: string) {
  const session = await requireWrite();

  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
  const currentIndex = STAGE_ORDER.indexOf(project.stage);
  const nextStage = STAGE_ORDER[currentIndex + 1];

  if (!nextStage) {
    throw new Error("Il progetto ha già raggiunto l'ultimo stato del workflow");
  }

  await prisma.$transaction([
    prisma.project.update({
      where: { id: projectId },
      data: { stage: nextStage as never },
    }),
    prisma.workflowEvent.create({
      data: {
        projectId,
        fromStage: project.stage,
        toStage: nextStage as never,
        triggeredById: session.user.id,
        source: "manual",
        note,
      },
    }),
  ]);

  revalidatePath("/workflow");
  revalidatePath(`/workflow/${projectId}`);
  revalidatePath(`/clienti/${project.clientId}`);
}

export async function updateProjectNotes(projectId: string, notes: string) {
  await requireWrite();
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { notes },
  });
  revalidatePath(`/workflow/${projectId}`);
  revalidatePath(`/clienti/${project.clientId}`);
}
