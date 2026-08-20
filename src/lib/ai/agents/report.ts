import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import type { ToolSession } from "../propose";

export const REPORT_AGENT = {
  name: "report",
  description:
    "Genera report settimanali e statistiche aggregate: fatturato, clienti per stato, preventivi, attività recente.",
  systemPrompt: `Sei il Report Agent di BOLERO. Generi report testuali chiari e sintetici con dati reali.
Usa sempre generaReport prima di rispondere a qualsiasi domanda su statistiche o andamento.
Presenta i dati in modo ordinato con elenchi puntati. Gli importi sono sempre in CHF.`,
  buildTools(session: ToolSession) {
    return {
      generaReport: tool({
        description:
          "Genera un report completo: clienti per stato, preventivi in attesa, fatture scadute, fatturato settimana corrente e mese corrente.",
        inputSchema: z.object({}),
        execute: async () => {
          if (!hasPermission(session.permissions, "stats:read_all")) {
            if (!hasPermission(session.permissions, "stats:read_partial")) {
              return { error: "Permesso negato" };
            }
          }

          const now = new Date();
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

          const [
            clientiPerStato,
            preventiviInAttesa,
            fattureScadute,
            fatturatoSettimana,
            fatturatoMese,
            appuntamentiSettimana,
            clientiNuoviMese,
          ] = await Promise.all([
            prisma.client.groupBy({
              by: ["status"],
              _count: { id: true },
            }),
            prisma.quote.findMany({
              where: { status: "IN_ATTESA" },
              include: { client: { select: { name: true, surname: true } } },
              orderBy: { createdAt: "desc" },
              take: 10,
            }),
            prisma.invoice.findMany({
              where: { status: "INVIATA", dueDate: { lt: now } },
              include: { client: { select: { name: true, surname: true } } },
              orderBy: { dueDate: "asc" },
              take: 10,
            }),
            prisma.invoice.aggregate({
              where: { status: "PAGATA", issuedAt: { gte: weekStart } },
              _sum: { total: true },
            }),
            prisma.invoice.aggregate({
              where: { status: "PAGATA", issuedAt: { gte: monthStart } },
              _sum: { total: true },
            }),
            prisma.appointment.count({
              where: { scheduledAt: { gte: weekStart, lte: now } },
            }),
            prisma.client.count({
              where: { createdAt: { gte: monthStart } },
            }),
          ]);

          return {
            generatoIl: now.toLocaleString("it-CH"),
            clientiPerStato: clientiPerStato.map((g) => ({
              stato: g.status,
              totale: g._count.id,
            })),
            preventiviInAttesa: preventiviInAttesa.map((q) => ({
              numero: q.number,
              cliente: `${q.client.name} ${q.client.surname}`,
              totale: `CHF ${Number(q.total).toFixed(2)}`,
              data: q.createdAt.toLocaleDateString("it-CH"),
            })),
            fattureScadute: fattureScadute.map((f) => ({
              numero: f.number,
              cliente: `${f.client.name} ${f.client.surname}`,
              totale: `CHF ${Number(f.total).toFixed(2)}`,
              scadenza: f.dueDate.toLocaleDateString("it-CH"),
            })),
            fatturatoSettimana: `CHF ${Number(fatturatoSettimana._sum.total ?? 0).toFixed(2)}`,
            fatturatoMese: `CHF ${Number(fatturatoMese._sum.total ?? 0).toFixed(2)}`,
            appuntamentiSettimana,
            clientiNuoviMese,
          };
        },
      }),

      cercaMisureSenzaPreventivo: tool({
        description:
          "Trova clienti che hanno misure salvate ma nessun preventivo creato — potenziali ordini persi.",
        inputSchema: z.object({}),
        execute: async () => {
          if (!hasPermission(session.permissions, "measurements:read")) {
            return { error: "Permesso negato" };
          }
          const clientiConMisure = await prisma.client.findMany({
            where: {
              measurements: { some: {} },
              quotes: { none: {} },
            },
            select: {
              id: true,
              name: true,
              surname: true,
              phone: true,
              _count: { select: { measurements: true } },
              updatedAt: true,
            },
            orderBy: { updatedAt: "desc" },
            take: 20,
          });
          return {
            totale: clientiConMisure.length,
            clienti: clientiConMisure.map((c) => ({
              id: c.id,
              nome: `${c.name} ${c.surname}`,
              telefono: c.phone ?? "",
              misure: c._count.measurements,
              ultimoAggiornamento: c.updatedAt.toLocaleDateString("it-CH"),
            })),
          };
        },
      }),
    };
  },
};
