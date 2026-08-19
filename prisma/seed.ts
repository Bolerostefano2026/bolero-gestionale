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

  await prisma.user.upsert({
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

  console.log("Seed completato.");
  console.log(`Login titolare -> email: ${adminEmail} / password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
