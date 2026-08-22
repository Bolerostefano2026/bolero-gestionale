import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLE_PRESETS } from "../src/lib/permissions";

const prisma = new PrismaClient();

async function main() {
  const roles: Record<string, string> = {};

  for (const [name, preset] of Object.entries(ROLE_PRESETS)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { label: preset.label, permissions: preset.permissions },
      create: {
        name,
        label: preset.label,
        isSystem: true,
        permissions: preset.permissions,
      },
    });
    roles[name] = role.id;
  }

  const adminEmail = "titolare@bolero.local";
  const adminPassword = "Bolero2026!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const titolare = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Titolare",
      passwordHash,
      roleId: roles["titolare"],
      active: true,
    },
  });

  // Clienti di test
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: "Giulia",
        surname: "Ferrari",
        email: "giulia.ferrari@email.com",
        phone: "+41 79 123 4567",
        address: "Via Roma 10",
        city: "Lugano",
        cap: "6900",
        status: "ATTIVO",
        notes: "Cliente affidabile, pagamenti puntuali",
      },
    }).catch(() => null),
    prisma.client.create({
      data: {
        name: "Marco",
        surname: "Bianchi",
        email: "marco.bianchi@email.com",
        phone: "+41 79 234 5678",
        address: "Strada Statale 13",
        city: "Bellinzona",
        cap: "6500",
        status: "IN_LAVORAZIONE",
        notes: "Progetto tenda per terrazzo villa",
      },
    }).catch(() => null),
    prisma.client.create({
      data: {
        name: "Anna",
        surname: "Rossi",
        email: "anna.rossi@email.com",
        phone: "+41 79 345 6789",
        address: "Via Nassa 42",
        city: "Lugano",
        cap: "6900",
        status: "LEAD",
        notes: "Interessata a pergola design",
      },
    }).catch(() => null),
  ]).then(c => c.filter((x): x is NonNullable<typeof x> => x !== null));

  if (clients.length < 2) {
    console.log("⚠ Clienti di test già presenti, salto quote/fatture/appuntamenti.");
  } else {
    const now = new Date();
    const quoteDate = new Date(now.getTime() - 12 * 86400000);

    await prisma.quote.upsert({
      where: { number: "PRV-2026-0101" },
      update: {},
      create: {
        number: "PRV-2026-0101",
        clientId: clients[1].id,
        status: "IN_ATTESA",
        total: 2647.40,
        vatRate: 8.1,
        createdById: titolare.id,
        createdAt: quoteDate,
        notes: "Tenda parasole per terrazzo 4x6m con motorizzazione",
      },
    });

    const invoiceDate = new Date(now.getTime() - 30 * 86400000);
    const dueDate = new Date(now.getTime() - 18 * 86400000);

    await prisma.invoice.upsert({
      where: { number: "FT-2026-0100" },
      update: {},
      create: {
        number: "FT-2026-0100",
        clientId: clients[0].id,
        status: "INVIATA",
        total: 3318.40,
        createdById: titolare.id,
        createdAt: invoiceDate,
        dueDate,
      },
    });

    const appointmentTime = new Date(now);
    appointmentTime.setHours(14, 30, 0, 0);

    await prisma.appointment.create({
      data: {
        clientId: clients[0].id,
        type: "SOPRALLUOGO",
        status: "CONFERMATO",
        scheduledAt: appointmentTime,
        address: "Via Roma 10, 6900 Lugano",
        durationMin: 45,
        notes: "Sopralluogo terrazza lato sud - misure per nuova pergola",
        createdById: titolare.id,
      },
    }).catch(() => null);
  }

  console.log("✓ Seed completato con dati di test.");
  console.log(`\n📌 Login titolare:`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`\n📊 Dati di test creati:`);
  console.log(`   • 3 clienti (1 attivo, 1 in lavorazione, 1 lead)`);
  console.log(`   • 1 preventivo fermo da 12 giorni (CHF 2'647.40)`);
  console.log(`   • 1 fattura scaduta da 18 giorni (CHF 3'318.40)`);
  console.log(`   • 1 appuntamento oggi a 14:30`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
