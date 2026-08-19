"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient, updateClient } from "./actions";

const STATUS_OPTIONS = [
  { value: "LEAD", label: "Lead" },
  { value: "ATTIVO", label: "Attivo" },
  { value: "IN_LAVORAZIONE", label: "In lavorazione" },
  { value: "CHIUSO", label: "Chiuso" },
  { value: "INATTIVO", label: "Inattivo" },
];

type ClientData = {
  id: string;
  name: string;
  surname: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  cap: string | null;
  status: string;
  notes: string | null;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper";

export function ClientForm({
  client,
  onCancel,
}: {
  client?: ClientData;
  onCancel?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (client) {
          await updateClient(client.id, formData);
          router.refresh();
          onCancel?.();
        } else {
          const id = await createClient(formData);
          router.push(`/clienti/${id}`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore imprevisto");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome">
          <input
            name="name"
            required
            defaultValue={client?.name}
            className={inputClass}
          />
        </Field>
        <Field label="Cognome">
          <input
            name="surname"
            required
            defaultValue={client?.surname}
            className={inputClass}
          />
        </Field>
        <Field label="Telefono">
          <input
            name="phone"
            defaultValue={client?.phone ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Email">
          <input
            name="email"
            type="email"
            defaultValue={client?.email ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Indirizzo">
          <input
            name="address"
            defaultValue={client?.address ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Città">
          <input
            name="city"
            defaultValue={client?.city ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="CAP">
          <input
            name="cap"
            defaultValue={client?.cap ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Stato">
          <select
            name="status"
            defaultValue={client?.status ?? "LEAD"}
            className={inputClass}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Note">
        <textarea
          name="notes"
          rows={3}
          defaultValue={client?.notes ?? ""}
          className={inputClass}
        />
      </Field>

      {error && (
        <p className="rounded-md bg-danger-bg px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt disabled:opacity-60"
        >
          {pending ? "Salvataggio…" : client ? "Salva modifiche" : "Crea cliente"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-ink2 hover:bg-sunken"
          >
            Annulla
          </button>
        )}
      </div>
    </form>
  );
}
