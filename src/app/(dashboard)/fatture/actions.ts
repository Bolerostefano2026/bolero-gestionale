"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { notifyTitolari } from "@/lib/notify";
import { inviaEmail, type EsitoInvio } from "@/lib/email";

async function requireWrite() {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "invoices:write")) {
    throw new Error("Permesso negato");
  }
  return session!;
}

async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { number: { startsWith: `FT-${year}-` } },
  });
  return `FT-${year}-${String(count + 1).padStart(4, "0")}`;
}

const itemSchema = z.object({
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
});

const createSchema = z.object({
  clientId: z.string().uuid("Seleziona un cliente"),
  quoteId: z.string().uuid().optional().or(z.literal("")),
  projectId: z.string().uuid().optional().or(z.literal("")),
  items: z.string().transform((s, ctx) => {
    try {
      const parsed = JSON.parse(s);
      return z.array(itemSchema).min(1, "Aggiungi almeno una voce").parse(parsed);
    } catch {
      ctx.addIssue({ code: "custom", message: "Voci non valide" });
      return z.NEVER;
    }
  }),
  dueDate: z.string().min(1, "Scadenza obbligatoria"),
});

export async function createInvoice(formData: FormData) {
  const session = await requireWrite();

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
  }

  const { clientId, quoteId, projectId, items, dueDate } = parsed.data;
  const total = items.reduce((sum, i) => sum + i.amount, 0);
  const number = await nextInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
      number,
      clientId,
      quoteId: quoteId || null,
      projectId: projectId || null,
      items,
      total,
      dueDate: new Date(dueDate),
      createdById: session.user.id,
    },
  });

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { name: true, surname: true },
  });
  const money = (n: number) => `CHF ${n.toLocaleString("it-CH", { minimumFractionDigits: 2 })}`;
  void (await import("@/lib/email")).notificaTitolari({
    oggetto: `🧾 Nuova fattura ${number} — ${client?.name} ${client?.surname}`,
    titolo: `Fattura ${number} creata`,
    corpo: `Cliente: ${client?.name} ${client?.surname}<br>Totale: ${money(total)}<br>Scadenza: ${new Date(dueDate).toLocaleDateString("it-IT")}`,
    link: `${process.env.NEXTAUTH_URL ?? ""}/fatture/${invoice.id}`,
  });

  revalidatePath("/fatture");
  return invoice.id;
}

export async function markInvoiceSent(invoiceId: string) {
  await requireWrite();
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  const now = new Date();
  const newStatus = invoice.dueDate < now ? "SCADUTA" : "INVIATA";
  await prisma.invoice.update({ where: { id: invoiceId }, data: { status: newStatus } });
  revalidatePath("/fatture");
  revalidatePath(`/fatture/${invoiceId}`);
}

const paymentSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.string().min(1),
  note: z.string().optional(),
});

export async function recordPayment(invoiceId: string, formData: FormData) {
  const session = await requireWrite();

  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
  }

  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { payments: true },
  });

  await prisma.payment.create({
    data: {
      invoiceId,
      amount: parsed.data.amount,
      method: parsed.data.method,
      note: parsed.data.note,
      recordedById: session.user.id,
    },
  });

  const paidSoFar =
    invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0) + parsed.data.amount;

  const moneyFmt = (n: number) => `CHF ${n.toLocaleString("it-CH", { minimumFractionDigits: 2 })}`;
  if (paidSoFar >= Number(invoice.total)) {
    await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "PAGATA" } });
    const invClient = await prisma.client.findUnique({ where: { id: invoice.clientId }, select: { name: true, surname: true } });
    void (await import("@/lib/email")).notificaTitolari({
      oggetto: `✅ Fattura ${invoice.number} — pagamento completo`,
      titolo: `Fattura saldata completamente`,
      corpo: `${invClient?.name} ${invClient?.surname} ha completato il pagamento della fattura ${invoice.number} · ${moneyFmt(Number(invoice.total))}`,
      link: `${process.env.NEXTAUTH_URL ?? ""}/fatture/${invoiceId}`,
    });
  } else {
    const invClient = await prisma.client.findUnique({ where: { id: invoice.clientId }, select: { name: true, surname: true } });
    void (await import("@/lib/email")).notificaTitolari({
      oggetto: `💰 Pagamento parziale — fattura ${invoice.number}`,
      titolo: `Pagamento registrato`,
      corpo: `${invClient?.name} ${invClient?.surname} · Ricevuto ${moneyFmt(parsed.data.amount)} via ${parsed.data.method}<br>Residuo: ${moneyFmt(Number(invoice.total) - paidSoFar)}`,
      link: `${process.env.NEXTAUTH_URL ?? ""}/fatture/${invoiceId}`,
    });
  }

  revalidatePath("/fatture");
  revalidatePath(`/fatture/${invoiceId}`);
}

