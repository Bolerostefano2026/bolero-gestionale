import { prisma } from "@/lib/prisma";

/**
 * Tetti di consumo dell'assistente AI.
 *
 * Servono a evitare che un accesso compromesso, un errore o un uso disattento
 * esaurisca il credito Anthropic dell'azienda. I valori sono volutamente
 * generosi per l'uso normale e stretti abbastanza da fermare un abuso.
 */
export const LIMITE_RICHIESTE_UTENTE_GIORNO = Number(
  process.env.AI_LIMITE_UTENTE_GIORNO ?? 60
);
export const LIMITE_RICHIESTE_AZIENDA_GIORNO = Number(
  process.env.AI_LIMITE_AZIENDA_GIORNO ?? 300
);

function inizioGiornata() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export type EsitoLimite =
  | { consentito: true; usateOggi: number }
  | { consentito: false; motivo: string };

/** Verifica i tetti prima di inoltrare una richiesta al modello. */
export async function verificaLimiti(userId: string): Promise<EsitoLimite> {
  const da = inizioGiornata();

  const [usateUtente, usateAzienda] = await Promise.all([
    prisma.aiUsage.count({ where: { userId, kind: "chat", createdAt: { gte: da } } }),
    prisma.aiUsage.count({ where: { kind: "chat", createdAt: { gte: da } } }),
  ]);

  if (usateUtente >= LIMITE_RICHIESTE_UTENTE_GIORNO) {
    return {
      consentito: false,
      motivo: `Hai raggiunto il limite di ${LIMITE_RICHIESTE_UTENTE_GIORNO} richieste all'assistente per oggi. Riprova domani.`,
    };
  }

  if (usateAzienda >= LIMITE_RICHIESTE_AZIENDA_GIORNO) {
    return {
      consentito: false,
      motivo:
        "L'azienda ha raggiunto il limite giornaliero di richieste all'assistente. Riprova domani o contatta il titolare.",
    };
  }

  return { consentito: true, usateOggi: usateUtente };
}

/** Registra una richiesta effettuata, con i token consumati se disponibili. */
export async function registraConsumo(
  userId: string,
  kind: "chat" | "briefing",
  tokens?: { input?: number; output?: number }
) {
  await prisma.aiUsage.create({
    data: {
      userId,
      kind,
      inputTokens: tokens?.input ?? 0,
      outputTokens: tokens?.output ?? 0,
    },
  });
}
