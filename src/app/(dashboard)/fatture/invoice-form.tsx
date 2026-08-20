"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createInvoice } from "./actions";

const inputClass =
  "w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper";

type Item = { description: string; amount: number };
type QuoteOption = {
  id: string;
  number: string;
  clientId: string;
  total: number;
};

function money(n: number) {
  return n.toLocaleString("it-CH", { minimumFractionDigits: 2 });
}

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export function InvoiceForm({
  clients,
  quotes,
  defaultClientId,
}: {
  clients: { id: string; name: string; surname: string }[];
  quotes: QuoteOption[];
  defaultClientId?: string;
}) {
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [items, setItems] = useState<Item[]>([{ description: "", amount: 0 }]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const clientQuotes = useMemo(
    () => quotes.filter((q) => q.clientId === clientId),
    [quotes, clientId]
  );

  const total = items.reduce((sum, i) => sum + (i.amount || 0), 0);

  function applyQuote(quoteId: string) {
    const quote = clientQuotes.find((q) => q.id === quoteId);
    if (!quote) return;
    setItems([{ description: `Preventivo ${quote.number}`, amount: quote.total }]);
  }

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("items", JSON.stringify(items.filter((i) => i.description.trim())));

    startTransition(async () => {
      try {
        const id = await createInvoice(formData);
        router.push(`/fatture/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore imprevisto");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
            Cliente
          </label>
          <select
            name="clientId"
            required
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setItems([{ description: "", amount: 0 }]);
            }}
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
            Scadenza
          </label>
          <input
            type="date"
            name="dueDate"
            required
            defaultValue={defaultDueDate()}
            className={inputClass}
          />
        </div>
      </div>

      {clientQuotes.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
            Genera da preventivo (opzionale)
          </label>
          <select
            name="quoteId"
            defaultValue=""
            onChange={(e) => e.target.value && applyQuote(e.target.value)}
            className={inputClass}
          >
            <option value="">Nessuno — fattura manuale</option>
            {clientQuotes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.number} — CHF {money(q.total)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink2">
          Voci
        </label>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_120px_auto] items-center gap-2">
              <input
                placeholder="Descrizione"
                value={item.description}
                onChange={(e) => updateItem(i, { description: e.target.value })}
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="Importo CHF"
                value={item.amount || ""}
                onChange={(e) => updateItem(i, { amount: Number(e.target.value) })}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={items.length === 1}
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink3 hover:bg-danger-bg hover:text-danger disabled:opacity-30"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, { description: "", amount: 0 }])}
          className="mt-2 flex items-center gap-1 text-xs font-semibold text-copper hover:underline"
        >
          <Plus size={13} />
          Aggiungi voce
        </button>
      </div>

      <div className="rounded-md border border-fog bg-sunken p-3 text-right">
        <span className="text-sm text-ink2">Totale: </span>
        <span className="font-display text-base font-bold tabular-nums text-ink">
          CHF {money(total)}
        </span>
      </div>

      {error && (
        <p className="rounded-md bg-danger-bg px-3 py-2 text-xs text-danger">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt disabled:opacity-60"
      >
        {pending ? "Creazione…" : "Crea fattura"}
      </button>
    </form>
  );
}
