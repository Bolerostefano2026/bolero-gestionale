"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMeasurement } from "../actions";
import { DynamicField } from "../dynamic-field";
import { PhotoUploader, type Photo } from "../photo-uploader";
import { Preview3DPanel } from "@/components/three/preview-3d-panel";
import { extractDimensions, hasAnyDimension } from "@/lib/dimensions";
import type { FieldDef } from "@/lib/field-types";
import { Check } from "lucide-react";

const inputClass =
  "w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper";

export function EditMeasurementForm({
  measurementId,
  fields,
  initialData,
  initialPhotos,
  initialNotes,
  schedaModificata,
}: {
  measurementId: string;
  fields: FieldDef[];
  initialData: Record<string, unknown>;
  initialPhotos: Photo[];
  initialNotes: string;
  schedaModificata: boolean;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialData);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("data", JSON.stringify(values));
        formData.set("photos", JSON.stringify(photos));
        formData.set("notes", notes);
        await updateMeasurement(measurementId, formData);
        setSaved(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore imprevisto");
      }
    });
  }

  return (
    <div className="space-y-5">
      {schedaModificata && (
        <p className="rounded-md bg-warn-bg px-3 py-2 text-xs text-warn">
          La scheda di misurazione di questo prodotto è stata modificata dopo il
          rilievo. I campi mostrati sono quelli al momento del rilievo originale.
        </p>
      )}

      {fields.length === 0 ? (
        <p className="rounded-md bg-sunken px-3 py-2 text-sm text-ink3">
          Nessun campo definito per questa scheda.
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
          <Preview3DPanel dimensions={extractDimensions(fields, values)} />
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

      {error && (
        <p className="rounded-md bg-danger-bg px-3 py-2 text-xs text-danger">{error}</p>
      )}

      {saved && (
        <p className="flex items-center gap-1.5 rounded-md bg-success-bg px-3 py-2 text-xs text-success">
          <Check size={13} />
          Misure aggiornate con successo.
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt disabled:opacity-60"
      >
        {pending ? "Salvataggio…" : "Salva modifiche"}
      </button>
    </div>
  );
}
