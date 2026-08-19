import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import type { ToolSession } from "../propose";

export const ADMIN_AGENT = {
  name: "admin",
  description:
    "Gestisce fatture e pagamenti: individua fatture scadute e preventivi in attesa di approvazione.",
  systemPrompt: `Sei l'Admin Agent di BOLERO. Ti occupi solo di fatture e pagamenti.
Non puoi inviare email né creare promemoria: quello si fa dalla sezione Fatture del
gestionale, che richiede comunque l'approvazione del titolare. Il tuo compito è solo
segnalare la situazione.`,
  buildTools(session: ToolSession) {
    return {
      getFinancialSummary: tool({
        description:
          "Riepiloga la situazione amministrativa: fatture scadute, preventivi in attesa di approvazione, promemoria in coda.",
        inputSchema: z.object({}),
        execute: async () => {
          if (!hasPermission(session.permissions, "invoices:read")) {
            return { error: "Permesso negato" };
          }
          const [overdueInvoices, pendingQuotes, pendingReminders] = await Promise.all([
            prisma.invoice.findMany({
              where: { status: "INVIATA", dueDate: { lt: new Date() } },
              include: { client: { select: { name: true, surname: true } } },
              take: 10,
            }),
            prisma.quote.count({ where: { status: "IN_ATTESA" } }),
            prisma.emailDraft.count({ where: { status: "IN_ATTESA_APPROVAZIONE" } }),
          ]);
          return {
            overdueInvoices: overdueInvoices.map((i) => ({
              number: i.number,
              client: `${i.client.name} ${i.client.surname}`,
              total: Number(i.total),
              dueDate: i.dueDate,
            })),
            pendingQuotesCount: pendingQuotes,
            pendingRemindersCount: pendingReminders,
          };
        },
      }),
    };
  },
};
