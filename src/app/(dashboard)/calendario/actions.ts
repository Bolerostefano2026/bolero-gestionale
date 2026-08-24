"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { notify } from "@/lib/notify";
import { notificaTitolari } from "@/lib/email";
import { pushAppointmentToCalendar, deleteCalendarEvent } from "@/lib/google-calendar";

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

  const tipoLabel: Record<string, string> = {
    APPUNTAMENTO: "Appuntamento",
    SOPRALLUOGO: "Sopralluogo",
    MONTAGGIO: "Montaggio",
    ALTRO: "Altro",
  };
  void notificaTitolari({
    oggetto: `📅 Nuovo appuntamento — ${appointment.client.name} ${appointment.client.surname}`,
    titolo: `${tipoLabel[appointment.type] ?? appointment.type} fissato`,
    corpo: `${appointment.client.name} ${appointment.client.surname} · ${appointment.scheduledAt.toLocaleDateString("it-IT")} alle ${appointment.scheduledAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}${appointment.address ? ` · ${appointment.address}` : ""}`,
    link: `${process.env.NEXTAUTH_URL ?? ""}/calendario`,
  });

  // Sincronizza con Google Calendar in background (non blocca la risposta)
  void pushAppointmentToCalendar({
    id: appointment.id,
    scheduledAt: appointment.scheduledAt,
    durationMin: appointment.durationMin,
    type: appointment.type,
    address: appointment.address,
    notes: appointment.notes,
    clientName: `${appointment.client.name} ${appointment.client.surname}`,
  }).then((googleEventId) => {
    if (googleEventId) {
      void prisma.appointment.update({
        where: { id: appointment.id },
        data: { googleEventId },
      });
    }
  });

  revalidatePath("/calendario");
}

export async function updateAppointment(appointmentId: string, formData: FormData) {
  await requireWrite();

  const parsed = appointmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Dati non validi");
  }

  const { assignedToId, scheduledAt, ...rest } = parsed.data;

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      ...rest,
      scheduledAt: new Date(scheduledAt),
      assignedToId: assignedToId || null,
    },
    include: { client: { select: { name: true, surname: true } } },
  });

  // Aggiorna l'evento su Google Calendar se già sincronizzato
  void pushAppointmentToCalendar({
    id: updated.id,
    scheduledAt: updated.scheduledAt,
    durationMin: updated.durationMin,
    type: updated.type,
    address: updated.address,
    notes: updated.notes,
    clientName: `${updated.client.name} ${updated.client.surname}`,
    googleEventId: updated.googleEventId,
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
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { googleEventId: true },
  });
  await prisma.appointment.delete({ where: { id: appointmentId } });
  if (appt?.googleEventId) {
    void deleteCalendarEvent(appt.googleEventId);
  }
  revalidatePath("/calendario");
}
