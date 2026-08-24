import { googleConfigured, getGoogleAccessToken } from "./google-auth";
import { prisma } from "./prisma";
import { money } from "./config";

export function sheetsConfigured(): boolean {
  return googleConfigured() && Boolean(process.env.GOOGLE_SHEET_ID);
}

type SyncResult = { ok: boolean; righe?: number; errore?: string };

export async function exportToSheets(): Promise<SyncResult> {
  if (!sheetsConfigured()) return { ok: false, errore: "Non configurato" };
  const token = await getGoogleAccessToken("https://www.googleapis.com/auth/spreadsheets");
  if (!token) return { ok: false, errore: "Autenticazione Google fallita" };

  const sheetId = process.env.GOOGLE_SHEET_ID!;
  const now = new Date().toLocaleString("it-CH");

  const [clienti, preventivi, fatture] = await Promise.all([
    prisma.client.findMany({
      select: { name: true, surname: true, phone: true, email: true, city: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.quote.findMany({
      include: { client: { select: { name: true, surname: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.invoice.findMany({
      include: { client: { select: { name: true, surname: true } } },
      orderBy: { issuedAt: "desc" },
      take: 500,
    }),
  ]);

  const STATUS_CLIENT: Record<string, string> = {
    LEAD: "Lead", ATTIVO: "Attivo", IN_LAVORAZIONE: "In lavorazione",
    CHIUSO: "Chiuso", INATTIVO: "Inattivo",
  };

  const clientiRows = [
    [`Clienti — aggiornato il ${now}`],
    ["Nome", "Cognome", "Telefono", "Email", "Città", "Stato", "Inserito il"],
    ...clienti.map((c) => [
      c.name, c.surname, c.phone ?? "", c.email ?? "",
      c.city ?? "", STATUS_CLIENT[c.status] ?? c.status,
      c.createdAt.toLocaleDateString("it-CH"),
    ]),
  ];

  const preventiviRows = [
    [`Preventivi — aggiornato il ${now}`],
    ["Numero", "Cliente", "Stato", "Totale CHF", "Data"],
    ...preventivi.map((q) => [
      q.number,
      `${q.client.name} ${q.client.surname}`,
      q.status,
      Number(q.total).toFixed(2),
      q.createdAt.toLocaleDateString("it-CH"),
    ]),
  ];

  const fattureRows = [
    [`Fatture — aggiornato il ${now}`],
    ["Numero", "Cliente", "Stato", "Totale CHF", "Scadenza"],
    ...fatture.map((f) => [
      f.number,
      `${f.client.name} ${f.client.surname}`,
      f.status,
      Number(f.total).toFixed(2),
      f.dueDate ? f.dueDate.toLocaleDateString("it-CH") : "",
    ]),
  ];

  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;

  // Prima svuota le 3 schede, poi scrive
  await fetch(`${baseUrl}/values:batchClear`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ranges: ["Clienti!A:Z", "Preventivi!A:Z", "Fatture!A:Z"] }),
  });

  const res = await fetch(`${baseUrl}/values:batchUpdate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      valueInputOption: "RAW",
      data: [
        { range: "Clienti!A1", values: clientiRows },
        { range: "Preventivi!A1", values: preventiviRows },
        { range: "Fatture!A1", values: fattureRows },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "errore sconosciuto");
    return { ok: false, errore: err.slice(0, 300) };
  }

  return { ok: true, righe: clienti.length + preventivi.length + fatture.length };
}
