import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyTitolari, notify } from "@/lib/notify";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const now = new Date();
  const alerts: string[] = [];

  // 1. Fatture scadute non pagate — aggiorna status a SCADUTA e notifica
  await prisma.invoice.updateMany({
    where: { status: "INVIATA", dueDate: { lt: now } },
    data: { status: "SCADUTA" },
  });

  const overdueInvoices = await prisma.invoice.findMany({
    where: { status: "SCADUTA", dueDate: { lt: now } },
    include: { client: { select: { name: true, surname: true } } },
    orderBy: { dueDate: "asc" },
  });

  if (overdueInvoices.length > 0) {
    await notifyTitolari({
      type: "invoice_overdue_summary",
      title: `${overdueInvoices.length} ${overdueInvoices.length === 1 ? "fattura scaduta" : "fatture scadute"}`,
      body: overdueInvoices
        .slice(0, 3)
        .map((i) => `${i.number} — ${i.client.name} ${i.client.surname}`)
        .join(", ") + (overdueInvoices.length > 3 ? ` e altre ${overdueInvoices.length - 3}` : ""),
      link: "/fatture",
    });
    alerts.push(`fatture_scadute: ${overdueInvoices.length}`);
  }

  // 2. Preventivi in attesa da più di 14 giorni
  const staleDate = new Date(now.getTime() - 14 * 86400000);
  const staleQuotes = await prisma.quote.findMany({
    where: { status: "IN_ATTESA", updatedAt: { lt: staleDate } },
    include: { client: { select: { name: true, surname: true } } },
  });

  if (staleQuotes.length > 0) {
    await notifyTitolari({
      type: "quote_stale",
      title: `${staleQuotes.length} ${staleQuotes.length === 1 ? "preventivo" : "preventivi"} senza risposta da 14+ giorni`,
      body: staleQuotes
        .slice(0, 3)
        .map((q) => `${q.number} — ${q.client.name} ${q.client.surname}`)
        .join(", "),
      link: "/preventivi",
    });
    alerts.push(`preventivi_stale: ${staleQuotes.length}`);
  }

  // 3. Appuntamenti di oggi — promemoria mattina
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  const todayAppts = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: todayStart, lte: todayEnd },
      status: { in: ["PROGRAMMATO", "CONFERMATO"] },
    },
    include: {
      client: { select: { name: true, surname: true } },
      assignedTo: { select: { id: true } },
    },
  });

  for (const appt of todayAppts) {
    if (appt.assignedToId) {
      await notify(appt.assignedToId, {
        type: "appointment_today",
        title: `Appuntamento oggi`,
        body: `${appt.client.name} ${appt.client.surname} — ${appt.scheduledAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`,
        link: "/calendario",
      });
    }
  }
  if (todayAppts.length > 0) {
    alerts.push(`appuntamenti_oggi: ${todayAppts.length}`);
  }

  return NextResponse.json({ ok: true, alerts, timestamp: now.toISOString() });
}
