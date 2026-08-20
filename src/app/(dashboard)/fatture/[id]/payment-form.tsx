"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordPayment } from "../actions";

const inputClass =
  "w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper";

export function PaymentForm({
  invoiceId,
  remaining,
}: {
  invoiceId: string;
  remaining: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await recordPayment(invoiceId, formData);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore imprevisto");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
            Importo CHF
          </label>
          <input
            type="number"
            name="amount"
            step="0.01"
            min={0}
            max={remaining}
            required
            defaultValue={remaining}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
            Metodo
          </label>
          <select name="method" defaultValue="bonifico" className={inputClass}>
            <option value="bonifico">Bonifico</option>
            <option value="contanti">Contanti</option>
            <option value="carta">Carta</option>
            <option value="assegno">Assegno</option>
          </select>
        </div>
      </div>
      <input
        name="note"
        placeholder="Nota (opzionale)"
        className={inputClass}
      />
      {error && (
        <p className="rounded-md bg-danger-bg px-3 py-2 text-xs text-danger">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt disabled:opacity-60"
      >
        {pending ? "Registrazione…" : "Registra pagamento"}
      </button>
    </form>
  );
}
