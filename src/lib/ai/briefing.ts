import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { WORKFLOW_STAGE_LABEL, QUOTE_STATUS, APPOINTMENT_TYPE } from "@/lib/labels";

const STALE_PROJECT_DAYS = 10;
const STALE_QUOTE_DAYS = 7;

export type BusinessSnapshot = Awaited<ReturnType<typeof collectSnapshot>>;

/**
 * Raccoglie lo stato operativo dell'azienda in un'unica struttura.
 * Nessuna AI coinvolta: sono query dirette, quindi il risultato è sempre
 * verificabile e utilizzabile anche senza chiave AI configurata.
 */
export async function collectSnapshot() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const staleProjectThreshold = new Date(now);
  staleProjectThreshold.setDate(staleProjectThreshold.getDate() - STALE_PROJECT_DAYS);
  const staleQuoteThreshold = new Date(now);
  staleQuoteThreshold.setDate(staleQuoteThreshold.getDate() - STALE_QUOTE_DAYS);

  const [
    appuntamentiOggi,
    appuntamentiSettimana,
    preventiviFermi,
    progettiFermi,
    fattureScadute,
    clientiSenzaSeguito,
    misureSenzaPreventivo,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: { scheduledAt: { gte: todayStart, lte: todayEnd }, status: { not: "ANNULLATO" } },
      include: { client: { select: { name: true, surname: true } } },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.appointment.count({
      where: { scheduledAt: { gt: todayEnd, lte: weekEnd }, status: { not: "ANNULLATO" } },
    }),
    prisma.quote.findMany({
      where: {
        status: { in: ["INVIATO", "IN_ATTESA"] },
        updatedAt: { lt: staleQuoteThreshold },
      },
      include: { client: { select: { name: true, surname: true } } },
      orderBy: { updatedAt: "asc" },
      take: 5,
    }),
    prisma.project.findMany({
      where: { stage: { not: "CHIUSO" }, updatedAt: { lt: staleProjectThreshold } },
      include: { client: { select: { name: true, surname: true } } },
      orderBy: { updatedAt: "asc" },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: { status: "INVIATA", dueDate: { lt: now } },
      include: {
        client: { select: { name: true, surname: true } },
        payments: { select: { amount: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.client.findMany({
      where: {
        status: "LEAD",
        createdAt: { lt: staleQuoteThreshold },
        quotes: { none: {} },
      },
      select: { id: true, name: true, surname: true, createdAt: true },
      take: 5,
    }),
    prisma.measurement.findMany({
      where: { client: { quotes: { none: {} } } },
      include: {
        client: { select: { name: true, surname: true } },
        product: { select: { name: true } },
      },
      take: 5,
    }),
  ]);

  const giorniDa = (d: Date) => Math.floor((now.getTime() - d.getTime()) / 86400000);

  return {
    dataOdierna: now.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    appuntamentiOggi: appuntamentiOggi.map((a) => ({
      ora: a.scheduledAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      tipo: APPOINTMENT_TYPE[a.type] ?? a.type,
      cliente: `${a.client.name} ${a.client.surname}`,
      indirizzo: a.address ?? undefined,
    })),
    appuntamentiProssimaSettimana: appuntamentiSettimana,
    preventiviFermi: preventiviFermi.map((q) => ({
      id: q.id,
      numero: q.number,
      cliente: `${q.client.name} ${q.client.surname}`,
      importo: Number(q.total),
      stato: QUOTE_STATUS[q.status]?.label ?? q.status,
      fermoDaGiorni: giorniDa(q.updatedAt),
    })),
    progettiFermi: progettiFermi.map((p) => ({
      id: p.id,
      titolo: p.title,
      cliente: `${p.client.name} ${p.client.surname}`,
      stadio: WORKFLOW_STAGE_LABEL[p.stage] ?? p.stage,
      fermoDaGiorni: giorniDa(p.updatedAt),
    })),
    fattureScadute: fattureScadute.map((i) => ({
      id: i.id,
      numero: i.number,
      cliente: `${i.client.name} ${i.client.surname}`,
      residuo: Number(i.total) - i.payments.reduce((s, p) => s + Number(p.amount), 0),
      giorniDiRitardo: giorniDa(i.dueDate),
    })),
    leadSenzaPreventivo: clientiSenzaSeguito.map((c) => ({
      id: c.id,
      cliente: `${c.name} ${c.surname}`,
      daGiorni: giorniDa(c.createdAt),
    })),
    misureSenzaPreventivo: misureSenzaPreventivo.map((m) => ({
      id: m.id,
      cliente: `${m.client.name} ${m.client.surname}`,
      prodotto: m.product.name,
    })),
  };
}

export type BriefingPriority = {
  titolo: string;
  motivo: string;
  urgenza: "alta" | "media" | "bassa";
  link?: string;
};

export type Briefing = {
  saluto: string;
  priorita: BriefingPriority[];
  generatoDaAi: boolean;
};

const briefingSchema = z.object({
  saluto: z
    .string()
    .describe("Una frase che riassume la giornata, max 20 parole, tono diretto e professionale"),
  priorita: z
    .array(
      z.object({
        titolo: z.string().describe("Azione concreta da fare, max 10 parole"),
        motivo: z.string().describe("Perché è importante, con i dati concreti, max 25 parole"),
        urgenza: z.enum(["alta", "media", "bassa"]),
        link: z
          .string()
          .optional()
          .describe("Percorso interno pertinente, es. /preventivi/<id> o /fatture"),
      })
    )
    .max(5)
    .describe("Massimo 5 priorità, ordinate dalla più urgente"),
});

/**
 * Sezioni realmente esistenti nel gestionale. Un link generato dall'AI che non
 * ricade qui viene scartato: meglio una priorità senza link che un link rotto.
 */
const SEZIONI_VALIDE = [
  "clienti",
  "calendario",
  "preventivi",
  "misure",
  "workflow",
  "fatture",
  "chat",
] as const;

function isValidPriority(p: { link?: string }): boolean {
  if (!p.link) return true;
  const match = /^\/([a-z]+)(\/[\w-]+)?\/?$/.exec(p.link);
  if (!match) return false;
  return (SEZIONI_VALIDE as readonly string[]).includes(match[1]);
}

/**
 * Genera il briefing operativo. Se l'AI non è configurata o fallisce, produce
 * comunque un briefing basato su regole deterministiche: la dashboard non resta
 * mai vuota per un problema di configurazione.
 */
export async function generateBriefing(): Promise<Briefing> {
  const snapshot = await collectSnapshot();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    try {
      const anthropic = createAnthropic({ apiKey });
      const model = anthropic(process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929");

      const { object } = await generateObject({
        model,
        schema: briefingSchema,
        system: `Sei l'assistente operativo di BOLERO, gestionale di un'azienda di montaggio,
tende e pergole. Parli italiano, tono diretto e concreto, come un bravo capo-ufficio.
Ricevi lo stato reale dell'azienda e devi dire al titolare COSA FARE OGGI.

REGOLA ASSOLUTA — non inventare nulla:
- Usa SOLO i dati che trovi nel JSON che ricevi. Se un'informazione non c'è, non esiste.
- NON suggerire attività su cose che il gestionale non traccia (magazzino, ordini fornitori,
  contabilità, personale): quelle sezioni NON esistono e il titolare non le troverebbe.
- NON inventare percorsi. Gli unici link ammessi sono:
  /clienti, /clienti/<id>, /calendario, /preventivi, /preventivi/<id>, /misure, /misure/<id>,
  /workflow, /workflow/<id>, /fatture, /fatture/<id>, /chat
  Gli <id> devi prenderli dal JSON, mai inventarli. Se non hai un id, usa il percorso generico
  oppure ometti il link.

Regole di contenuto:
- Cita sempre dati concreti presi dal JSON: nomi clienti, numeri documento, importi, giorni.
- Ordina per impatto economico e urgenza reale: soldi non incassati e clienti che si stanno
  raffreddando vengono prima della routine.
- Se un preventivo è fermo da giorni, la priorità è ricontattare quel cliente per nome.
- Se non c'è NULLA di urgente, restituisci pochissime priorità o nessuna, e dillo nel saluto.
  Meglio un briefing corto e vero che uno lungo e inventato.
- Niente frasi motivazionali, niente giri di parole.`,
        prompt: `Stato operativo di oggi:\n${JSON.stringify(snapshot, null, 2)}`,
      });

      return { ...object, priorita: object.priorita.filter(isValidPriority), generatoDaAi: true };
    } catch {
      // Silenzioso: si prosegue col briefing deterministico qui sotto.
    }
  }

  const priorita: BriefingPriority[] = [];

  for (const f of snapshot.fattureScadute.slice(0, 2)) {
    priorita.push({
      titolo: `Sollecitare pagamento ${f.numero}`,
      motivo: `${f.cliente} — CHF ${f.residuo.toLocaleString("it-CH")} in ritardo di ${f.giorniDiRitardo} giorni`,
      urgenza: "alta",
      link: `/fatture/${f.id}`,
    });
  }
  for (const q of snapshot.preventiviFermi.slice(0, 2)) {
    priorita.push({
      titolo: `Ricontattare per ${q.numero}`,
      motivo: `${q.cliente} — CHF ${q.importo.toLocaleString("it-CH")}, fermo da ${q.fermoDaGiorni} giorni`,
      urgenza: "alta",
      link: `/preventivi/${q.id}`,
    });
  }
  for (const p of snapshot.progettiFermi.slice(0, 2)) {
    priorita.push({
      titolo: `Sbloccare "${p.titolo}"`,
      motivo: `${p.cliente} — fermo in ${p.stadio} da ${p.fermoDaGiorni} giorni`,
      urgenza: "media",
      link: `/workflow/${p.id}`,
    });
  }
  for (const m of snapshot.misureSenzaPreventivo.slice(0, 1)) {
    priorita.push({
      titolo: `Preparare preventivo per ${m.cliente}`,
      motivo: `Misure ${m.prodotto} rilevate ma nessun preventivo emesso`,
      urgenza: "media",
      link: `/misure/${m.id}`,
    });
  }

  const saluto =
    snapshot.appuntamentiOggi.length > 0
      ? `Oggi hai ${snapshot.appuntamentiOggi.length} ${snapshot.appuntamentiOggi.length === 1 ? "appuntamento" : "appuntamenti"} e ${priorita.length} ${priorita.length === 1 ? "cosa" : "cose"} da seguire.`
      : priorita.length > 0
        ? `Nessun appuntamento oggi: buon momento per recuperare ${priorita.length} ${priorita.length === 1 ? "pratica" : "pratiche"} in sospeso.`
        : "Tutto in ordine: nessuna scadenza critica e nessun appuntamento oggi.";

  return { saluto, priorita: priorita.slice(0, 5), generatoDaAi: false };
}
