import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { propose, type ToolSession } from "../propose";

export const CALENDAR_AGENT = {
  name: "calendar",
  description:
    "Gestisce appuntamenti e promemoria: controlla gli impegni imminenti e propone nuovi appuntamenti.",
  systemPrompt: `Sei il Calendar Agent di BOLERO. Ti occupi solo di calendario e appuntamenti.
Per creare un appuntamento usa proposeCreateAppointment: non crea nulla direttamente, crea
solo una proposta che l'utente deve confermare. Se non hai l'ID del cliente, chiedilo o
segnala che serve prima cercarlo.`,
  buildTools(session: ToolSession) {
    return {
      getUpcomingAppointments: tool({
        description: "Elenca i prossimi appuntamenti in agenda, opzionalmente filtrati per cliente.",
        inputSchema: z.object({
          clientId: z.string().uuid().optional(),
          days: z.number().int().min(1).max(60).default(7),
        }),
        execute: async ({ clientId, days }) => {
          if (!hasPermission(session.permissions, "appointments:read_all")) {
            return { error: "Permesso negato" };
          }
          const until = new Date();
          until.setDate(until.getDate() + days);
          const appointments = await prisma.appointment.findMany({
            where: {
              scheduledAt: { gte: new Date(), lte: until },
              ...(clientId ? { clientId } : {}),
            },
            include: { client: { select: { name: true, surname: true } } },
            orderBy: { scheduledAt: "asc" },
            take: 15,
          });
          return {
            appointments: appointments.map((a) => ({
              id: a.id,
              type: a.type,
              status: a.status,
              scheduledAt: a.scheduledAt,
              client: `${a.client.name} ${a.client.surname}`,
            })),
          };
        },
      }),

      proposeCreateAppointment: tool({
        description:
          "Propone la creazione di un nuovo appuntamento per un cliente già identificato.",
        inputSchema: z.object({
          clientId: z.string().uuid(),
          clientLabel: z.string().describe("Nome e cognome del cliente, per il riepilogo"),
          type: z.enum(["APPUNTAMENTO", "SOPRALLUOGO", "MONTAGGIO", "ALTRO"]),
          scheduledAt: z.string().describe("Data e ora ISO 8601, es. 2026-08-22T09:00:00"),
          notes: z.string().optional(),
        }),
        execute: async (input) => {
          if (!hasPermission(session.permissions, "appointments:write")) {
            return { error: "Permesso negato" };
          }
          const label = {
            APPUNTAMENTO: "appuntamento",
            SOPRALLUOGO: "sopralluogo",
            MONTAGGIO: "montaggio",
            ALTRO: "appuntamento",
          }[input.type];
          const date = new Date(input.scheduledAt).toLocaleDateString("it-IT", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          });
          return propose(
            session,
            "createAppointment",
            `Creare un ${label} per ${input.clientLabel} il ${date}`,
            input
          );
        },
      }),
    };
  },
};
