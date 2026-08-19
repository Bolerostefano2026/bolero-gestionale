"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronUp, ChevronDown, Save } from "lucide-react";
import { saveTemplateFields } from "../actions";
import { FIELD_TYPE_LABELS, type FieldType } from "@/lib/field-types";

type DraftField = {
  label: string;
  type: FieldType;
  required: boolean;
  unit?: string;
  options?: string[];
};

const inputClass =
  "w-full rounded-md border border-fog bg-canvas px-2.5 py-1.5 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper";

export function FieldBuilder({
  templateId,
  initialFields,
}: {
  templateId: string;
  initialFields: DraftField[];
}) {
  const [fields, setFields] = useState<DraftField[]>(
    initialFields.length ? initialFields : []
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function update(index: number, patch: Partial<DraftField>) {
    setSaved(false);
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function addField() {
    setSaved(false);
    setFields((prev) => [
      ...prev,
      { label: "", type: "text", required: false },
    ]);
  }

  function removeField(index: number) {
    setSaved(false);
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    setSaved(false);
    setFields((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function handleSave() {
    setError(null);
    const cleaned = fields.filter((f) => f.label.trim());
    startTransition(async () => {
      try {
        await saveTemplateFields(templateId, cleaned);
        setSaved(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore imprevisto");
      }
    });
  }

  return (
    <div>
      <div className="space-y-3">
        {fields.map((field, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_160px_90px_auto] items-start gap-2 rounded-md border border-fog p-3"
          >
            <div className="space-y-2">
              <input
                value={field.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Nome campo (es. Larghezza)"
                className={inputClass}
              />
              {field.type === "dimension" && (
                <input
                  value={field.unit ?? ""}
                  onChange={(e) => update(i, { unit: e.target.value })}
                  placeholder="Unità (es. cm)"
                  className={inputClass}
                />
              )}
              {field.type === "select" && (
                <input
                  value={(field.options ?? []).join(", ")}
                  onChange={(e) =>
                    update(i, {
                      options: e.target.value
                        .split(",")
                        .map((o) => o.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Opzioni separate da virgola"
                  className={inputClass}
                />
              )}
            </div>

            <select
              value={field.type}
              onChange={(e) => update(i, { type: e.target.value as FieldType })}
              className={inputClass}
            >
              {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 pt-1.5 text-xs text-ink2">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => update(i, { required: e.target.checked })}
              />
              Obbligatorio
            </label>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink3 hover:bg-sunken disabled:opacity-30"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === fields.length - 1}
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink3 hover:bg-sunken disabled:opacity-30"
              >
                <ChevronDown size={14} />
              </button>
              <button
                type="button"
                onClick={() => removeField(i)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink3 hover:bg-danger-bg hover:text-danger"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <p className="text-sm text-ink3">Nessun campo definito ancora.</p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={addField}
          className="flex items-center gap-1.5 rounded-md border border-fog px-3.5 py-2 text-sm font-medium text-ink2 hover:bg-sunken"
        >
          <Plus size={15} />
          Aggiungi campo
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-md bg-copper px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt disabled:opacity-60"
        >
          <Save size={15} />
          {pending ? "Salvataggio…" : "Salva scheda"}
        </button>
        {saved && <span className="text-xs font-medium text-success">Salvato</span>}
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
