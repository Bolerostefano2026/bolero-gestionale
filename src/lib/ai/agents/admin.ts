import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { QUOTE_STATUS } from "@/lib/labels";
import type { ToolSession } from "../propose";

export const ADMIN_AGENT = {
  name: "admin",
  description:
    "Gestisce fatture, pagamenti e preventivi in attesa: individua scadenze, insoluti e cosa aspetta una decisione.",
  systemPrompt: `Sei l'Admin Agent di BOLERO. Ti occupi di fatture, pagamenti e preventivi
in attesa di decisione. Rispondi sempre con i DATI CONCRETI che gli strumenti ti restituiscono:
numeri di documento, nomi clienti, importi in euro, date. Non dire mai "non ho i dettagli" senza
prima aver chiamato lo strumento giusto.
Non puoi inviare email né creare promemoria: quelli si generano dalla sezione Fatture, che
richiede comunque l'approvazione del titolare. Il tuo compito è dare il quadro esatto della
situazione amministrativa.`,
  buildTools(session: ToolSession) {
    return {
      getFinancialSummary: tool({
        description:
          "Riepilogo amministrativo completo con DETTAGLI: fatture scadute, preventivi in attesa di approvazione (con numero, cliente e importo), promemoria in coda, totale da incassare.",
        inputSchema: z.object({}),
        execute: async () => {
          if (!hasPermission(session.permissions, "invoices:read")) {
            return { error: "Permesso negato" };
          }
          const now = new Date();
          const [overdueInvoices, unpaidInvoices, pendingQuotes, pendingReminders] =
            await Promise.all([
              prisma.invoice.findMany({
                where: { status: "INVIATA", dueDate: { lt: now } },
                include: {
                  client: { select: { name: true, surname: true } },
                  payments: { select: { amount: true } },
                },
                orderBy: { dueDate: "asc" },
                take: 10,
              }),
              prisma.invoice.findMany({
                where: { status: "INVIATA", dueDate: { gte: now } },
                include: { client: { select: { name: true, surname: true } } },
                take: 10,
              }),
              prisma.quote.findMany({
                where: { status: { in: ["IN_ATTESA", "INVIATO"] } },
                include: { client: { select: { name: true, surname: true } } },
                orderBy: { updatedAt: "asc" },
                take: 10,
              }),
              prisma.emailDraft.count({ where: { status: "IN_ATTESA_APPROVAZIONE" } }),
            ]);

          const residuo = (inv: { total: unknown; payments: { amount: unknown }[] }) =>
            Number(inv.total) - inv.payments.reduce((s, p) => s + Number(p.amount), 0);

          return {
            fattureScadute: overdueInvoices.map((i) => ({
              numero: i.number,
              cliente: `${i.client.name} ${i.client.surname}`,
              importoResiduo: residuo(i),
              scadenza: i.dueDate.toLocaleDateString("it-IT"),
              giorniDiRitardo: Math.floor(
                (now.getTime() - i.dueDate.getTime()) / 86400000
              ),
            })),
            fattureDaIncassare: unpaidInvoices.map((i) => ({
              numero: i.number,
              cliente: `${i.client.name} ${i.client.surname}`,
              importo: Number(i.total),
              scadenza: i.dueDate.toLocaleDateString("it-IT"),
            })),
            preventiviInAttesa: pendingQuotes.map((q) => ({
              id: q.id,
              numero: q.number,
              cliente: `${q.client.name} ${q.client.surname}`,
              importo: Number(q.total),
              stato: QUOTE_STATUS[q.status]?.label ?? q.status,
              inAttesaDaGiorni: Math.floor(
                (now.getTime() - q.updatedAt.getTime()) / 86400000
              ),
            })),
            promemoriaInCoda: pendingReminders,
          };
        },
      }),
    };
  },
};
