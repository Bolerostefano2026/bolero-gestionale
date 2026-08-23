/**
 * Accesso sviluppatore — riservato esclusivamente all'account di Daniele Tarantino.
 * Nessun altro ruolo, permesso o flag può sbloccare questa sezione.
 */
const DEVELOPER_EMAIL = "danieletarantino01@gmail.com";

export function isDeveloper(email: string | null | undefined): boolean {
  return email?.toLowerCase() === DEVELOPER_EMAIL.toLowerCase();
}
