"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";
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
  return n.toLocaleString("it-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractNotice, setExtractNotice] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function extractFromFile(file: File) {
    setExtracting(true);
    setExtractError(null);
    setExtractNotice(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/preventivi/extract", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Errore estrazione");
      if (Array.isArray(data.items) && data.items.length > 0) {
        setItems(data.items.map((it: Partial<Item>) => ({
          description: it.description ?? "",
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
        })));
      }
      if (data.source === "local") {
        setExtractNotice(
          "Lettura automatica senza AI (crediti non disponibili): controlla le voci prima di salvare."
        );
      }
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : "Errore imprevisto");
    } finally {
      setExtracting(false);
    }
  }

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
          Preventivo fornitore (opzionale)
        </label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) extractFromFile(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-5 text-sm transition ${
            dragOver ? "border-copper bg-sunken" : "border-fog hover:border-copper/60 hover:bg-sunken/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) extractFromFile(f); }}
          />
          {extracting ? (
            <>
              <Loader2 size={20} className="animate-spin text-copper" />
              <span className="text-ink2">Estrazione voci in corso…</span>
            </>
          ) : (
            <>
              <Upload size={20} className="text-ink3" />
              <span className="text-ink2">Trascina qui il preventivo del fornitore (PDF o immagine)</span>
              <span className="text-xs text-ink3">oppure clicca per selezionare il file</span>
            </>
          )}
        </div>
        {extractError && (
          <p className="mt-1 text-xs text-danger">{extractError}</p>
        )}
        {extractNotice && (
          <p className="mt-1 text-xs text-ink2">{extractNotice}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink2">
          Voci di preventivo
        </label>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col gap-1.5 rounded-md border border-fog bg-surface p-2 sm:grid sm:grid-cols-[1fr_70px_100px_90px_auto] sm:items-center sm:gap-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
              <input
                placeholder="Descrizione"
                value={item.description}
                onChange={(e) => updateItem(i, { description: e.target.value })}
                className={inputClass}
              />
              <div className="flex gap-1.5 sm:contents">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                  className={`${inputClass} flex-1 sm:flex-none`}
                  title="Quantità"
                  placeholder="Qtà"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
                  className={`${inputClass} flex-1 sm:flex-none`}
                  title="Prezzo unitario CHF"
                  placeholder="Prezzo CHF"
                />
                <span className="flex items-center whitespace-nowrap text-sm tabular-nums text-ink2 sm:text-right">
                  CHF {money(item.quantity * item.unitPrice)}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  disabled={items.length === 1}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink3 hover:bg-danger-bg hover:text-danger disabled:opacity-30"
                >
                  <Trash2 size={14} />
                </button>
              </div>
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
        <Field label="Sconto (CHF)">
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
          <span className="tabular-nums">CHF {money(subtotal)}</span>
        </div>
        <div className="flex justify-between text-ink2">
          <span>Sconto</span>
          <span className="tabular-nums">−CHF {money(discount)}</span>
        </div>
        <div className="flex justify-between text-ink2">
          <span>IVA ({vatRate}%)</span>
          <span className="tabular-nums">CHF {money(vatAmount)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-fog pt-2 font-display text-base font-bold text-ink">
          <span>Totale</span>
          <span className="tabular-nums">CHF {money(total)}</span>
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
