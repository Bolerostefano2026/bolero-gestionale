import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { runOrchestrator } from "@/lib/ai/orchestrator";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const bodySchema = z.object({ message: z.string().min(1).max(2000) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Messaggio non valido" }, { status: 400 });
  }

  try {
    const result = await runOrchestrator(parsed.data.message, session.user);

    const actions =
      result.pendingActionIds.length > 0
        ? await prisma.aiAction.findMany({
            where: { id: { in: result.pendingActionIds } },
          })
        : [];

    return NextResponse.json({
      reply: result.reply,
      actions: actions.map((a) => ({
        id: a.id,
        action: a.action,
        summary: a.summary,
        status: a.status,
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore imprevisto";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
