"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createUser } from "./actions";

export function CreateUserForm({
  roles,
}: {
  roles: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createUser(formData);
        formRef.current?.reset();
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore imprevisto");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-copper px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt"
      >
        <Plus size={15} />
        Nuovo utente
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="mb-6 rounded-lg border border-fog bg-surface p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
            Nome e cognome
          </label>
          <input
            name="name"
            required
            className="w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
            Ruolo
          </label>
          <select
            name="roleId"
            required
            defaultValue=""
            className="w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper"
          >
            <option value="" disabled>
              Seleziona un ruolo
            </option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
            Password provvisoria
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt disabled:opacity-60"
        >
          {pending ? "Creazione…" : "Crea utente"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-4 py-2 text-sm font-medium text-ink2 hover:bg-sunken"
        >
          Annulla
        </button>
      </div>
    </form>
  );
}
