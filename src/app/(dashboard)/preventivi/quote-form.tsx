"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createQuote, updateQuote } from "./actions";

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

type Item = { description: string; quantity: number; unitPrice: number };

type QuoteData = {
  id: string;
  clientId: string;
  items: Item[];
  discount: number;
  vatRate: number;
  notes: string | null;
  validUntil: Date | null;
};

function money(n: number) {
  return n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function QuoteForm({
  clients,
  quote,
  defaultClientId,
}: {
  clients: { id: string; name: string; surname: string }[];
  quote?: QuoteData;
  defaultClientId?: string;
}) {
  const [items, setItems] = useState<Item[]>(
    quote?.items.length ? quote.items : [{ description: "", quantity: 1, unitPrice: 0 }]
  );
  const [discount, setDiscount] = useState(quote?.discount ?? 0);
  const [vatRate, setVatRate] = useState(quote?.vatRate ?? 22);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
    [items]
  );
  const taxable = Math.max(subtotal - discount, 0);
  const vatAmount = taxable * (vatRate / 100);
  const total = taxable + vatAmount;

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("items", JSON.stringify(items.filter((i) => i.description.trim())));

    startTransition(async () => {
      try {
        if (quote) {
          await updateQuote(quote.id, formData);
          router.push(`/preventivi/${quote.id}`);
        } else {
          const id = await createQuote(formData);
          router.push(`/preventivi/${id}`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore imprevisto");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <Field label="Cliente">
        <select
          name="clientId"
          required
          defaultValue={quote?.clientId ?? defaultClientId ?? ""}
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

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink2">
          Voci di preventivo
        </label>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_100px_90px_auto] items-center gap-2">
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
                value={item.quantity}
                onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                className={inputClass}
                title="Quantità"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
                className={inputClass}
                title="Prezzo unitario €"
              />
              <span className="text-right text-sm tabular-nums text-ink2">
                €{money(item.quantity * item.unitPrice)}
              </span>
              <button
                type="button"
                onClick={() => removeItem(i)}
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
          onClick={addItem}
          className="mt-2 flex items-center gap-1 text-xs font-semibold text-copper hover:underline"
        >
          <Plus size={13} />
          Aggiungi voce
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Sconto (€)">
          <input
            type="number"
            name="discount"
            min={0}
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="IVA (%)">
          <input
            type="number"
            name="vatRate"
            min={0}
            step="0.1"
            value={vatRate}
            onChange={(e) => setVatRate(Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Valido fino al">
          <input
            type="date"
            name="validUntil"
            defaultValue={
              quote?.validUntil
                ? new Date(quote.validUntil).toISOString().slice(0, 10)
                : ""
            }
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Note">
        <textarea
          name="notes"
          rows={3}
          defaultValue={quote?.notes ?? ""}
          className={inputClass}
        />
      </Field>

      <div className="rounded-md border border-fog bg-sunken p-4 text-sm">
        <div className="flex justify-between text-ink2">
          <span>Subtotale</span>
          <span className="tabular-nums">€{money(subtotal)}</span>
        </div>
        <div className="flex justify-between text-ink2">
          <span>Sconto</span>
          <span className="tabular-nums">−€{money(discount)}</span>
        </div>
        <div className="flex justify-between text-ink2">
          <span>IVA ({vatRate}%)</span>
          <span className="tabular-nums">€{money(vatAmount)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-fog pt-2 font-display text-base font-bold text-ink">
          <span>Totale</span>
          <span className="tabular-nums">€{money(total)}</span>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-danger-bg px-3 py-2 text-xs text-danger">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt disabled:opacity-60"
      >
        {pending ? "Salvataggio…" : quote ? "Salva modifiche" : "Crea preventivo"}
      </button>
    </form>
  );
}
