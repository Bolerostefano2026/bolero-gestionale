"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import type { FieldDef } from "@/lib/field-types";

async function requireWrite() {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "measurements:write")) {
    throw new Error("Permesso negato");
  }
  return session!;
}

function validateAgainstTemplate(fields: FieldDef[], data: Record<string, unknown>) {
  for (const field of fields) {
    const value = data[field.key];
    if (field.required && (value === undefined || value === null || value === "")) {
      throw new Error(`Il campo "${field.label}" è obbligatorio`);
    }
  }
}

const createSchema = z.object({
  clientId: z.string().uuid("Seleziona un cliente"),
  productId: z.string().uuid("Seleziona un prodotto"),
  templateId: z.string().uuid(),
  data: z.string(),
  photos: z.string().optional(),
  notes: z.string().optional(),
});

export async function createMeasurement(formData: FormData) {
  const session = await requireWrite();

  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
  }

  const template = await prisma.measurementTemplate.findUniqueOrThrow({
    where: { id: parsed.data.templateId },
  });

  let data: Record<string, unknown>;
  let photos: { url: string; caption?: string }[] = [];
  try {
    data = JSON.parse(parsed.data.data);
    if (parsed.data.photos) photos = JSON.parse(parsed.data.photos);
  } catch {
    throw new Error("Dati della scheda non validi");
  }

  validateAgainstTemplate(template.fields as unknown as FieldDef[], data);

  const measurement = await prisma.measurement.create({
    data: {
      clientId: parsed.data.clientId,
      productId: parsed.data.productId,
      templateId: parsed.data.templateId,
      data: data as Prisma.InputJsonValue,
      // Congela la scheda usata per questo rilievo: se il titolare modificherà
      // i campi del prodotto, questa misurazione resterà comunque leggibile.
      fieldsSnapshot: template.fields as Prisma.InputJsonValue,
      templateVersion: template.version,
      photos: photos as unknown as Prisma.InputJsonValue,
      notes: parsed.data.notes,
      createdById: session.user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      entityType: "measurement",
      entityId: measurement.id,
      action: "create",
      source: "manual",
    },
  });

  revalidatePath("/misure");
  revalidatePath(`/clienti/${parsed.data.clientId}`);
  return measurement.id;
}

const updateSchema = z.object({
  data: z.string(),
  photos: z.string().optional(),
  notes: z.string().optional(),
});

export async function updateMeasurement(measurementId: string, formData: FormData) {
  const session = await requireWrite();

  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
  }

  const measurement = await prisma.measurement.findUniqueOrThrow({
    where: { id: measurementId },
    include: { template: true },
  });

  const fields =
    (measurement.fieldsSnapshot as unknown as FieldDef[] | null)?.length
      ? (measurement.fieldsSnapshot as unknown as FieldDef[])
      : (measurement.template.fields as unknown as FieldDef[]);

  let data: Record<string, unknown>;
  let photos: { url: string; caption?: string }[] = [];
  try {
    data = JSON.parse(parsed.data.data);
    if (parsed.data.photos) photos = JSON.parse(parsed.data.photos);
  } catch {
    throw new Error("Dati della scheda non validi");
  }

  validateAgainstTemplate(fields, data);

  await prisma.measurement.update({
    where: { id: measurementId },
    data: {
      data: data as Prisma.InputJsonValue,
      photos: photos as unknown as Prisma.InputJsonValue,
      notes: parsed.data.notes,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      entityType: "measurement",
      entityId: measurementId,
      action: "update",
      source: "manual",
    },
  });

  revalidatePath("/misure");
  revalidatePath(`/misure/${measurementId}`);
}

export async function deleteMeasurement(measurementId: string) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "measurements:write")) {
    throw new Error("Permesso negato");
  }
  await prisma.measurement.delete({ where: { id: measurementId } });
  revalidatePath("/misure");
}
