import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractText, getDocumentProxy } from "unpdf";

export const runtime = "nodejs";

type ExtractedItem = { description: string; quantity: number; unitPrice: number };

function normalizeNumber(raw: string): number {
  const cleaned = raw.replace(/[^\d.,]/g, "").replace(/'/g, "");
  // In Svizzera l'apostrofo è il separatore delle migliaia (già rimosso sopra)
  // e il punto è il decimale; alcuni documenti usano invece la virgola.
  const normalized =
    cleaned.includes(",") && !cleaned.includes(".") ? cleaned.replace(",", ".") : cleaned.replace(/,/g, "");
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

// Righe da ignorare: intestazioni, contatti, totali — non sono voci di preventivo.
const SKIP_LINE =
  /totale|subtotale|imponibile|\biva\b|sconto|preventivo n\.|^data:|p\.?\s*iva|partita iva|\btel\b|\bfax\b|@|www\.|iban|\bvia\b|\bviale\b|\bpiazza\b/i;

/**
 * Estrazione locale, senza AI: legge il testo del PDF e prova a riconoscere righe
 * "descrizione [quantità] prezzo" con euristiche su numeri e separatori svizzeri.
 * Meno affidabile della lettura AI su layout complessi o documenti scansionati,
 * ma non dipende da crediti API e non va mai in errore silenzioso.
 */
function extractItemsFromText(text: string): ExtractedItem[] {
  const items: ExtractedItem[] = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const NUM = String.raw`(?:CHF|Fr\.?)?\s*([\d'.,]+)`;
  const rowRe = new RegExp(`^(.*?)\\s+${NUM}(?:\\s+${NUM})?(?:\\s+${NUM})?$`, "i");

  for (const line of lines) {
    if (SKIP_LINE.test(line)) continue;
    const m = line.match(rowRe);
    if (!m) continue;

    const description = m[1].trim();
    if (!description || description.length < 2) continue;

    const rawNums = [m[2], m[3], m[4]].filter(Boolean) as string[];
    // Scarta se nessun numero ha un separatore decimale: filtra numeri di
    // telefono, CAP e altri interi "nudi" che non sono prezzi.
    if (!rawNums.some((t) => /[.,]/.test(t))) continue;
    const nums = rawNums.map(normalizeNumber);

    let quantity = 1;
    let unitPrice = 0;
    if (nums.length >= 3) {
      [quantity, unitPrice] = nums;
    } else if (nums.length === 2) {
      const [a, b] = nums;
      if (Number.isInteger(a) && a > 0 && a < 100 && a <= b) {
        quantity = a;
        unitPrice = b;
      } else {
        unitPrice = b;
      }
    } else {
      unitPrice = nums[0];
    }
    if (unitPrice <= 0) continue;
    items.push({ description, quantity, unitPrice });
  }
  return items;
}

async function extractWithAnthropic(file: File) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = file.type || "image/jpeg";
  const isPdf = mediaType === "application/pdf";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileBlock: any = isPdf
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
    : { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } };

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          fileBlock,
          {
            type: "text",
            text: `Analizza questo preventivo del fornitore ed estrai le voci.
Restituisci SOLO un JSON valido con questa struttura (nessun testo extra):
{
  "items": [
    { "description": "descrizione voce", "quantity": 1, "unitPrice": 0.00 }
  ],
  "notes": "eventuali note rilevanti"
}
Le quantità devono essere numeri. I prezzi devono essere numeri senza simbolo valuta.
Se non riesci a determinare un campo, usa valori di default (quantity: 1, unitPrice: 0).`,
          },
        ] as Anthropic.MessageParam["content"],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : text);
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "File mancante" }, { status: 400 });
  }

  const mediaType = file.type || "";
  const isPdf = mediaType === "application/pdf";

  // 1. Prova la lettura AI se la chiave è configurata: qualità migliore,
  //    capisce anche foto/scansioni e layout complessi.
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const parsed = await extractWithAnthropic(file);
      return NextResponse.json({ ...parsed, source: "ai" });
    } catch (err) {
      console.error("[preventivi/extract] Estrazione AI fallita, provo il fallback locale:", err);
      // continua sotto: fallback locale, mai un 500 silenzioso
    }
  }

  // 2. Fallback locale senza AI: funziona solo sui PDF (lettura testo).
  //    Non richiede crediti API e restituisce sempre un JSON valido.
  if (isPdf) {
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await getDocumentProxy(new Uint8Array(bytes));
      const { text } = await extractText(pdf, { mergePages: true });

      const items = extractItemsFromText(text);
      if (items.length > 0) {
        return NextResponse.json({ items, source: "local" });
      }
      return NextResponse.json(
        { error: "Non sono riuscito a riconoscere le voci nel PDF senza AI. Inserisci le voci manualmente." },
        { status: 422 }
      );
    } catch (err) {
      console.error("[preventivi/extract] Fallback locale PDF fallito:", err);
      return NextResponse.json({ error: "Impossibile leggere il PDF. Inserisci le voci manualmente." }, { status: 422 });
    }
  }

  // Le immagini richiedono la lettura AI: non esiste OCR locale in questo fallback.
  return NextResponse.json(
    {
      error: process.env.ANTHROPIC_API_KEY
        ? "Lettura AI non disponibile al momento (crediti esauriti o servizio non raggiungibile). Carica il PDF, se disponibile, oppure inserisci le voci manualmente."
        : "La lettura automatica delle immagini richiede l'AI, non configurata su questo ambiente. Carica il PDF, se disponibile, oppure inserisci le voci manualmente.",
    },
    { status: 422 }
  );
}
