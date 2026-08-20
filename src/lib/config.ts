/**
 * Configurazione fiscale e di formattazione.
 *
 * L'azienda opera in SVIZZERA: aliquota IVA (MWST/TVA) normale 8,1% dal
 * 1° gennaio 2024, valuta CHF, formattazione con apostrofo come separatore
 * delle migliaia (es. CHF 12'345.60).
 *
 * Montaggio, tende, pergole e pergotende sono prestazioni con posa e ricadono
 * nell'aliquota normale: non si applica l'aliquota ridotta.
 */

export const VAT_RATE_DEFAULT = 8.1;
export const CURRENCY = "CHF";
export const LOCALE = "it-CH";

/** Importo formattato per l'interfaccia, es. "CHF 12'345.60". */
export function money(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return `${CURRENCY} ${formatNumber(n)}`;
}

/** Solo il numero, senza valuta, es. "12'345.60". */
export function formatNumber(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Data breve, es. "20.08.2026". */
export function formatDate(date: Date): string {
  return date.toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Data e ora, es. "20.08.2026, 14:30". */
export function formatDateTime(date: Date): string {
  return date.toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
