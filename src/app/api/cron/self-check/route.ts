import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const problemi: string[] = [];
  const now = new Date();

  // 1. Ping DB
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    problemi.push("❌ Database non raggiungibile");
  }

  // 2. Verifica che esistano utenti attivi
  let utentiAttivi = 0;
  try {
    utentiAttivi = await prisma.user.count({ where: { active: true } });
    if (utentiAttivi === 0) problemi.push("⚠️ Nessun utente attivo nel sistema");
  } catch {
    problemi.push("❌ Errore lettura utenti");
  }

  // 3. Verifica fatture scadute non aggiornate (segnale che il cron hourly non gira)
  let fattureBloccate = 0;
  try {
    fattureBloccate = await prisma.invoice.count({
      where: { status: "INVIATA", dueDate: { lt: now } },
    });
    if (fattureBloccate > 0) {
      problemi.push(`⚠️ ${fattureBloccate} fatture scadute ancora con status INVIATA (cron aggiornamento potrebbe essere fermo)`);
    }
  } catch {
    problemi.push("❌ Errore verifica fatture");
  }

  // 4. Controlla se ci sono troppe notifiche non lette (segnale di attività anomala)
  try {
    const notifiche = await prisma.notification.count({ where: { read: false } });
    if (notifiche > 100) {
      problemi.push(`⚠️ ${notifiche} notifiche non lette accumulate`);
    }
  } catch {
    // non critico
  }

  // Manda email solo se ci sono problemi
  if (problemi.length > 0) {
    const apiKey = process.env.RESEND_API_KEY;
    const mittente = process.env.EMAIL_MITTENTE;
    const destinatario = "danieletarantino01@gmail.com";

    if (apiKey && mittente) {
      const html = `
<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8FAFF;font-family:'Helvetica Neue',sans-serif">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0">
  <div style="background:#1a1a2e;padding:24px 28px">
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#8A9CC4">BOLERO GESTIONALE</p>
    <p style="margin:4px 0 0;font-size:20px;font-weight:300;font-style:italic;color:#fff">⚠️ Allerta sistema</p>
  </div>
  <div style="padding:24px 28px">
    <p style="margin:0 0 16px;font-size:14px;color:#334155">
      Il controllo automatico del <strong>${now.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}</strong> ha rilevato i seguenti problemi:
    </p>
    <ul style="margin:0;padding:0 0 0 20px;font-size:14px;color:#334155;line-height:1.8">
      ${problemi.map((p) => `<li>${p}</li>`).join("")}
    </ul>
    <div style="margin-top:24px;padding:16px;background:#FEF3C7;border-radius:8px;border-left:4px solid #F59E0B">
      <p style="margin:0;font-size:13px;color:#92400E">
        <strong>Azione richiesta:</strong> accedi al gestionale e verifica il funzionamento delle sezioni indicate.
      </p>
    </div>
    <p style="margin:20px 0 0;font-size:12px;color:#94A3B8">
      Controllo eseguito il ${now.toLocaleString("it-IT")} ·
      <a href="${process.env.NEXTAUTH_URL ?? ""}/api/health" style="color:#2563EB">Verifica health endpoint</a>
    </p>
  </div>
</div>
</body></html>`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: mittente,
          to: destinatario,
          subject: `🚨 Bolero Gestionale — ${problemi.length} problema${problemi.length > 1 ? "i" : ""} rilevato${problemi.length > 1 ? "i" : ""}`,
          html,
        }),
      });
    }
  }

  return NextResponse.json({
    ok: problemi.length === 0,
    problemi,
    utentiAttivi,
    fattureBloccate,
    ts: now.toISOString(),
  });
}
