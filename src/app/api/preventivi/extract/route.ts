import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "File mancante" }, { status: 400 });
  }

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: [fileBlock, {
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
        }] as Anthropic.MessageParam["content"],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Impossibile estrarre le voci dal documento" }, { status: 422 });
  }
}