export async function createReminder(invoiceId: string) {
  const session = await requireWrite();

  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { client: true },
  });

  const draft = await prisma.emailDraft.create({
    data: {
      clientId: invoice.clientId,
      invoiceId: invoice.id,
      subject: `Promemoria pagamento fattura ${invoice.number}`,
      body: `Gentile ${invoice.client.name} ${invoice.client.surname},\n\nLe scriviamo per ricordarle che la fattura ${invoice.number} di CHF ${Number(invoice.total).toFixed(2)} risulta ancora da saldare (scadenza: ${invoice.dueDate.toLocaleDateString("it-IT")}).\n\nLa preghiamo di provvedere al pagamento appena possibile, o di contattarci per qualsiasi chiarimento.\n\nCordiali saluti,\nBolero`,
      createdById: session.user.id,
    },
  });

  await notifyTitolari({
    type: "reminder_pending",
    title: `Promemoria da approvare — ${invoice.client.name} ${invoice.client.surname}`,
    body: `Fattura ${invoice.number}`,
    link: "/fatture/promemoria",
  });

  revalidatePath("/fatture");
  return draft.id;
}

/**
 * Approva un promemoria e tenta l'invio reale.
 *
 * Lo stato diventa INVIATA solo se l'email è partita davvero. Se il servizio
 * email non è configurato, o l'invio fallisce, resta APPROVATA e il chiamante
 * riceve il motivo: il gestionale non deve far credere al titolare di aver
 * sollecitato un cliente che invece non ha ricevuto nulla.
 */
export async function approveReminder(draftId: string): Promise<{
  inviata: boolean;
  motivo?: string;
}> {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "invoices:approve_reminder")) {
    throw new Error("Permesso negato");
  }

  const draft = await prisma.emailDraft.findUniqueOrThrow({
    where: { id: draftId },
    include: { client: { select: { email: true, name: true, surname: true } } },
  });

  let esito: EsitoInvio;
  if (!draft.client.email) {
    esito = {
      inviata: false,
      motivo: `${draft.client.name} ${draft.client.surname} non ha un indirizzo email in anagrafica.`,
    };
  } else {
    esito = await inviaEmail({
      a: draft.client.email,
      oggetto: draft.subject,
      testo: draft.body,
    });
  }

  await prisma.emailDraft.update({
    where: { id: draftId },
    data: {
      status: esito.inviata ? "INVIATA" : "APPROVATA",
      approvedById: session!.user.id,
      decidedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session!.user.id,
      entityType: "email_draft",
      entityId: draftId,
      action: esito.inviata ? "approve_and_send" : "approve_only",
      changes: esito.inviata ? undefined : { motivo: esito.motivo },
      source: "manual",
    },
  });

  revalidatePath("/fatture/promemoria");
  return esito.inviata
    ? { inviata: true }
    : { inviata: false, motivo: esito.motivo };
}

export async function rejectReminder(draftId: string) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "invoices:approve_reminder")) {
    throw new Error("Permesso negato");
  }

  await prisma.emailDraft.update({
    where: { id: draftId },
    data: { status: "RIFIUTATA", approvedById: session!.user.id, decidedAt: new Date() },
  });

  revalidatePath("/fatture/promemoria");
}
