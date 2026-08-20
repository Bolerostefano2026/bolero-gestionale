import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { WORKFLOW_STAGE_LABEL } from "@/lib/labels";
import { propose, type ToolSession } from "../propose";

export const SALES_AGENT = {
  name: "sales",
  description:
    "Gestisce lead, clienti e preventivi: trova clienti, riepiloga il loro stato, propone l'approvazione di preventivi in attesa.",
  systemPrompt: `Sei il Sales Agent di BOLERO. Ti occupi solo di clienti, lead e preventivi.
Cerca sempre il cliente prima di parlarne. Per approvare un preventivo usa proposeApproveQuote:
non esegue nulla direttamente, crea solo una proposta che l'utente deve confermare.`,
  buildTools(session: ToolSession) {
    return {
      searchClients: tool({
        description: "Cerca clienti per nome, cognome, telefono o email.",
        inputSchema: z.object({
          query: z.string().describe("Nome, cognome, telefono o email da cercare"),
        }),
        execute: async ({ query }) => {
          if (!hasPermission(session.permissions, "clients:read_all")) {
            return { error: "Permesso negato" };
          }
          const clients = await prisma.client.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { surname: { contains: query, mode: "insensitive" } },
                { phone: { contains: query } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            },
            take: 5,
            select: { id: true, name: true, surname: true, status: true, phone: true },
          });
          return { clients };
        },
      }),

      getClientOverview: tool({
        description:
          "Recupera lo stato completo di un cliente: dati anagrafici, progetti attivi, ultimi preventivi, prossimi appuntamenti.",
        inputSchema: z.object({ clientId: z.string().uuid() }),
        execute: async ({ clientId }) => {
          if (!hasPermission(session.permissions, "clients:read_all")) {
            return { error: "Permesso negato" };
          }
          const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: {
              projects: { orderBy: { updatedAt: "desc" }, take: 3 },
              quotes: { orderBy: { createdAt: "desc" }, take: 3 },
              appointments: {
                where: { scheduledAt: { gte: new Date() } },
                orderBy: { scheduledAt: "asc" },
                take: 3,
              },
            },
          });
          if (!client) return { error: "Cliente non trovato" };
          return {
            client: {
              id: client.id,
              name: client.name,
              surname: client.surname,
              status: client.status,
            },
            projects: client.projects.map((p) => ({
              id: p.id,
              title: p.title,
              stageLabel: WORKFLOW_STAGE_LABEL[p.stage],
            })),
            quotes: client.quotes.map((q) => ({
              id: q.id,
              number: q.number,
              status: q.status,
              total: Number(q.total),
            })),
            upcomingAppointments: client.appointments.map((a) => ({
              id: a.id,
              type: a.type,
              scheduledAt: a.scheduledAt,
            })),
          };
        },
      }),

      proposeApproveQuote: tool({
        description: "Propone l'approvazione di un preventivo in attesa.",
        inputSchema: z.object({
          quoteId: z.string().uuid(),
          quoteNumber: z.string().describe("Numero del preventivo, per il riepilogo"),
        }),
        execute: async (input) => {
          if (!hasPermission(session.permissions, "quotes:approve")) {
            return { error: "Permesso negato" };
          }
          return propose(
            session,
            "approveQuote",
            `Approvare il preventivo ${input.quoteNumber}`,
            input
          );
        },
      }),
    };
  },
};
