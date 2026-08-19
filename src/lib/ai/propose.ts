import type { Prisma } from "@prisma/client";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

export type ToolSession = Session["user"];

/**
 * Registers a proposed (not-yet-executed) mutation and returns it to the
 * model. Nothing in the database changes until a human clicks "Conferma" in
 * the UI, which calls the matching case in `EXECUTORS` (src/lib/ai/execute.ts).
 */
export async function propose(
  session: ToolSession,
  action: string,
  summary: string,
  payload: Record<string, unknown>
) {
  const created = await prisma.aiAction.create({
    data: {
      action,
      summary,
      payload: payload as Prisma.InputJsonValue,
      createdById: session.id,
    },
  });
  return {
    pending: true as const,
    actionId: created.id,
    summary,
  };
}
