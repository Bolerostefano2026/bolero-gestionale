"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

const clientSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  surname: z.string().min(1, "Il cognome è obbligatorio"),
  phone: z.string().optional(),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  cap: z.string().optional(),
  status: z.enum(["LEAD", "ATTIVO", "IN_LAVORAZIONE", "CHIUSO", "INATTIVO"]),
  notes: z.string().optional(),
});

async function requireWrite() {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "clients:write")) {
    throw new Error("Permesso negato");
  }
  return session!;
}

export async function createClient(formData: FormData) {
  const session = await requireWrite();

  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
  }

  const client = await prisma.client.create({
    data: { ...parsed.data, email: parsed.data.email || null },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      entityType: "client",
      entityId: client.id,
      action: "create",
      source: "manual",
    },
  });

  revalidatePath("/clienti");
  return client.id;
}

export async function updateClient(clientId: string, formData: FormData) {
  const session = await requireWrite();

  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
  }

  await prisma.client.update({
    where: { id: clientId },
    data: { ...parsed.data, email: parsed.data.email || null },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      entityType: "client",
      entityId: clientId,
      action: "update",
      source: "manual",
    },
  });

  revalidatePath("/clienti");
  revalidatePath(`/clienti/${clientId}`);
}

export async function deleteClient(clientId: string) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "clients:delete")) {
    throw new Error("Permesso negato");
  }

  await prisma.client.delete({ where: { id: clientId } });

  await prisma.auditLog.create({
    data: {
      userId: session!.user.id,
      entityType: "client",
      entityId: clientId,
      action: "delete",
      source: "manual",
    },
  });

  revalidatePath("/clienti");
}
