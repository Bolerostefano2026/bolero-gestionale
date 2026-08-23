"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { notificaTitolari } from "@/lib/email";

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

  void notificaTitolari({
    oggetto: `👤 Nuovo cliente — ${parsed.data.name} ${parsed.data.surname}`,
    titolo: `Nuovo cliente aggiunto`,
    corpo: `${parsed.data.name} ${parsed.data.surname}${parsed.data.city ? ` · ${parsed.data.city}` : ""}${parsed.data.phone ? ` · ${parsed.data.phone}` : ""}`,
    link: `${process.env.NEXTAUTH_URL ?? ""}/clienti/${client.id}`,
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

export async function addClientNote(clientId: string, note: string) {
  const session = await requireWrite();
  const trimmed = note.trim();
  if (!trimmed) throw new Error("La nota non può essere vuota");

  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    select: { notes: true },
  });

  const timestamp = new Date().toLocaleString("it-IT", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const entry = `[${timestamp}] ${trimmed}`;
  const updated = client.notes ? `${client.notes}\n${entry}` : entry;

  await prisma.client.update({ where: { id: clientId }, data: { notes: updated } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      entityType: "client",
      entityId: clientId,
      action: "note:add",
      source: "manual",
    },
  });

  revalidatePath(`/clienti/${clientId}`);
}

export async function deleteClient(clientId: string) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "clients:delete")) {
    throw new Error("Permesso negato");
  }

  // Preventivi e fatture sono documenti fiscali soggetti a conservazione
  // decennale: il database rifiuta la cancellazione a cascata, qui traduciamo
  // il vincolo in un messaggio comprensibile.
  const [quotes, invoices] = await Promise.all([
    prisma.quote.count({ where: { clientId } }),
    prisma.invoice.count({ where: { clientId } }),
  ]);

  if (quotes > 0 || invoices > 0) {
    const parti = [
      quotes > 0 ? `${quotes} ${quotes === 1 ? "preventivo" : "preventivi"}` : null,
      invoices > 0 ? `${invoices} ${invoices === 1 ? "fattura" : "fatture"}` : null,
    ].filter(Boolean);
    throw new Error(
      `Impossibile eliminare: il cliente ha ${parti.join(" e ")}. I documenti fiscali vanno conservati per legge. Imposta il cliente come "Inattivo" invece di eliminarlo.`
    );
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
