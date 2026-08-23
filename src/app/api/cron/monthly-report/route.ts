import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inviaEmail, emailConfigurata } from "@/lib/email";

export const runtime = "nodejs";

function money(n: number) {
  return `CHF ${n.toLocaleString("it-CH", { minimumFractionDigits: 2 })}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDate(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const now = new Date();

  // Intervallo: mese scorso (dal 1° all'ultimo giorno)
  const primoDelMese = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const ultimoDelMese = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // Prossimo mese (per appuntamenti futuri)
  const inizioMeseProssimo = new Date(now.getFullYear(), now.getMonth(), 1);
  const fineMeseProssimo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const nomeMese = primoDelMese.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  const nomeMeseProssimo = inizioMeseProssimo.toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  // ── Raccolta dati in parallelo ───────────────────────────────────────────
  const [
    nuoviClienti,
    tuttiClienti,
    appuntamentiSvolti,
    appuntamentiProssimi,
    preventiviFatti,
    preventiviInAttesa,
    fattureEmesse,
    fattureScadute,
    pagamentiRicevuti,
    progettiAttivi,
  ] = await Promise.all([
    // Nuovi clienti nel mese
    prisma.client.findMany({
      where: { createdAt: { gte: primoDelMese, lte: ultimoDelMese } },
      select: { name: true, surname: true, city: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),

    // Totale clienti attivi
    prisma.client.count({ where: { status: "ATTIVO" } }),

    // Appuntamenti svolti nel mese
    prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: primoDelMese, lte: ultimoDelMese },
        status: { in: ["COMPLETATO", "CONFERMATO"] },
      },
      include: { client: { select: { name: true, surname: true } } },
      orderBy: { scheduledAt: "asc" },
    }),

    // Appuntamenti del mese prossimo
    prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: inizioMeseProssimo, lte: fineMeseProssimo },
        status: { in: ["PROGRAMMATO", "CONFERMATO"] },
      },
      include: {
        client: { select: { name: true, surname: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { scheduledAt: "asc" },
    }),

    // Preventivi emessi nel mese
    prisma.quote.findMany({
      where: { createdAt: { gte: primoDelMese, lte: ultimoDelMese } },
      include: { client: { select: { name: true, surname: true } } },
      orderBy: { createdAt: "desc" },
    }),

    // Preventivi ancora in attesa
    prisma.quote.findMany({
      where: { status: "IN_ATTESA" },
      include: { client: { select: { name: true, surname: true } } },
      orderBy: { updatedAt: "asc" },
    }),

    // Fatture emesse nel mese
    prisma.invoice.findMany({
      where: { issuedAt: { gte: primoDelMese, lte: ultimoDelMese } },
      include: { client: { select: { name: true, surname: true } } },
      orderBy: { issuedAt: "desc" },
    }),

    // Fatture scadute non pagate
    prisma.invoice.findMany({
      where: { status: "SCADUTA" },
      include: { client: { select: { name: true, surname: true } } },
      orderBy: { dueDate: "asc" },
    }),

    // Pagamenti ricevuti nel mese
    prisma.payment.findMany({
      where: { paidAt: { gte: primoDelMese, lte: ultimoDelMese } },
      select: { amount: true, method: true },
    }),

    // Progetti attivi (workflow)
    prisma.project.findMany({
      where: { stage: { notIn: ["CHIUSO", "PAGAMENTO"] } },
      include: { client: { select: { name: true, surname: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  // ── Calcoli ─────────────────────────────────────────────────────────────
  const totaleEmesso = fattureEmesse.reduce((s, f) => s + Number(f.total), 0);
  const totaleIncassato = pagamentiRicevuti.reduce((s, p) => s + Number(p.amount), 0);
  const totaleScaduto = fattureScadute.reduce((s, f) => s + Number(f.total), 0);
  const totalePreventivi = preventiviFatti.reduce((s, q) => s + Number(q.total), 0);

  // ── Composizione email HTML ──────────────────────────────────────────────
  const sezione = (titolo: string, contenuto: string) => `
<h2 style="margin:28px 0 10px;font-size:15px;font-weight:700;color:#0D1B3E;border-bottom:1px solid #D5DDF5;padding-bottom:6px;text-transform:uppercase;letter-spacing:0.05em">${titolo}</h2>
${contenuto}`;

  const riga = (label: string, valore: string, highlight = false) =>
    `<tr>
      <td style="padding:5px 0;color:#3D5080;font-size:13px">${label}</td>
      <td style="padding:5px 0;text-align:right;font-weight:${highlight ? "700" : "400"};color:${highlight ? "#0D1B3E" : "#3D5080"};font-size:13px">${valore}</td>
    </tr>`;

  const tabella = (righe: string) =>
    `<table style="width:100%;border-collapse:collapse">${righe}</table>`;

  const elenco = (voci: string[]) =>
    voci.length === 0
      ? `<p style="color:#8A9CC4;font-size:13px;margin:4px 0">—</p>`
      : `<ul style="margin:4px 0;padding-left:18px">${voci.map((v) => `<li style="color:#0D1B3E;font-size:13px;margin:3px 0">${v}</li>`).join("")}</ul>`;

  const html = `<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFF;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<div style="max-width:640px;margin:32px auto;background:#FFFFFF;border-radius:12px;border:1px solid #D5DDF5;overflow:hidden">

  <!-- Header -->
  <div style="background:#0F1E3D;padding:28px 32px">
    <p style="margin:0;color:#6B90D4;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase">Resoconto mensile</p>
    <h1 style="margin:6px 0 0;color:#E8EEFF;font-size:22px;font-weight:300;font-style:italic">${nomeMese}</h1>
  </div>

  <!-- Corpo -->
  <div style="padding:24px 32px 36px">

    ${sezione("📊 Riepilogo economico", tabella(
      riga("Fatture emesse nel mese", money(totaleEmesso), true) +
      riga("Pagamenti incassati", money(totaleIncassato), totaleIncassato > 0) +
      riga("Fatture scadute non pagate", money(totaleScaduto), totaleScaduto > 0) +
      riga("Valore preventivi emessi", money(totalePreventivi))
    ))}

    ${sezione("👥 Clienti", tabella(
      riga("Clienti attivi totali", String(tuttiClienti)) +
      riga("Nuovi clienti nel mese", String(nuoviClienti.length), nuoviClienti.length > 0) +
      riga("Progetti in corso", String(progettiAttivi.length))
    ) + (nuoviClienti.length > 0
      ? `<p style="margin:8px 0 2px;font-size:12px;color:#8A9CC4;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Nuovi acquisiti</p>` +
        elenco(nuoviClienti.map((c) => `${c.name} ${c.surname}${c.city ? ` — ${c.city}` : ""}`))
      : ""
    ))}

    ${sezione(`📅 Appuntamenti svolti — ${nomeMese}`,
      tabella(riga("Totale", String(appuntamentiSvolti.length))) +
      elenco(appuntamentiSvolti.map((a) => `${formatDate(a.scheduledAt)} ${formatTime(a.scheduledAt)} · ${a.client.name} ${a.client.surname}${a.title ? ` — ${a.title}` : ""}`))
    )}

    ${sezione(`📆 Appuntamenti in programma — ${nomeMeseProssimo}`,
      tabella(riga("Totale programmati", String(appuntamentiProssimi.length))) +
      elenco(appuntamentiProssimi.map((a) => {
        const ass = a.assignedTo ? ` [${a.assignedTo.name}]` : "";
        return `${formatDate(a.scheduledAt)} ${formatTime(a.scheduledAt)} · ${a.client.name} ${a.client.surname}${a.title ? ` — ${a.title}` : ""}${ass}`;
      }))
    )}

    ${sezione("📋 Preventivi",
      tabella(
        riga("Emessi nel mese", String(preventiviFatti.length)) +
        riga("In attesa di risposta", String(preventiviInAttesa.length), preventiviInAttesa.length > 0)
      ) +
      (preventiviInAttesa.length > 0
        ? `<p style="margin:8px 0 2px;font-size:12px;color:#8A9CC4;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Da seguire</p>` +
          elenco(preventiviInAttesa.slice(0, 8).map((q) => `${q.number} — ${q.client.name} ${q.client.surname} (${money(Number(q.total))})`))
        : ""
      )
    )}

    ${fattureScadute.length > 0 ? sezione("⚠️ Fatture scadute",
      elenco(fattureScadute.map((f) => `${f.number} — ${f.client.name} ${f.client.surname} · Scad. ${formatDate(f.dueDate)} · ${money(Number(f.total))}`))
    ) : ""}

    ${sezione("🔧 Progetti attivi nel workflow",
      elenco(progettiAttivi.slice(0, 10).map((p) => `${p.client.name} ${p.client.surname} — ${p.title} [${p.stage}]`)) +
      (progettiAttivi.length > 10 ? `<p style="font-size:12px;color:#8A9CC4;margin:4px 0">...e altri ${progettiAttivi.length - 10}</p>` : "")
    )}

    <!-- Footer suggerimenti -->
    <div style="margin-top:28px;background:#F8FAFF;border-radius:8px;padding:16px 20px;border:1px solid #D5DDF5">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#3D5080;text-transform:uppercase;letter-spacing:0.05em">Punti di attenzione per ${nomeMeseProssimo}</p>
      <ul style="margin:0;padding-left:18px">
        ${preventiviInAttesa.length > 0 ? `<li style="font-size:13px;color:#0D1B3E;margin:3px 0">Ricontattare ${preventiviInAttesa.length} ${preventiviInAttesa.length === 1 ? "cliente" : "clienti"} per preventivi in sospeso</li>` : ""}
        ${fattureScadute.length > 0 ? `<li style="font-size:13px;color:#DC2626;margin:3px 0">Recuperare ${fattureScadute.length} ${fattureScadute.length === 1 ? "fattura scaduta" : "fatture scadute"} (${money(totaleScaduto)})</li>` : ""}
        ${appuntamentiProssimi.length > 0 ? `<li style="font-size:13px;color:#0D1B3E;margin:3px 0">${appuntamentiProssimi.length} ${appuntamentiProssimi.length === 1 ? "appuntamento" : "appuntamenti"} già fissati</li>` : ""}
        ${preventiviInAttesa.length === 0 && fattureScadute.length === 0 && appuntamentiProssimi.length === 0 ? `<li style="font-size:13px;color:#059669;margin:3px 0">Tutto in ordine — ottimo mese!</li>` : ""}
      </ul>
    </div>

  </div>

  <!-- Footer -->
  <div style="background:#F8FAFF;border-top:1px solid #D5DDF5;padding:14px 32px;text-align:center">
    <p style="margin:0;font-size:11px;color:#8A9CC4">BOLERO Gestionale · Resoconto generato automaticamente il ${formatDate(now)}</p>
  </div>

</div>
</body>
</html>`;

  // ── Testo plain-text fallback ────────────────────────────────────────────
  const testo = `RESOCONTO MENSILE — ${nomeMese.toUpperCase()}

RIEPILOGO ECONOMICO
Fatture emesse: ${money(totaleEmesso)}
Pagamenti incassati: ${money(totaleIncassato)}
Fatture scadute: ${money(totaleScaduto)}
Valore preventivi: ${money(totalePreventivi)}

CLIENTI
Attivi: ${tuttiClienti} · Nuovi: ${nuoviClienti.length} · Progetti in corso: ${progettiAttivi.length}

APPUNTAMENTI SVOLTI (${nomeMese}): ${appuntamentiSvolti.length}
APPUNTAMENTI PROGRAMMATI (${nomeMeseProssimo}): ${appuntamentiProssimi.length}

PREVENTIVI IN ATTESA: ${preventiviInAttesa.length}
FATTURE SCADUTE: ${fattureScadute.length}

Generato il ${formatDate(now)} dal gestionale BOLERO.
`;

  // ── Recupera email titolare ──────────────────────────────────────────────
  const titolari = await prisma.user.findMany({
    where: { role: "TITOLARE", active: true },
    select: { email: true, name: true },
  });

  if (titolari.length === 0) {
    return NextResponse.json({ ok: false, motivo: "Nessun titolare trovato" });
  }

  if (!emailConfigurata()) {
    return NextResponse.json({ ok: false, motivo: "Email non configurata (RESEND_API_KEY mancante)" });
  }

  const risultati: { email: string; esito: string }[] = [];
  for (const titolare of titolari) {
    const esito = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_MITTENTE,
        to: [titolare.email],
        subject: `📊 Resoconto ${nomeMese} — BOLERO Gestionale`,
        html,
        text: testo,
      }),
    });
    risultati.push({ email: titolare.email, esito: esito.ok ? "inviata" : `errore ${esito.status}` });
  }

  return NextResponse.json({ ok: true, mese: nomeMese, risultati });
}
