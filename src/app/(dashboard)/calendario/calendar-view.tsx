"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { APPOINTMENT_STATUS, APPOINTMENT_TYPE } from "@/lib/labels";
import { AppointmentForm, type AppointmentData } from "./appointment-form";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export function CalendarView({
  monthDate,
  appointments,
  clients,
  users,
  defaultClientId,
}: {
  monthDate: Date;
  appointments: AppointmentData[];
  clients: { id: string; name: string; surname: string }[];
  users: { id: string; name: string }[];
  defaultClientId?: string;
}) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [modal, setModal] = useState<
    { mode: "create"; date: Date } | { mode: "edit"; appointment: AppointmentData } | null
  >(defaultClientId ? { mode: "create", date: new Date() } : null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthDate]);

  function goToMonth(date: Date) {
    router.push(`/calendario?y=${date.getFullYear()}&m=${date.getMonth() + 1}`);
  }

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, AppointmentData[]>();
    for (const a of appointments) {
      const key = format(a.scheduledAt, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [appointments]);

  const selectedDayAppointments = (
    appointmentsByDay.get(format(selectedDay, "yyyy-MM-dd")) ?? []
  ).sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold capitalize text-ink">
          {format(monthDate, "MMMM yyyy", { locale: it })}
        </h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToMonth(addMonths(monthDate, -1))}
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink2 hover:bg-sunken"
            aria-label="Mese precedente"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            type="button"
            onClick={() => goToMonth(new Date())}
            className="rounded-md px-3 py-1.5 text-xs font-semibold text-ink2 hover:bg-sunken"
          >
            Oggi
          </button>
          <button
            type="button"
            onClick={() => goToMonth(addMonths(monthDate, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink2 hover:bg-sunken"
            aria-label="Mese successivo"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border border-fog bg-surface">
          <div className="grid grid-cols-7 border-b border-fog bg-sunken">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-ink3"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayAppointments = appointmentsByDay.get(key) ?? [];
              const inMonth = isSameMonth(day, monthDate);
              const selected = isSameDay(day, selectedDay);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[86px] border-b border-r border-fog p-1.5 text-left align-top transition-colors last:border-r-0 ${
                    selected ? "bg-copper-bg" : "hover:bg-sunken"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isToday(day)
                        ? "bg-copper text-white"
                        : inMonth
                          ? "text-ink"
                          : "text-ink3"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayAppointments.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        className="truncate rounded bg-copper-bg px-1 py-0.5 text-[10px] font-medium text-copper"
                      >
                        {format(a.scheduledAt, "HH:mm")} {APPOINTMENT_TYPE[a.type]}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-[10px] font-medium text-ink3">
                        +{dayAppointments.length - 2} altri
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-fog bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-ink">
              {format(selectedDay, "EEEE d MMMM", { locale: it })}
            </h2>
            <button
              type="button"
              onClick={() => setModal({ mode: "create", date: selectedDay })}
              className="flex items-center gap-1 text-xs font-semibold text-copper hover:underline"
            >
              <Plus size={13} />
              Aggiungi
            </button>
          </div>

          {selectedDayAppointments.length === 0 ? (
            <p className="text-sm text-ink3">Nessun appuntamento.</p>
          ) : (
            <ul className="space-y-2">
              {selectedDayAppointments.map((a) => {
                const s = APPOINTMENT_STATUS[a.status];
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setModal({ mode: "edit", appointment: a })}
                      className="w-full rounded-md border border-fog p-2.5 text-left text-sm hover:border-copper"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-ink">
                          {format(a.scheduledAt, "HH:mm")} · {APPOINTMENT_TYPE[a.type]}
                        </span>
                        <Badge label={s.label} tone={s.tone} />
                      </div>
                      {a.address && (
                        <p className="mt-1 text-xs text-ink2">{a.address}</p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {modal && (
        <Modal
          title={modal.mode === "create" ? "Nuovo appuntamento" : "Modifica appuntamento"}
          onClose={() => setModal(null)}
        >
          <AppointmentForm
            clients={clients}
            users={users}
            appointment={modal.mode === "edit" ? modal.appointment : undefined}
            defaultClientId={modal.mode === "create" ? defaultClientId : undefined}
            defaultDate={modal.mode === "create" ? modal.date : undefined}
            onDone={() => {
              setModal(null);
              router.refresh();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
