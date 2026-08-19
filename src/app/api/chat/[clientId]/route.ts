import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "chat:read")) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { clientId } = await params;
  const userId = session!.user.id;

  const messages = await prisma.message.findMany({
    where: { clientId, type: "INTERNAL" },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const unreadIds = messages
    .filter((m) => m.senderId !== userId && !(m.readBy as string[]).includes(userId))
    .map((m) => m.id);

  if (unreadIds.length > 0) {
    await Promise.all(
      messages
        .filter((m) => unreadIds.includes(m.id))
        .map((m) =>
          prisma.message.update({
            where: { id: m.id },
            data: { readBy: [...(m.readBy as string[]), userId] },
          })
        )
    );
  }

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      sender: m.sender,
      readBy: m.readBy,
    })),
  });
}

const postSchema = z.object({ content: z.string().min(1).max(4000) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "chat:write")) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { clientId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Messaggio non valido" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      clientId,
      senderId: session!.user.id,
      content: parsed.data.content,
      type: "INTERNAL",
      readBy: [session!.user.id],
    },
    include: { sender: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ message });
}
