"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { notifyTitolari } from "@/lib/notify";
import { VAT_RATE_DEFAULT } from "@/lib/config";

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
});

const quoteSchema = z.object({
  clientId: z.string().uuid("Seleziona un cliente"),
  items: z.string().transform((s, ctx) => {
    try {
      const parsed = JSON.parse(s);
      return z.array(itemSchema).min(1, "Aggiungi almeno una voce").parse(parsed);
    } catch {
      ctx.addIssue({ code: "custom", message: "Voci non valide" });
      return z.NEVER;
    }
  }),
  discount: z.coerce.number().nonnegative().default(0),
  vatRate: z.coerce.number().nonnegative().default(VAT_RATE_DEFAULT),
  notes: z.string().optional(),
  validUntil: z.string().optional(),
});

function computeTotals(
  items: { quantity: number; unitPrice: number }[],
  discount: number,
  vatRate: number
) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const taxable = Math.max(subtotal - discount, 0);
  const total = taxable + taxable * (vatRate / 100);
  return { subtotal, total };
}

async function requireWrite() {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "quotes:write")) {
    throw new Error("Permesso negato");
  }
  return session!;
}

async function nextQuoteNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.quote.count({
    where: { number: { startsWith: `PRV-${year}-` } },
  });
  return `PRV-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function createQuote(formData: FormData) {
  const session = await requireWrite();

  const parsed = quoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
  }

  const { clientId, items, discount, vatRate, notes, validUntil } = parsed.data;
  const { subtotal, total } = computeTotals(items, discount, vatRate);
  const number = await nextQuoteNumber();

  const quote = await prisma.quote.create({
    data: {
      number,
      clientId,
      items,
      subtotal,
      discount,
      vatRate,
      total,
      notes,
      validUntil: validUntil ? new Date(validUntil) : null,
      createdById: session.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      entityType: "quote",
      entityId: quote.id,
      action: "create",
      source: "manual",
    },
  });

  revalidatePath("/preventivi");
  return quote.id;
}

export async function updateQuote(quoteId: string, formData: FormData) {
  const session = await requireWrite();

  const parsed = quoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
  }

  const existing = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId } });

  await prisma.quoteVersion.create({
    data: {
      quoteId,
      version: existing.version,
      snapshot: {
        items: existing.items as unknown as object,
        subtotal: existing.subtotal.toString(),
        discount: existing.discount.toString(),
        vatRate: existing.vatRate.toString(),
        total: existing.total.toString(),
        notes: existing.notes,
        status: existing.status,
      },
      createdById: session.user.id,
    },
  });

  const { clientId, items, discount, vatRate, notes, validUntil } = parsed.data;
  const { subtotal, total } = computeTotals(items, discount, vatRate);

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      clientId,
      items,
      subtotal,
      discount,
      vatRate,
      total,
      notes,
      validUntil: validUntil ? new Date(validUntil) : null,
      version: { increment: 1 },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      entityType: "quote",
      entityId: quoteId,
      action: "update",
      source: "manual",
    },
  });

  revalidatePath("/preventivi");
  revalidatePath(`/preventivi/${quoteId}`);
}

const STATUS_FLOW = [
  "BOZZA",
  "INVIATO",
  "IN_ATTESA",
  "APPROVATO",
  "RIFIUTATO",
  "CONVERTITO",
  "COMPLETATO",
] as const;
const statusSchema = z.enum(STATUS_FLOW);

export async function updateQuoteStatus(quoteId: string, status: string) {
  const session = await auth();
  const parsedStatus = statusSchema.parse(status);

  const requiredPermission =
    parsedStatus === "APPROVATO"
      ? "quotes:approve"
      : "quotes:write";

  if (!hasPermission(session?.user.permissions, requiredPermission)) {
    throw new Error("Permesso negato");
  }

  const quote = await prisma.quote.update({
    where: { id: quoteId },
    data: { status: parsedStatus },
    include: { client: { select: { name: true, surname: true } } },
  });

  if (parsedStatus === "IN_ATTESA") {
    await notifyTitolari({
      type: "quote_pending",
      title: `Preventivo ${quote.number} in attesa di approvazione`,
      body: `${quote.client.name} ${quote.client.surname}`,
      link: `/preventivi/${quote.id}`,
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: session!.user.id,
      entityType: "quote",
      entityId: quoteId,
      action: `status:${parsedStatus}`,
      source: "manual",
    },
  });

  revalidatePath("/preventivi");
  revalidatePath(`/preventivi/${quoteId}`);
}

export async function deleteQuote(quoteId: string) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "quotes:delete")) {
    throw new Error("Permesso negato");
  }

  await prisma.quote.delete({ where: { id: quoteId } });
  revalidatePath("/preventivi");
}

export async function convertQuoteToInvoice(quoteId: string, dueDateStr: string): Promise<string> {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "invoices:write")) {
    throw new Error("Permesso negato: servono i permessi fatture");
  }

  const quote = await prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: { client: { select: { name: true, surname: true } } },
  });

  if (!["APPROVATO", "CONVERTITO"].includes(quote.status)) {
    throw new Error("Solo i preventivi approvati possono essere convertiti in fattura");
  }

  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({ where: { number: { startsWith: `FT-${year}-` } } });
  const number = `FT-${year}-${String(count + 1).padStart(4, "0")}`;

  const items = (quote.items as { description: string; quantity: number; unitPrice: number }[]).map(
    (i) => ({ description: i.description, amount: i.quantity * i.unitPrice })
  );

  const invoice = await prisma.invoice.create({
    data: {
      number,
      clientId: quote.clientId,
      quoteId: quote.id,
      items,
      total: quote.total,
      dueDate: new Date(dueDateStr),
      createdById: session!.user.id,
    },
  });

  await prisma.quote.update({ where: { id: quoteId }, data: { status: "CONVERTITO" } });

  await prisma.auditLog.create({
    data: {
      userId: session!.user.id,
      entityType: "invoice",
      entityId: invoice.id,
      action: "create:from_quote",
      source: "manual",
    },
  });

  revalidatePath("/preventivi");
  revalidatePath(`/preventivi/${quoteId}`);
  revalidatePath("/fatture");
  return invoice.id;
}
