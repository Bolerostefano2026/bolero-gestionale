import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { CalendarView } from "./calendar-view";
import type { Prisma } from "@prisma/client";

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string; cliente?: string }>;
}) {
  const session = await auth();
  const { y, m, cliente } = await searchParams;

  const now = new Date();
  const monthDate = new Date(
    y ? Number(y) : now.getFullYear(),
    m ? Number(m) - 1 : now.getMonth(),
    1
  );

  const rangeStart = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const rangeEnd = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });

  const canSeeAll = hasPermission(session?.user.permissions, "appointments:read_all");
  const appointmentWhere: Prisma.AppointmentWhereInput = {
    scheduledAt: { gte: rangeStart, lte: rangeEnd },
    ...(canSeeAll ? {} : { assignedToId: session!.user.id }),
  };

  const [appointments, clients, users] = await Promise.all([
    prisma.appointment.findMany({
      where: appointmentWhere,
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.client.findMany({
      select: { id: true, name: true, surname: true },
      orderBy: { surname: "asc" },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <CalendarView
      monthDate={monthDate}
      appointments={appointments}
      clients={clients}
      users={users}
      defaultClientId={cliente}
    />
  );
}
