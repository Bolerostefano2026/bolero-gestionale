import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Protected with CRON_SECRET — same mechanism used by cron jobs
export async function POST(req: Request) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  type FieldDef = {
    key: string;
    label: string;
    type: string;
    required: boolean;
    unit?: string;
    options?: string[];
  };

  const dim = (key: string, label: string, unit = "cm"): FieldDef => ({ key, label, type: "dimension", required: true, unit });
  const sel = (key: string, label: string, options: string[], required = false): FieldDef => ({ key, label, type: "select", required, options });
  const txt = (key: string, label: string, required = false): FieldDef => ({ key, label, type: "text", required });

  const FIELDS_FINESTRA: FieldDef[] = [dim("larghezza","Larghezza"),dim("altezza","Altezza"),sel("profilo","Profilo",["Alluminio","PVC","Legno","Legno-Alluminio"],true),sel("apertura","Tipo apertura",["Battente","Scorrevole","Vasistas","Fisso","Bilico"],true),sel("vetro","Tipo vetro",["Singolo","Doppio","Triplo","Antisfondamento"]),txt("colore","Colore / RAL"),txt("note","Note")];
  const FIELDS_SERRAMENTO: FieldDef[] = [dim("larghezza","Larghezza"),dim("altezza","Altezza"),sel("materiale","Materiale",["Alluminio","PVC","Legno","Legno-Alluminio"],true),sel("apertura","Tipo apertura",["Battente","Scorrevole","Vasistas","Fisso"],true),txt("colore","Colore / RAL"),txt("note","Note")];
  const FIELDS_PORTA: FieldDef[] = [dim("larghezza","Larghezza"),dim("altezza","Altezza"),dim("spessore_muro","Spessore muro"),sel("verso","Verso apertura",["Destra","Sinistra","Doppia"],true),txt("colore","Colore / Finitura"),txt("note","Note")];
  const FIELDS_PORTA_BLINDATA: FieldDef[] = [dim("larghezza","Larghezza"),dim("altezza","Altezza"),dim("spessore_muro","Spessore muro"),sel("classe","Classe sicurezza",["RC2","RC3","RC4","RC5","RC6"],true),sel("verso","Verso apertura",["Destra","Sinistra"],true),txt("colore","Colore / Finitura"),txt("note","Note")];
  const FIELDS_PORTA_TAGLIAFUOCO: FieldDef[] = [dim("larghezza","Larghezza"),dim("altezza","Altezza"),dim("spessore_muro","Spessore muro"),sel("classe_fuoco","Classe REI",["REI 30","REI 60","REI 90","REI 120"],true),sel("verso","Verso apertura",["Destra","Sinistra","Doppia"],true),txt("colore","Colore RAL"),txt("note","Note")];
  const FIELDS_PORTONE: FieldDef[] = [dim("larghezza","Larghezza"),dim("altezza","Altezza"),sel("azionamento","Azionamento",["Manuale","Motorizzato","Automatico"],true),txt("colore","Colore / RAL"),txt("note","Note")];
  const FIELDS_TAPPARELLA: FieldDef[] = [dim("larghezza","Larghezza"),dim("altezza","Altezza"),dim("profondita_avvolgitore","Profondità avvolgitore"),sel("azionamento","Azionamento",["Cinghia","Manovella","Motorizzato","Domotica"],true),sel("materiale","Materiale stecca",["PVC","Alluminio","Acciaio"]),txt("colore","Colore"),txt("note","Note")];
  const FIELDS_SERRANDA: FieldDef[] = [dim("larghezza","Larghezza"),dim("altezza","Altezza"),sel("azionamento","Azionamento",["Manuale","Motorizzato","Automatico"],true),sel("tipo","Tipo serranda",["Avvolgibile","Sezionale","A libro"]),txt("colore","Colore RAL"),txt("note","Note")];
  const FIELDS_TENDA: FieldDef[] = [dim("larghezza","Larghezza"),dim("profondita","Sporgenza / Profondità"),sel("azionamento","Azionamento",["Manuale","Motorizzato","Domotica"],true),txt("colore_tessuto","Colore / Tessuto"),txt("note","Note")];
  const FIELDS_FRANGISOLE: FieldDef[] = [dim("larghezza","Larghezza"),dim("altezza","Altezza"),sel("tipo","Tipo frangisole",["Lamelle orientabili","Fisso","Verticale","Orizzontale"],true),sel("materiale","Materiale",["Alluminio","Legno","Acciaio"]),txt("colore","Colore RAL"),txt("note","Note")];
  const FIELDS_SCHERMATURA: FieldDef[] = [dim("larghezza","Larghezza"),dim("altezza","Altezza"),sel("tipo","Tipo schermatura",["Veneziana esterna","Tenda ZIP","Rullo","Verticale"],true),sel("azionamento","Azionamento",["Manuale","Motorizzato","Domotica"]),txt("colore_tessuto","Colore / Tessuto"),txt("note","Note")];
  const FIELDS_PERGOLA: FieldDef[] = [dim("larghezza","Larghezza","m"),dim("profondita","Profondità","m"),dim("altezza","Altezza","m"),sel("copertura","Tipo copertura",["Lamelle orientabili","Vetro","Policarbonato","Telo"],true),txt("colore","Colore / RAL"),txt("note","Note")];
  const FIELDS_PARAPETTO: FieldDef[] = [dim("larghezza","Larghezza / Lunghezza","m"),dim("altezza","Altezza","cm"),sel("materiale","Materiale",["Vetro","Acciaio","Alluminio","Acciaio + Vetro"],true),txt("colore","Colore / Finitura"),txt("note","Note")];
  const FIELDS_VETRATA: FieldDef[] = [dim("larghezza","Larghezza"),dim("altezza","Altezza"),sel("apertura","Tipo",["Scorrevole","Fisso","Battente","Pieghevole"],true),sel("vetro","Tipo vetro",["Singolo","Doppio","Triplo","Stratificato","Decorativo"]),txt("colore_telaio","Colore telaio"),txt("note","Note")];

  const PRODUCTS = [
    { name: "Finestre", category: "Finestre", fields: FIELDS_FINESTRA },
    { name: "Frangisole", category: "Schermature", fields: FIELDS_FRANGISOLE },
    { name: "Parapetti", category: "Parapetti", fields: FIELDS_PARAPETTO },
    { name: "Parapetti in vetro", category: "Parapetti", fields: FIELDS_PARAPETTO },
    { name: "Pergole", category: "Pergole", fields: FIELDS_PERGOLA },
    { name: "Porte", category: "Porte", fields: FIELDS_PORTA },
    { name: "Porte blindate", category: "Porte", fields: FIELDS_PORTA_BLINDATA },
    { name: "Porte in vetro", category: "Porte", fields: FIELDS_FINESTRA },
    { name: "Porte interne", category: "Porte", fields: FIELDS_PORTA },
    { name: "Porte laccate", category: "Porte", fields: FIELDS_PORTA },
    { name: "Porte tagliafuoco", category: "Porte", fields: FIELDS_PORTA_TAGLIAFUOCO },
    { name: "Portoni a libro", category: "Portoni", fields: FIELDS_PORTONE },
    { name: "Portoni in PVC", category: "Portoni", fields: FIELDS_PORTONE },
    { name: "Schermature solari", category: "Schermature", fields: FIELDS_SCHERMATURA },
    { name: "Serramenti", category: "Serramenti", fields: FIELDS_SERRAMENTO },
    { name: "Serramenti in alluminio", category: "Serramenti", fields: FIELDS_SERRAMENTO },
    { name: "Serramenti in legno", category: "Serramenti", fields: FIELDS_SERRAMENTO },
    { name: "Serramenti in PVC", category: "Serramenti", fields: FIELDS_SERRAMENTO },
    { name: "Serramenti motorizzati", category: "Serramenti", fields: FIELDS_SERRAMENTO },
    { name: "Serrande", category: "Serrande", fields: FIELDS_SERRANDA },
    { name: "Tapparelle", category: "Tapparelle", fields: FIELDS_TAPPARELLA },
    { name: "Tapparelle in alluminio", category: "Tapparelle", fields: FIELDS_TAPPARELLA },
    { name: "Tende da sole", category: "Tende", fields: FIELDS_TENDA },
    { name: "Vetrate per ufficio", category: "Vetrate", fields: FIELDS_VETRATA },
    { name: "Vetrate scorrevoli", category: "Vetrate", fields: FIELDS_VETRATA },
  ];

  const results: string[] = [];

  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];

    // upsert by name (no unique constraint, use findFirst + create/update)
    let product = await prisma.product.findFirst({ where: { name: p.name } });
    if (product) {
      product = await prisma.product.update({
        where: { id: product.id },
        data: { category: p.category, active: true, sortOrder: i },
      });
    } else {
      product = await prisma.product.create({
        data: { name: p.name, category: p.category, active: true, sortOrder: i },
      });
    }

    const existing = await prisma.measurementTemplate.findFirst({
      where: { productId: product.id, name: "Standard" },
    });

    if (existing) {
      await prisma.measurementTemplate.update({
        where: { id: existing.id },
        data: { fields: p.fields as never, active: true },
      });
    } else {
      await prisma.measurementTemplate.create({
        data: { productId: product.id, name: "Standard", fields: p.fields as never, version: 1, active: true },
      });
    }

    results.push(p.name);
  }

  return NextResponse.json({ ok: true, prodotti: results.length, nomi: results });
}
