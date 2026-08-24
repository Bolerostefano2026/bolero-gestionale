"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMeasurement } from "./actions";
import { DynamicField } from "./dynamic-field";
import { PhotoUploader, type Photo } from "./photo-uploader";
import { Preview3DPanel } from "@/components/three/preview-3d-panel";
import { extractDimensions, extractColor, hasAnyDimension } from "@/lib/dimensions";
import type { FieldDef } from "@/lib/field-types";

const inputClass =
  "w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper";

type ProductWithTemplate = {
  id: string;
  name: string;
  templates: { id: string; fields: FieldDef[] }[];
};

export function MeasurementForm({
  clients,
  products,
  defaultClientId,
}: {
  clients: { id: string; name: string; surname: string }[];
  products: ProductWithTemplate[];
  defaultClientId?: string;
}) {
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [productId, setProductId] = useState("");
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const selectedProduct = products.find((p) => p.id === productId);
  const template = selectedProduct?.templates[0];
  const fields = useMemo(() => template?.fields ?? [], [template]);

  function handleProductChange(id: string) {
    setProductId(id);
    setValues({});
  }

  function handleSubmit() {
    setError(null);

    if (!clientId) return setError("Seleziona un cliente");
    if (!productId || !template) return setError("Seleziona un prodotto");

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("clientId", clientId);
        formData.set("productId", productId);
        formData.set("templateId", template.id);
        formData.set("data", JSON.stringify(values));
        formData.set("photos", JSON.stringify(photos));
        formData.set("notes", notes);
        const id = await createMeasurement(formData);
        router.push(`/misure/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore imprevisto");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
            Cliente
          </label>
          <select
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
            Prodotto
          </label>
          <select
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              Seleziona un prodotto
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {template && (
        <>
          {fields.length === 0 ? (
            <p className="rounded-md bg-sunken px-3 py-2 text-sm text-ink3">
              Questo prodotto non ha ancora campi configurati. Aggiungili da
              Impostazioni → Prodotti.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <DynamicField
                  key={field.key}
                  field={field}
                  value={values[field.key]}
                  onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
                />
              ))}
            </div>
          )}

          {hasAnyDimension(fields) && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink2">
                Anteprima 3D
              </label>
              <Preview3DPanel
                dimensions={extractDimensions(fields, values)}
                productName={selectedProduct?.name ?? ""}
                color={extractColor(fields, values)}
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink2">
              Foto
            </label>
            <PhotoUploader photos={photos} onChange={setPhotos} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
              Note
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </div>
        </>
      )}

      {error && (
        <p className="rounded-md bg-danger-bg px-3 py-2 text-xs text-danger">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt disabled:opacity-60"
      >
        {pending ? "Salvataggio…" : "Salva misurazione"}
      </button>
    </div>
  );
}
