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

/**
 * Invia un'email di notifica rapida ai titolari attivi.
 * Non lancia eccezioni — fallisce silenziosamente per non bloccare l'azione principale.
 */
export async function notificaTitolari(params: {
  oggetto: string;
  titolo: string;
  corpo: string;
  link?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const mittente = process.env.EMAIL_MITTENTE;
  if (!apiKey || !mittente) return;

  // Import lazy per evitare dipendenza circolare con prisma in lib/
  const { prisma } = await import("@/lib/prisma");
  const titolari = await prisma.user.findMany({
    where: { role: { name: "TITOLARE" }, active: true },
    select: { email: true },
  });
  if (titolari.length === 0) return;

  const linkHtml = params.link
    ? `<p style="margin-top:16px"><a href="${params.link}" style="color:#2563EB;font-size:13px">Apri nel gestionale →</a></p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="it"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8FAFF;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<div style="max-width:520px;margin:32px auto;background:#FFFFFF;border-radius:10px;border:1px solid #D5DDF5;overflow:hidden">
  <div style="background:#0F1E3D;padding:20px 28px">
    <p style="margin:0;color:#6B90D4;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase">Notifica Gestionale</p>
  </div>
  <div style="padding:24px 28px">
    <h1 style="margin:0 0 12px;font-size:17px;font-weight:700;color:#0D1B3E">${params.titolo}</h1>
    <p style="margin:0;font-size:14px;color:#3D5080;line-height:1.6">${params.corpo}</p>
    ${linkHtml}
  </div>
  <div style="background:#F8FAFF;border-top:1px solid #D5DDF5;padding:12px 28px">
    <p style="margin:0;font-size:11px;color:#8A9CC4">BOLERO Gestionale · ${new Date().toLocaleDateString("it-IT")}</p>
  </div>
</div>
</body></html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: mittente,
      to: titolari.map((t) => t.email),
      subject: params.oggetto,
      html,
    }),
  }).catch(() => {/* fallisce silenziosamente */});
}

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
