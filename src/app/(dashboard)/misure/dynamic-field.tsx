"use client";

import type { FieldDef } from "@/lib/field-types";

const inputClass =
  "w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper";

export function DynamicField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
        {field.label}
        {field.required && <span className="text-copper"> *</span>}
      </label>

      {field.type === "number" && (
        <input
          type="number"
          step="any"
          required={field.required}
          value={(value as number | string) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className={inputClass}
        />
      )}

      {field.type === "dimension" && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="any"
            required={field.required}
            value={(value as number | string) ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            className={inputClass}
          />
          {field.unit && (
            <span className="whitespace-nowrap text-sm text-ink3">{field.unit}</span>
          )}
        </div>
      )}

      {field.type === "text" && (
        <input
          type="text"
          required={field.required}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}

      {field.type === "textarea" && (
        <textarea
          rows={3}
          required={field.required}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}

      {field.type === "select" && (
        <select
          required={field.required}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Seleziona…
          </option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {field.type === "checkbox" && (
        <label className="flex items-center gap-2 pt-1 text-sm text-ink2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          Sì
        </label>
      )}
    </div>
  );
}
