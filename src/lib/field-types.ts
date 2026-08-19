export type FieldType =
  | "number"
  | "text"
  | "textarea"
  | "select"
  | "checkbox"
  | "dimension";

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  number: "Numero",
  text: "Testo",
  textarea: "Nota (testo lungo)",
  select: "Selezione (dropdown)",
  checkbox: "Checkbox (sì/no)",
  dimension: "Dimensione (valore + unità)",
};

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  unit?: string;
  options?: string[];
};

export function slugifyKey(label: string) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
