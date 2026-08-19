"use client";

import { useState, useTransition } from "react";
import { createAppointment, updateAppointment, deleteAppointment } from "./actions";
import { APPOINTMENT_TYPE } from "@/lib/labels";

const inputClass =
  "w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
        {label}
      </label>
      {children}
    </div>
  );
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export type AppointmentData = {
  id: string;
  clientId: string;
  assignedToId: string | null;
  type: string;
  status: string;
  scheduledAt: Date;
  durationMin: number;
  address: string | null;
  notes: string | null;
};

export function AppointmentForm({
  clients,
  users,
  appointment,
  defaultClientId,
  defaultDate,
  onDone,
}: {
  clients: { id: string; name: string; surname: string }[];
  users: { id: string; name: string }[];
  appointment?: AppointmentData;
  defaultClientId?: string;
  defaultDate?: Date;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (appointment) {
          await updateAppointment(appointment.id, formData);
        } else {
          await createAppointment(formData);
        }
        onDone();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore imprevisto");
      }
    });
  }

  function handleDelete() {
    if (!appointment) return;
    startTransition(async () => {
      await deleteAppointment(appointment.id);
      onDone();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Field label="Cliente">
        <select
          name="clientId"
          required
          defaultValue={appointment?.clientId ?? defaultClientId ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            Seleziona un cliente
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.surname}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo">
          <select
            name="type"
            defaultValue={appointment?.type ?? "APPUNTAMENTO"}
            className={inputClass}
          >
            {Object.entries(APPOINTMENT_TYPE).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Assegnato a">
          <select
            name="assignedToId"
            defaultValue={appointment?.assignedToId ?? ""}
            className={inputClass}
          >
            <option value="">Nessuno</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Data e ora">
          <input
            type="datetime-local"
            name="scheduledAt"
            required
            defaultValue={toLocalInputValue(
              appointment?.scheduledAt ?? defaultDate ?? new Date()
            )}
            className={inputClass}
          />
        </Field>
        <Field label="Durata (minuti)">
          <input
            type="number"
            name="durationMin"
            step={15}
            min={15}
            max={480}
            defaultValue={appointment?.durationMin ?? 60}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Indirizzo">
        <input
          name="address"
          defaultValue={appointment?.address ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Note">
        <textarea
          name="notes"
          rows={3}
          defaultValue={appointment?.notes ?? ""}
          className={inputClass}
        />
      </Field>

      {error && (
        <p className="rounded-md bg-danger-bg px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt disabled:opacity-60"
        >
          {pending ? "Salvataggio…" : appointment ? "Salva modifiche" : "Crea appuntamento"}
        </button>
        {appointment && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="text-sm font-medium text-danger hover:underline"
          >
            Elimina
          </button>
        )}
      </div>
    </form>
  );
}
