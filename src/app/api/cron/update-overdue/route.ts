import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const now = new Date();

  const result = await prisma.invoice.updateMany({
    where: { status: "INVIATA", dueDate: { lt: now } },
    data: { status: "SCADUTA" },
  });

  return NextResponse.json({
    ok: true,
    updated: result.count,
    ts: now.toISOString(),
  });
}
