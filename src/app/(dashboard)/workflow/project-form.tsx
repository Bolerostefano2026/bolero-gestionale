"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "./actions";

const inputClass =
  "w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper";

type QuoteOption = { id: string; number: string; clientId: string };
type MeasurementOption = { id: string; productName: string; clientId: string };

export function ProjectForm({
  clients,
  quotes,
  measurements,
  defaultClientId,
}: {
  clients: { id: string; name: string; surname: string }[];
  quotes: QuoteOption[];
  measurements: MeasurementOption[];
  defaultClientId?: string;
}) {
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const clientQuotes = useMemo(
    () => quotes.filter((q) => q.clientId === clientId),
    [quotes, clientId]
  );
  const clientMeasurements = useMemo(
    () => measurements.filter((m) => m.clientId === clientId),
    [measurements, clientId]
  );

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const id = await createProject(formData);
        router.push(`/workflow/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore imprevisto");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
          Cliente
        </label>
        <select
          name="clientId"
          required
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
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
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
          Titolo progetto
        </label>
        <input
          name="title"
          required
          placeholder="es. Pergotenda giardino Rossi"
          className={inputClass}
        />
      </div>

      {clientId && (clientQuotes.length > 0 || clientMeasurements.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {clientQuotes.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
                Collega preventivo
              </label>
              <select name="quoteId" defaultValue="" className={inputClass}>
                <option value="">Nessuno</option>
                {clientQuotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.number}
                  </option>
                ))}
              </select>
            </div>
          )}
          {clientMeasurements.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
                Collega misurazione
              </label>
              <select name="measurementId" defaultValue="" className={inputClass}>
                <option value="">Nessuna</option>
                {clientMeasurements.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.productName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
          Note
        </label>
        <textarea name="notes" rows={3} className={inputClass} />
      </div>

      {error && (
        <p className="rounded-md bg-danger-bg px-3 py-2 text-xs text-danger">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt disabled:opacity-60"
      >
        {pending ? "Creazione…" : "Crea progetto"}
      </button>
    </form>
  );
}
