import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { executeAiAction, rejectAiAction } from "@/lib/ai/execute";

export const runtime = "nodejs";

const bodySchema = z.object({ decision: z.enum(["confirm", "reject"]) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  try {
    if (parsed.data.decision === "confirm") {
      await executeAiAction(id, session.user);
    } else {
      await rejectAiAction(id, session.user);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Errore imprevisto";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
