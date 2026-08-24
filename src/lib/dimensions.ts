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

/** Italian/common color name → hex. Returns the original string if it's already a hex color. */
function colorNameToHex(name: string): string | null {
  const n = name.toLowerCase().trim();
  if (/^#[0-9a-f]{3,6}$/i.test(n)) return n;
  const map: Record<string, string> = {
    bianco: "#F5F2EE",
    white: "#F5F2EE",
    nero: "#2A2520",
    black: "#2A2520",
    antracite: "#484440",
    grigio: "#7A7470",
    gray: "#7A7470",
    grey: "#7A7470",
    "grigio antracite": "#484440",
    argento: "#A8A4A0",
    silver: "#A8A4A0",
    beige: "#D4C4A8",
    sabbia: "#D4C4A8",
    sand: "#D4C4A8",
    crema: "#EDE3CC",
    marrone: "#7A4A28",
    brown: "#7A4A28",
    bronzo: "#8C6A3C",
    bronze: "#8C6A3C",
    rame: "#C8923C",
    copper: "#C8923C",
    azzurro: "#6B9EC8",
    blu: "#2C4A7C",
    blue: "#2C4A7C",
    verde: "#4A7A5A",
    green: "#4A7A5A",
    rosso: "#9C3A2A",
    red: "#9C3A2A",
    arancio: "#C87A3C",
    giallo: "#D4A84A",
    yellow: "#D4A84A",
  };
  return map[n] ?? null;
}

/**
 * Scans field data for any field whose label contains "color" keywords
 * and returns the best matching hex color, or null if none found.
 */
export function extractColor(
  fields: FieldDef[],
  data: Record<string, unknown>
): string | null {
  const colorFields = fields.filter((f) =>
    ["color", "colour", "tinta", "finitura", "ral"].some((kw) =>
      f.label.toLowerCase().includes(kw)
    )
  );
  for (const field of colorFields) {
    const raw = data[field.key];
    if (!raw || typeof raw !== "string") continue;
    const hex = colorNameToHex(raw);
    if (hex) return hex;
  }
  return null;
}
