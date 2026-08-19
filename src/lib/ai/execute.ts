import { prisma } from "@/lib/prisma";
import { hasPermission, type Permission } from "@/lib/permissions";
import { WORKFLOW_STAGES } from "@/lib/labels";
import type { Session } from "next-auth";

type ToolSession = Session["user"];

const REQUIRED_PERMISSION: Record<string, Permission> = {
  createAppointment: "appointments:write",
  advanceWorkflow: "workflow:write",
  approveQuote: "quotes:approve",
};

async function runCreateAppointment(
  payload: {
    clientId: string;
    type: string;
    scheduledAt: string;
    notes?: string;
  },
  session: ToolSession
) {
  await prisma.appointment.create({
    data: {
      clientId: payload.clientId,
      type: payload.type as never,
      scheduledAt: new Date(payload.scheduledAt),
      notes: payload.notes,
      createdById: session.id,
    },
  });
}

async function runAdvanceWorkflow(payload: { projectId: string; note?: string }, session: ToolSession) {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: payload.projectId } });
  const idx = WORKFLOW_STAGES.findIndex((s) => s.value === project.stage);
  const nextStage = WORKFLOW_STAGES[idx + 1];
  if (!nextStage) throw new Error("Il progetto ha già raggiunto l'ultimo stato del workflow");

  await prisma.$transaction([
    prisma.project.update({
      where: { id: payload.projectId },
      data: { stage: nextStage.value as never },
    }),
    prisma.workflowEvent.create({
      data: {
        projectId: payload.projectId,
        fromStage: project.stage,
        toStage: nextStage.value as never,
        triggeredById: session.id,
        source: "ai",
        note: payload.note,
      },
    }),
  ]);
}

async function runApproveQuote(payload: { quoteId: string }, session: ToolSession) {
  await prisma.quote.update({
    where: { id: payload.quoteId },
    data: { status: "APPROVATO" },
  });
  await prisma.auditLog.create({
    data: {
      userId: session.id,
      entityType: "quote",
      entityId: payload.quoteId,
      action: "status:APPROVATO",
      source: "ai",
    },
  });
}

const EXECUTORS: Record<
  string,
  (payload: never, session: ToolSession) => Promise<void>
> = {
  createAppointment: runCreateAppointment as never,
  advanceWorkflow: runAdvanceWorkflow as never,
  approveQuote: runApproveQuote as never,
};

export async function executeAiAction(actionId: string, session: ToolSession) {
  const action = await prisma.aiAction.findUniqueOrThrow({ where: { id: actionId } });

  if (action.status !== "PENDING") {
    throw new Error("Questa azione è già stata gestita");
  }

  const requiredPermission = REQUIRED_PERMISSION[action.action];
  if (!requiredPermission || !hasPermission(session.permissions, requiredPermission)) {
    throw new Error("Permesso negato");
  }

  const executor = EXECUTORS[action.action];
  if (!executor) throw new Error(`Azione sconosciuta: ${action.action}`);

  await executor(action.payload as never, session);

  await prisma.aiAction.update({
    where: { id: actionId },
    data: { status: "EXECUTED", decidedById: session.id, decidedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      entityType: "ai_action",
      entityId: actionId,
      action: `execute:${action.action}`,
      source: "ai",
    },
  });
}

export async function rejectAiAction(actionId: string, session: ToolSession) {
  const action = await prisma.aiAction.findUniqueOrThrow({ where: { id: actionId } });
  if (action.status !== "PENDING") {
    throw new Error("Questa azione è già stata gestita");
  }
  await prisma.aiAction.update({
    where: { id: actionId },
    data: { status: "REJECTED", decidedById: session.id, decidedAt: new Date() },
  });
}
