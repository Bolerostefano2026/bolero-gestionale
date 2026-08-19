export const CLIENT_STATUS: Record<
  string,
  { label: string; tone: "neutral" | "copper" | "success" | "warn" | "danger" }
> = {
  LEAD: { label: "Lead", tone: "neutral" },
  ATTIVO: { label: "Attivo", tone: "copper" },
  IN_LAVORAZIONE: { label: "In lavorazione", tone: "warn" },
  CHIUSO: { label: "Chiuso", tone: "success" },
  INATTIVO: { label: "Inattivo", tone: "neutral" },
};

export const APPOINTMENT_TYPE: Record<string, string> = {
  APPUNTAMENTO: "Appuntamento",
  SOPRALLUOGO: "Sopralluogo",
  MONTAGGIO: "Montaggio",
  ALTRO: "Altro",
};

export const APPOINTMENT_STATUS: Record<
  string,
  { label: string; tone: "neutral" | "copper" | "success" | "warn" | "danger" }
> = {
  PROGRAMMATO: { label: "Programmato", tone: "neutral" },
  CONFERMATO: { label: "Confermato", tone: "copper" },
  COMPLETATO: { label: "Completato", tone: "success" },
  ANNULLATO: { label: "Annullato", tone: "danger" },
};

export const QUOTE_STATUS: Record<
  string,
  { label: string; tone: "neutral" | "copper" | "success" | "warn" | "danger" }
> = {
  BOZZA: { label: "Bozza", tone: "neutral" },
  INVIATO: { label: "Inviato", tone: "copper" },
  IN_ATTESA: { label: "In attesa", tone: "warn" },
  APPROVATO: { label: "Approvato", tone: "success" },
  RIFIUTATO: { label: "Rifiutato", tone: "danger" },
  CONVERTITO: { label: "Convertito in lavoro", tone: "success" },
  COMPLETATO: { label: "Completato", tone: "success" },
};

export const WORKFLOW_STAGES: { value: string; label: string }[] = [
  { value: "CONTATTO", label: "Contatto" },
  { value: "APPUNTAMENTO", label: "Appuntamento" },
  { value: "SOPRALLUOGO", label: "Sopralluogo" },
  { value: "MISURE", label: "Misure" },
  { value: "PROGETTAZIONE", label: "Progettazione" },
  { value: "PREVENTIVO", label: "Preventivo" },
  { value: "PREVENTIVO_INVIATO", label: "Preventivo inviato" },
  { value: "APPROVAZIONE", label: "Approvazione" },
  { value: "ORDINE", label: "Ordine" },
  { value: "PRODUZIONE", label: "Produzione" },
  { value: "PROGRAMMAZIONE_MONTAGGIO", label: "Programmazione montaggio" },
  { value: "MONTAGGIO", label: "Montaggio" },
  { value: "FATTURAZIONE", label: "Fatturazione" },
  { value: "PAGAMENTO", label: "Pagamento" },
  { value: "CHIUSO", label: "Chiuso" },
];

export const WORKFLOW_STAGE_LABEL: Record<string, string> = Object.fromEntries(
  WORKFLOW_STAGES.map((s) => [s.value, s.label])
);

export const INVOICE_STATUS: Record<
  string,
  { label: string; tone: "neutral" | "copper" | "success" | "warn" | "danger" }
> = {
  BOZZA: { label: "Bozza", tone: "neutral" },
  INVIATA: { label: "Inviata", tone: "copper" },
  PAGATA: { label: "Pagata", tone: "success" },
  SCADUTA: { label: "Scaduta", tone: "danger" },
  ANNULLATA: { label: "Annullata", tone: "neutral" },
};

export const EMAIL_DRAFT_STATUS: Record<
  string,
  { label: string; tone: "neutral" | "copper" | "success" | "warn" | "danger" }
> = {
  IN_ATTESA_APPROVAZIONE: { label: "In attesa di approvazione", tone: "warn" },
  APPROVATA: { label: "Approvata", tone: "copper" },
  INVIATA: { label: "Inviata", tone: "success" },
  RIFIUTATA: { label: "Rifiutata", tone: "danger" },
};
