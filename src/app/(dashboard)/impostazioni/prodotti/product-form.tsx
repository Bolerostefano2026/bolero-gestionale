"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createProduct } from "./actions";

const inputClass =
  "w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper";

export function ProductForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const id = await createProduct(formData);
        router.push(`/impostazioni/prodotti/${id}`);
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
        Nuovo prodotto
      </button>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="mb-6 rounded-lg border border-fog bg-surface p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
            Nome prodotto
          </label>
          <input name="name" required className={inputClass} placeholder="es. Pergotenda" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
            Categoria
          </label>
          <input name="category" className={inputClass} placeholder="es. Coperture" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
            Descrizione
          </label>
          <textarea name="description" rows={2} className={inputClass} />
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
          {pending ? "Creazione…" : "Crea prodotto"}
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
