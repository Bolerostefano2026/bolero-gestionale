import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Dati dimostrativi realistici per valutare il gestionale.
 * Eseguire con: npx tsx prisma/seed-demo.ts
 * Sono tutti riconoscibili come demo e cancellabili dall'interfaccia.
 */
async function main() {
  const titolare = await prisma.user.findFirstOrThrow({
    where: { role: { name: "titolare" } },
  });

  const pergotenda = await prisma.product.upsert({
    where: { id: "demo-pergotenda" },
    update: {},
    create: {
      id: "demo-pergotenda",
      name: "Pergotenda",
      category: "Coperture",
      description: "Struttura in alluminio con telo retrattile motorizzato",
      sortOrder: 1,
      templates: {
        create: {
          name: "Scheda misure",
          fields: [
            { key: "larghezza", label: "Larghezza", type: "dimension", unit: "cm", required: true },
            { key: "profondita", label: "Profondità", type: "dimension", unit: "cm", required: true },
            { key: "altezza", label: "Altezza", type: "dimension", unit: "cm", required: false },
            { key: "colore_struttura", label: "Colore struttura", type: "select", required: true, options: ["Bianco RAL 9010", "Antracite RAL 7016", "Avorio RAL 1013"] },
            { key: "motorizzata", label: "Motorizzata", type: "checkbox", required: false },
            { key: "note_installazione", label: "Note installazione", type: "textarea", required: false },
          ],
        },
      },
    },
    include: { templates: true },
  });

  const tendaSole = await prisma.product.upsert({
    where: { id: "demo-tenda-sole" },
    update: {},
    create: {
      id: "demo-tenda-sole",
      name: "Tenda da sole a bracci",
      category: "Tende",
      description: "Tenda a bracci estensibili per balconi e terrazzi",
      sortOrder: 2,
      templates: {
        create: {
          name: "Scheda misure",
          fields: [
            { key: "larghezza", label: "Larghezza", type: "dimension", unit: "cm", required: true },
            { key: "sporgenza", label: "Sporgenza", type: "dimension", unit: "cm", required: true },
            { key: "tipo_supporto", label: "Tipo supporto", type: "select", required: true, options: ["A muro", "A soffitto", "A tetto"] },
            { key: "tessuto", label: "Codice tessuto", type: "text", required: false },
          ],
        },
      },
    },
    include: { templates: true },
  });

  const clientiDemo = [
    { name: "Giulia", surname: "Ferrari", phone: "348 5512244", email: "giulia.ferrari@example.it", address: "Via Manzoni 8", city: "Brescia", cap: "25121", status: "IN_LAVORAZIONE" as const },
    { name: "Marco", surname: "Bianchi", phone: "347 9981122", email: "m.bianchi@example.it", address: "Corso Italia 45", city: "Bergamo", cap: "24122", status: "ATTIVO" as const },
    { name: "Elena", surname: "Ricci", phone: "339 4477880", email: "elena.ricci@example.it", address: "Via Garibaldi 3", city: "Monza", cap: "20900", status: "LEAD" as const },
    { name: "Studio", surname: "Verdi SRL", phone: "030 227744", email: "info@studioverdi.example.it", address: "Via Roma 112", city: "Brescia", cap: "25100", status: "ATTIVO" as const },
  ];

  const clients = [];
  for (const c of clientiDemo) {
    const existing = await prisma.client.findFirst({
      where: { name: c.name, surname: c.surname },
    });
    clients.push(existing ?? (await prisma.client.create({ data: c })));
  }

  const [giulia, marco, elena] = clients;

  const daysFromNow = (d: number) => {
    const date = new Date();
    date.setDate(date.getDate() + d);
    date.setHours(9 + (Math.abs(d) % 8), 0, 0, 0);
    return date;
  };

  const existingAppts = await prisma.appointment.count();
  if (existingAppts <= 1) {
    await prisma.appointment.createMany({
      data: [
        { clientId: giulia.id, type: "MONTAGGIO", status: "CONFERMATO", scheduledAt: daysFromNow(1), durationMin: 240, address: "Via Manzoni 8, Brescia", createdById: titolare.id },
        { clientId: marco.id, type: "SOPRALLUOGO", status: "PROGRAMMATO", scheduledAt: daysFromNow(2), durationMin: 60, address: "Corso Italia 45, Bergamo", createdById: titolare.id },
        { clientId: elena.id, type: "APPUNTAMENTO", status: "PROGRAMMATO", scheduledAt: daysFromNow(4), durationMin: 45, address: "Via Garibaldi 3, Monza", createdById: titolare.id },
      ],
    });
  }

  const existingMeasurements = await prisma.measurement.count();
  if (existingMeasurements <= 1) {
    await prisma.measurement.create({
      data: {
        clientId: giulia.id,
        productId: pergotenda.id,
        templateId: pergotenda.templates[0].id,
        data: { larghezza: 480, profondita: 350, altezza: 270, colore_struttura: "Antracite RAL 7016", motorizzata: true },
        notes: "Accesso dal giardino, nessun ostacolo per il montaggio.",
        createdById: titolare.id,
      },
    });
    await prisma.measurement.create({
      data: {
        clientId: marco.id,
        productId: tendaSole.id,
        templateId: tendaSole.templates[0].id,
        data: { larghezza: 400, sporgenza: 250, tipo_supporto: "A muro", tessuto: "Tempotest 5017" },
        createdById: titolare.id,
      },
    });
  }

  const year = new Date().getFullYear();
  const quoteCount = await prisma.quote.count();
  if (quoteCount <= 1) {
    await prisma.quote.create({
      data: {
        number: `PRV-${year}-0100`,
        clientId: giulia.id,
        status: "APPROVATO",
        items: [
          { description: "Pergotenda 4,8 x 3,5 m — struttura alluminio antracite", quantity: 1, unitPrice: 5400 },
          { description: "Motorizzazione con telecomando", quantity: 1, unitPrice: 780 },
          { description: "Installazione e montaggio", quantity: 1, unitPrice: 900 },
        ],
        subtotal: 7080,
        discount: 280,
        vatRate: 22,
        total: 8296,
        createdById: titolare.id,
      },
    });
    await prisma.quote.create({
      data: {
        number: `PRV-${year}-0101`,
        clientId: marco.id,
        status: "IN_ATTESA",
        items: [
          { description: "Tenda da sole a bracci 4,0 x 2,5 m", quantity: 1, unitPrice: 1850 },
          { description: "Installazione a muro", quantity: 1, unitPrice: 320 },
        ],
        subtotal: 2170,
        discount: 0,
        vatRate: 22,
        total: 2647.4,
        createdById: titolare.id,
      },
    });
  }

  const projectCount = await prisma.project.count();
  if (projectCount <= 1) {
    const giuliaQuote = await prisma.quote.findFirst({ where: { clientId: giulia.id } });
    await prisma.project.create({
      data: {
        clientId: giulia.id,
        quoteId: giuliaQuote?.id,
        title: "Pergotenda giardino Ferrari",
        stage: "PROGRAMMAZIONE_MONTAGGIO",
        notes: "Montaggio confermato, materiale già in magazzino.",
        createdById: titolare.id,
        events: {
          create: [
            { toStage: "CONTATTO", triggeredById: titolare.id },
            { fromStage: "CONTATTO", toStage: "APPUNTAMENTO", triggeredById: titolare.id },
            { fromStage: "APPUNTAMENTO", toStage: "SOPRALLUOGO", triggeredById: titolare.id },
            { fromStage: "SOPRALLUOGO", toStage: "MISURE", triggeredById: titolare.id },
            { fromStage: "MISURE", toStage: "PROGETTAZIONE", triggeredById: titolare.id },
            { fromStage: "PROGETTAZIONE", toStage: "PREVENTIVO", triggeredById: titolare.id },
            { fromStage: "PREVENTIVO", toStage: "PREVENTIVO_INVIATO", triggeredById: titolare.id },
            { fromStage: "PREVENTIVO_INVIATO", toStage: "APPROVAZIONE", triggeredById: titolare.id },
            { fromStage: "APPROVAZIONE", toStage: "ORDINE", triggeredById: titolare.id },
            { fromStage: "ORDINE", toStage: "PRODUZIONE", triggeredById: titolare.id },
            { fromStage: "PRODUZIONE", toStage: "PROGRAMMAZIONE_MONTAGGIO", triggeredById: titolare.id, note: "Materiale arrivato dal fornitore" },
          ],
        },
      },
    });
    await prisma.project.create({
      data: {
        clientId: marco.id,
        title: "Tenda terrazzo Bianchi",
        stage: "PREVENTIVO_INVIATO",
        createdById: titolare.id,
        events: { create: [{ toStage: "CONTATTO", triggeredById: titolare.id }] },
      },
    });
  }

  console.log("Dati dimostrativi creati.");
  console.log(`Clienti: ${await prisma.client.count()} · Preventivi: ${await prisma.quote.count()} · Progetti: ${await prisma.project.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
