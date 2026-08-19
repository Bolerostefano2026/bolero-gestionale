import type { FieldDef } from "@/lib/field-types";

export type Dimensions = { width: number; depth: number; height: number };

const DEFAULTS: Dimensions = { width: 4, depth: 3, height: 2.6 };

function toMeters(value: number, unit?: string) {
  switch ((unit ?? "cm").toLowerCase()) {
    case "m":
      return value;
    case "mm":
      return value / 1000;
    case "cm":
    default:
      return value / 100;
  }
}

function matchLabel(label: string, keywords: string[]) {
  const normalized = label.toLowerCase();
  return keywords.some((k) => normalized.includes(k));
}

/**
 * Maps a product's dynamic dimension-type fields to width/depth/height for the
 * 3D preview. Matches by label keywords first (larghezza→width, profondità→depth,
 * altezza→height); any unmatched dimension fields fill remaining slots in order.
 * Missing values fall back to sensible defaults so the preview always renders.
 */
export function extractDimensions(
  fields: FieldDef[],
  data: Record<string, unknown>
): Dimensions {
  const dimensionFields = fields.filter((f) => f.type === "dimension");
  const result: Partial<Dimensions> = {};
  const unmatched: typeof dimensionFields = [];

  for (const field of dimensionFields) {
    const raw = data[field.key];
    if (raw === undefined || raw === null || raw === "") continue;
    const value = toMeters(Number(raw), field.unit);
    if (Number.isNaN(value) || value <= 0) continue;

    if (result.width === undefined && matchLabel(field.label, ["largh", "width"])) {
      result.width = value;
    } else if (
      result.depth === undefined &&
      matchLabel(field.label, ["profond", "lunghezza", "depth"])
    ) {
      result.depth = value;
    } else if (result.height === undefined && matchLabel(field.label, ["altezz", "height"])) {
      result.height = value;
    } else {
      unmatched.push(field);
    }
  }

  for (const field of unmatched) {
    const value = toMeters(Number(data[field.key]), field.unit);
    if (Number.isNaN(value) || value <= 0) continue;
    if (result.width === undefined) result.width = value;
    else if (result.depth === undefined) result.depth = value;
    else if (result.height === undefined) result.height = value;
  }

  return {
    width: result.width ?? DEFAULTS.width,
    depth: result.depth ?? DEFAULTS.depth,
    height: result.height ?? DEFAULTS.height,
  };
}

export function hasAnyDimension(fields: FieldDef[]) {
  return fields.some((f) => f.type === "dimension");
}
