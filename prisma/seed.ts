import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLE_PRESETS } from "../src/lib/permissions";

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400000);
}
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 86400000);
}

async function main() {
  // ── Ruoli ────────────────────────────────────────────────────────────────
  const roles: Record<string, string> = {};
  for (const [name, preset] of Object.entries(ROLE_PRESETS)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { label: preset.label, permissions: preset.permissions },
      create: { name, label: preset.label, isSystem: true, permissions: preset.permissions },
    });
    roles[name] = role.id;
  }

  // ── Utenti ───────────────────────────────────────────────────────────────
  const hash = (pw: string) => bcrypt.hash(pw, 10);

  const titolare = await prisma.user.upsert({
    where: { email: "titolare@bolero.local" },
    update: {},
    create: {
      email: "titolare@bolero.local",
      name: "Luca Bernasconi",
      passwordHash: await hash("Bolero2026!"),
      roleId: roles["titolare"],
      active: true,
    },
  });

  const ufficio = await prisma.user.upsert({
    where: { email: "ufficio@bolero.local" },
    update: {},
    create: {
      email: "ufficio@bolero.local",
      name: "Sara Martinelli",
      passwordHash: await hash("Ufficio2026!"),
      roleId: roles["ufficio"],
      active: true,
    },
  });

  const collaboratore = await prisma.user.upsert({
    where: { email: "collaboratore@bolero.local" },
    update: {},
    create: {
      email: "collaboratore@bolero.local",
      name: "Paolo Greco",
      passwordHash: await hash("Campo2026!"),
      roleId: roles["collaboratore"],
      active: true,
    },
  });

  // ── Clienti ──────────────────────────────────────────────────────────────
  type C = Awaited<ReturnType<typeof prisma.client.create>>;
  const clientData = [
    {
      name: "Giulia", surname: "Ferrari", email: "giulia.ferrari@email.com",
      phone: "+41 79 123 4567", address: "Via Roma 10", city: "Lugano", cap: "6900",
      status: "ATTIVO" as const, notes: "Cliente storica, pagamenti sempre puntuali. Vuole rinnovare le persiane."
    },
    {
      name: "Marco", surname: "Bianchi", email: "marco.bianchi@email.com",
      phone: "+41 79 234 5678", address: "Strada Statale 13", city: "Bellinzona", cap: "6500",
      status: "IN_LAVORAZIONE" as const, notes: "Tenda parasole per terrazzo villa. Montaggio programmato per settembre."
    },
    {
      name: "Anna", surname: "Rossi", email: "anna.rossi@email.com",
      phone: "+41 79 345 6789", address: "Via Nassa 42", city: "Lugano", cap: "6900",
      status: "LEAD" as const, notes: "Interessata a pergola bioclimatica. Ha richiesto preventivo via email."
    },
    {
      name: "Roberto", surname: "Conti", email: "roberto.conti@studio.ch",
      phone: "+41 79 456 7890", address: "Via Pessina 8", city: "Lugano", cap: "6900",
      status: "ATTIVO" as const, notes: "Studio di architettura. Cliente B2B con volumi importanti."
    },
    {
      name: "Elena", surname: "Mancini", email: "elena.mancini@gmail.com",
      phone: "+41 79 567 8901", address: "Via Cattedrale 2", city: "Lugano", cap: "6900",
      status: "CHIUSO" as const, notes: "Lavoro completato nel 2025. Soddisfatta del montaggio tende."
    },
    {
      name: "Fabio", surname: "Moretti", email: "fabio.moretti@hotmail.com",
      phone: "+41 79 678 9012", address: "Via S. Gottardo 60", city: "Bellinzona", cap: "6500",
      status: "LEAD" as const, notes: "Primo contatto da fiera. Interessato a zanzariere plissé."
    },
  ];

  const clients: C[] = [];
  for (const data of clientData) {
    try {
      const c = await prisma.client.create({ data });
      clients.push(c);
    } catch {
      // già presente, skip
    }
  }

  if (clients.length < 2) {
    console.log("⚠ Clienti già presenti — skip dati relativi.");
  } else {
    const [giulia, marco, anna, roberto] = clients;

    // ── Preventivi ──────────────────────────────────────────────────────────
    const quoteItems1 = [
      { description: "Tenda a bracci Markilux 6000 4x3m motorizzata", quantity: 1, unitPrice: 1890 },
      { description: "Tessuto acrilico Sunbrella Natté ecru", quantity: 1, unitPrice: 220 },
      { description: "Motorizzazione Somfy io", quantity: 1, unitPrice: 380 },
      { description: "Montaggio e messa in opera", quantity: 1, unitPrice: 290 },
    ];
    const subtotal1 = quoteItems1.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const vat1 = subtotal1 * 0.081;
    await prisma.quote.upsert({
      where: { number: "PRV-2026-0098" },
      update: {},
      create: {
        number: "PRV-2026-0098",
        clientId: marco.id,
        status: "IN_ATTESA",
        items: quoteItems1,
        subtotal: subtotal1,
        vatRate: 8.1,
        total: subtotal1 + vat1,
        validUntil: daysFromNow(18),
        notes: "Tenda parasole per terrazzo villa 4x3m con motorizzazione Somfy.",
        createdById: titolare.id,
        createdAt: daysAgo(12),
      },
    });

    const quoteItems2 = [
      { description: "Pergola bioclimatica alluminio 5x4m", quantity: 1, unitPrice: 6800 },
      { description: "LED integrati perimetrali", quantity: 1, unitPrice: 420 },
      { description: "Sensore vento/pioggia", quantity: 1, unitPrice: 180 },
      { description: "Montaggio e trasporto", quantity: 1, unitPrice: 650 },
    ];
    const subtotal2 = quoteItems2.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    await prisma.quote.upsert({
      where: { number: "PRV-2026-0099" },
      update: {},
      create: {
        number: "PRV-2026-0099",
        clientId: anna?.id ?? giulia.id,
        status: "BOZZA",
        items: quoteItems2,
        subtotal: subtotal2,
        vatRate: 8.1,
        total: subtotal2 + subtotal2 * 0.081,
        validUntil: daysFromNow(30),
        notes: "Pergola bioclimatica con LED e sensori meteo.",
        createdById: ufficio.id,
        createdAt: daysAgo(3),
      },
    });

    const quoteItems3 = [
      { description: "Zanzariera plissé finestra 80x120cm", quantity: 4, unitPrice: 185 },
      { description: "Zanzariera a rullo porta 95x210cm", quantity: 2, unitPrice: 245 },
      { description: "Montaggio", quantity: 1, unitPrice: 120 },
    ];
    const subtotal3 = quoteItems3.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    await prisma.quote.upsert({
      where: { number: "PRV-2026-0100" },
      update: {},
      create: {
        number: "PRV-2026-0100",
        clientId: giulia.id,
        status: "APPROVATO",
        items: quoteItems3,
        subtotal: subtotal3,
        vatRate: 8.1,
        total: subtotal3 + subtotal3 * 0.081,
        createdById: ufficio.id,
        createdAt: daysAgo(20),
      },
    });

    if (roberto) {
      const quoteItems4 = [
        { description: "Persiane alluminio orientabili 120x200cm", quantity: 8, unitPrice: 420 },
        { description: "Motorizzazione Somfy per 8 persiane", quantity: 8, unitPrice: 180 },
        { description: "Installazione e cablaggio", quantity: 1, unitPrice: 890 },
      ];
      const subtotal4 = quoteItems4.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      await prisma.quote.upsert({
        where: { number: "PRV-2026-0101" },
        update: {},
        create: {
          number: "PRV-2026-0101",
          clientId: roberto.id,
          status: "INVIATO",
          items: quoteItems4,
          subtotal: subtotal4,
          vatRate: 8.1,
          total: subtotal4 + subtotal4 * 0.081,
          validUntil: daysFromNow(14),
          notes: "Studio arch. Conti — 8 persiane motorizzate per uffici 2° piano.",
          createdById: titolare.id,
          createdAt: daysAgo(5),
        },
      });
    }

    // ── Fatture ──────────────────────────────────────────────────────────────
    // Le fatture usano { description, amount } (importo totale per riga, IVA inclusa)
    const invItems1 = [
      { description: "Tenda a bracci Markilux 5000 3.5x2.5m", amount: 1610.69 },
      { description: "Montaggio", amount: 302.68 },
    ];
    const invTotal1 = invItems1.reduce((s, i) => s + i.amount, 0);
    await prisma.invoice.upsert({
      where: { number: "FT-2026-0097" },
      update: {},
      create: {
        number: "FT-2026-0097",
        clientId: giulia.id,
        status: "PAGATA",
        items: invItems1,
        total: Math.round(invTotal1 * 100) / 100,
        dueDate: daysAgo(10),
        issuedAt: daysAgo(40),
        createdById: ufficio.id,
        createdAt: daysAgo(40),
      },
    });

    const subtotal3Iva = Math.round(subtotal3 * 1.081 * 100) / 100;
    const invItems2 = [
      { description: "Zanzariere plissé e montaggio — PRV-2026-0100 (IVA 8.1% inclusa)", amount: subtotal3Iva },
    ];
    await prisma.invoice.upsert({
      where: { number: "FT-2026-0098" },
      update: {},
      create: {
        number: "FT-2026-0098",
        clientId: giulia.id,
        status: "INVIATA",
        items: invItems2,
        total: subtotal3Iva,
        dueDate: daysFromNow(12),
        issuedAt: daysAgo(8),
        createdById: ufficio.id,
        createdAt: daysAgo(8),
      },
    });

    // Fattura scaduta (overdue)
    await prisma.invoice.upsert({
      where: { number: "FT-2026-0096" },
      update: {},
      create: {
        number: "FT-2026-0096",
        clientId: marco.id,
        status: "INVIATA",
        items: [{ description: "Acconto 30% — Tenda parasole (IVA 8.1% inclusa)", amount: 858.75 }],
        total: 858.75,
        dueDate: daysAgo(18),
        issuedAt: daysAgo(48),
        createdById: titolare.id,
        createdAt: daysAgo(48),
      },
    });

    // ── Appuntamenti ─────────────────────────────────────────────────────────
    const todayAt = (h: number, m = 0) => {
      const d = new Date(); d.setHours(h, m, 0, 0); return d;
    };
    const apptData = [
      {
        clientId: giulia.id,
        type: "SOPRALLUOGO" as const,
        status: "CONFERMATO" as const,
        scheduledAt: todayAt(10, 30),
        address: "Via Roma 10, 6900 Lugano",
        durationMin: 45,
        notes: "Sopralluogo per zanzariere — misurare 4 finestre e 2 porte",
        assignedToId: collaboratore.id,
        createdById: titolare.id,
      },
      {
        clientId: marco.id,
        type: "MONTAGGIO" as const,
        status: "PROGRAMMATO" as const,
        scheduledAt: daysFromNow(3),
        address: "Strada Statale 13, 6500 Bellinzona",
        durationMin: 180,
        notes: "Montaggio tenda Markilux 6000. Portare kit motorizzazione Somfy.",
        assignedToId: collaboratore.id,
        createdById: ufficio.id,
      },
      {
        clientId: anna?.id ?? giulia.id,
        type: "APPUNTAMENTO" as const,
        status: "PROGRAMMATO" as const,
        scheduledAt: daysFromNow(7),
        address: "Via Nassa 42, 6900 Lugano",
        durationMin: 60,
        notes: "Presentazione preventivo pergola bioclimatica. Portare campionario colori.",
        assignedToId: titolare.id,
        createdById: ufficio.id,
      },
    ];
    for (const data of apptData) {
      await prisma.appointment.create({ data }).catch(() => null);
    }

    // ── Prodotti & Template misure ───────────────────────────────────────────
    const tenda = await prisma.product.upsert({
      where: { id: "prod-tenda-bracci" },
      update: {},
      create: {
        id: "prod-tenda-bracci",
        name: "Tenda a bracci",
        description: "Tende da sole a bracci estensibili",
        category: "Tende",
        sortOrder: 1,
      },
    });

    const zanzariera = await prisma.product.upsert({
      where: { id: "prod-zanzariera" },
      update: {},
      create: {
        id: "prod-zanzariera",
        name: "Zanzariera",
        description: "Zanzariere plissé, a rullo e scorrevoli",
        category: "Zanzariere",
        sortOrder: 2,
      },
    });

    const pergola = await prisma.product.upsert({
      where: { id: "prod-pergola" },
      update: {},
      create: {
        id: "prod-pergola",
        name: "Pergola bioclimatica",
        description: "Pergole con lamelle orientabili in alluminio",
        category: "Pergole",
        sortOrder: 3,
      },
    });

    const tmplTenda = await prisma.measurementTemplate.upsert({
      where: { id: "tmpl-tenda" },
      update: {},
      create: {
        id: "tmpl-tenda",
        productId: tenda.id,
        name: "Rilievo tenda a bracci",
        fields: [
          { key: "larghezza", label: "Larghezza (cm)", type: "number", required: true },
          { key: "sporgenza", label: "Sporgenza (cm)", type: "number", required: true },
          { key: "altezza_montaggio", label: "Altezza montaggio (cm)", type: "number", required: false },
          { key: "parete", label: "Tipo parete", type: "select", options: ["Mattone", "Calcestruzzo", "Legno", "Metallo"], required: true },
          { key: "motorizzazione", label: "Motorizzazione", type: "boolean", required: false },
          { key: "note", label: "Note installazione", type: "text", required: false },
        ],
        version: 1,
      },
    });

    const tmplZanzariera = await prisma.measurementTemplate.upsert({
      where: { id: "tmpl-zanzariera" },
      update: {},
      create: {
        id: "tmpl-zanzariera",
        productId: zanzariera.id,
        name: "Rilievo zanzariera",
        fields: [
          { key: "larghezza", label: "Larghezza luce (cm)", type: "number", required: true },
          { key: "altezza", label: "Altezza luce (cm)", type: "number", required: true },
          { key: "tipo", label: "Tipo", type: "select", options: ["Plissé", "A rullo", "Scorrevole"], required: true },
          { key: "apertura", label: "Apertura", type: "select", options: ["Sinistra", "Destra", "Centro"], required: false },
          { key: "note", label: "Note", type: "text", required: false },
        ],
        version: 1,
      },
    });

    // ── Misure di esempio ────────────────────────────────────────────────────
    const misura1 = await prisma.measurement.create({
      data: {
        clientId: marco.id,
        productId: tenda.id,
        templateId: tmplTenda.id,
        data: { larghezza: 420, sporgenza: 300, altezza_montaggio: 250, parete: "Calcestruzzo", motorizzazione: true },
        fieldsSnapshot: tmplTenda.fields as object,
        templateVersion: 1,
        notes: "Terrazzo lato sud. Spazio libero sufficiente. Cavi elettrici già predisposti per motore.",
        createdById: collaboratore.id,
        createdAt: daysAgo(10),
      },
    }).catch(() => null);

    await prisma.measurement.create({
      data: {
        clientId: giulia.id,
        productId: zanzariera.id,
        templateId: tmplZanzariera.id,
        data: { larghezza: 82, altezza: 118, tipo: "Plissé", apertura: "Sinistra" },
        fieldsSnapshot: tmplZanzariera.fields as object,
        templateVersion: 1,
        notes: "Finestra camera da letto. Colore telaio: bianco RAL 9016.",
        createdById: collaboratore.id,
        createdAt: daysAgo(18),
      },
    }).catch(() => null);

    // ── Progetti Workflow ────────────────────────────────────────────────────
    await prisma.project.create({
      data: {
        clientId: marco.id,
        title: "Tenda terrazzo villa Bellinzona",
        stage: "PROGRAMMAZIONE_MONTAGGIO",
        notes: "Tenda Markilux 6000 4x3m — motorizzazione Somfy io. Montaggio confermato.",
        measurementId: misura1?.id,
        createdById: titolare.id,
        createdAt: daysAgo(25),
      },
    }).catch(() => null);

    await prisma.project.create({
      data: {
        clientId: giulia.id,
        title: "Zanzariere appartamento Lugano",
        stage: "FATTURAZIONE",
        notes: "4 zanzariere plissé + 2 a rullo. Montaggio completato. Fattura inviata.",
        createdById: ufficio.id,
        createdAt: daysAgo(30),
      },
    }).catch(() => null);

    await prisma.project.create({
      data: {
        clientId: anna?.id ?? giulia.id,
        title: "Pergola bioclimatica Lugano",
        stage: "PREVENTIVO",
        notes: "Cliente interessata a pergola 5x4m. Preventivo in preparazione.",
        createdById: titolare.id,
        createdAt: daysAgo(5),
      },
    }).catch(() => null);

    if (roberto) {
      await prisma.project.create({
        data: {
          clientId: roberto.id,
          title: "Persiane motorizzate Studio Conti",
          stage: "APPROVAZIONE",
          notes: "8 persiane alluminio motorizzate. Preventivo inviato, in attesa risposta.",
          createdById: titolare.id,
          createdAt: daysAgo(7),
        },
      }).catch(() => null);
    }
  }

  // ── Notifiche di esempio ────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: titolare.id,
        type: "invoice_overdue",
        title: "Fattura scaduta",
        body: "FT-2026-0096 — Marco Bianchi — scaduta da 18 giorni (CHF 858.75)",
        link: "/fatture",
        read: false,
        createdAt: daysAgo(1),
      },
      {
        userId: titolare.id,
        type: "quote_pending",
        title: "Preventivo in attesa",
        body: "PRV-2026-0098 — Marco Bianchi — nessuna risposta da 12 giorni",
        link: "/preventivi",
        read: false,
        createdAt: daysAgo(2),
      },
      {
        userId: titolare.id,
        type: "appointment_today",
        title: "Sopralluogo oggi alle 10:30",
        body: "Giulia Ferrari — Via Roma 10, Lugano",
        link: "/calendario",
        read: true,
        createdAt: daysAgo(0),
      },
      {
        userId: ufficio.id,
        type: "quote_approved",
        title: "Preventivo approvato",
        body: "PRV-2026-0100 — Giulia Ferrari ha confermato",
        link: "/preventivi",
        read: false,
        createdAt: daysAgo(1),
      },
    ],
    skipDuplicates: true,
  }).catch(() => null);

  console.log("\n✅ Seed completato.\n");
  console.log("╔══════════════════════════════════════════╗");
  console.log("║           CREDENZIALI DI ACCESSO         ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log("║ Titolare:     titolare@bolero.local       ║");
  console.log("║               Bolero2026!                 ║");
  console.log("║ Ufficio:      ufficio@bolero.local        ║");
  console.log("║               Ufficio2026!                ║");
  console.log("║ Collaboratore: collaboratore@bolero.local ║");
  console.log("║                Campo2026!                 ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log("\n📊 Dati di test:");
  console.log("   • 6 clienti (2 attivi, 1 in lavorazione, 2 lead, 1 chiuso)");
  console.log("   • 4 preventivi (bozza, inviato, in attesa, approvato)");
  console.log("   • 3 fatture (1 pagata, 1 inviata, 1 scaduta da 18gg)");
  console.log("   • 3 appuntamenti (oggi 10:30, +3gg montaggio, +7gg incontro)");
  console.log("   • 3 prodotti + 2 template misure");
  console.log("   • 2 misurazioni rilevate");
  console.log("   • 4 progetti workflow in varie fasi");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
