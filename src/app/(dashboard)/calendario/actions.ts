"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { notify } from "@/lib/notify";

const appointmentSchema = z.object({
  clientId: z.string().uuid("Seleziona un cliente"),
  assignedToId: z.string().uuid().optional().or(z.literal("")),
  type: z.enum(["APPUNTAMENTO", "SOPRALLUOGO", "MONTAGGIO", "ALTRO"]),
  scheduledAt: z.string().min(1, "Data e ora obbligatorie"),
  durationMin: z.coerce.number().int().min(15).max(480),
  address: z.string().optional(),
  notes: z.string().optional(),
});

async function requireWrite() {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "appointments:write")) {
    throw new Error("Permesso negato");
  }
  return session!;
}

export async function createAppointment(formData: FormData) {
  const session = await requireWrite();

  const parsed = appointmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
  }

  const { assignedToId, scheduledAt, ...rest } = parsed.data;

  const appointment = await prisma.appointment.create({
    data: {
      ...rest,
      scheduledAt: new Date(scheduledAt),
      assignedToId: assignedToId || null,
      createdById: session.user.id,
    },
    include: { client: { select: { name: true, surname: true } } },
  });

  if (assignedToId && assignedToId !== session.user.id) {
    await notify(assignedToId, {
      type: "appointment_assigned",
      title: "Nuovo appuntamento assegnato",
      body: `${appointment.client.name} ${appointment.client.surname} — ${appointment.scheduledAt.toLocaleDateString("it-IT")}`,
      link: "/calendario",
    });
  }

  revalidatePath("/calendario");
}

export async function updateAppointment(appointmentId: string, formData: FormData) {
  await requireWrite();

  const parsed = appointmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
  }

  const { assignedToId, scheduledAt, ...rest } = parsed.data;

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      ...rest,
      scheduledAt: new Date(scheduledAt),
      assignedToId: assignedToId || null,
    },
  });

  revalidatePath("/calendario");
}

const statusSchema = z.enum(["PROGRAMMATO", "CONFERMATO", "COMPLETATO", "ANNULLATO"]);

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  await requireWrite();
  const parsedStatus = statusSchema.parse(status);

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: parsedStatus },
  });

  revalidatePath("/calendario");
}

export async function deleteAppointment(appointmentId: string) {
  await requireWrite();
  await prisma.appointment.delete({ where: { id: appointmentId } });
  revalidatePath("/calendario");
}
