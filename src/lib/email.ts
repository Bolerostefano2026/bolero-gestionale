/**
 * Invio email transazionali tramite Resend.
 *
 * Se la chiave non è configurata l'invio NON avviene e la funzione lo dichiara
 * apertamente: il gestionale non deve mai far credere che una comunicazione sia
 * partita quando non lo è. Il chiamante decide cosa mostrare all'utente.
 */

export const emailConfigurata = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_MITTENTE);

export type EsitoInvio =
  | { inviata: true; id: string }
  | { inviata: false; motivo: string };

export async function inviaEmail(params: {
  a: string;
  oggetto: string;
  testo: string;
}): Promise<EsitoInvio> {
  const apiKey = process.env.RESEND_API_KEY;
  const mittente = process.env.EMAIL_MITTENTE;

  if (!apiKey || !mittente) {
    return {
      inviata: false,
      motivo:
        "Servizio email non configurato: mancano RESEND_API_KEY o EMAIL_MITTENTE. Vedi Impostazioni → Integrazioni.",
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: mittente,
        to: [params.a],
        subject: params.oggetto,
        text: params.testo,
      }),
    });

    if (!res.ok) {
      const dettaglio = await res.text().catch(() => "");
      return {
        inviata: false,
        motivo: `Il servizio email ha rifiutato l'invio (${res.status}). ${dettaglio.slice(0, 200)}`,
      };
    }

    const data = (await res.json()) as { id?: string };
    return { inviata: true, id: data.id ?? "" };
  } catch (e) {
    return {
      inviata: false,
      motivo: e instanceof Error ? e.message : "Errore di rete durante l'invio",
    };
  }
}
