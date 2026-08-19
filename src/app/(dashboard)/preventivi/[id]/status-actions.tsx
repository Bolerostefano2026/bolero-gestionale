"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateQuoteStatus } from "../actions";

const TRANSITIONS: Record<string, { to: string; label: string; tone: string }[]> = {
  BOZZA: [{ to: "INVIATO", label: "Invia al cliente", tone: "bg-copper hover:bg-copper-lt" }],
  INVIATO: [
    { to: "IN_ATTESA", label: "Segna in attesa risposta", tone: "bg-copper hover:bg-copper-lt" },
  ],
  IN_ATTESA: [
    { to: "APPROVATO", label: "Approva", tone: "bg-success hover:opacity-90" },
    { to: "RIFIUTATO", label: "Rifiuta", tone: "bg-danger hover:opacity-90" },
  ],
  APPROVATO: [
    { to: "CONVERTITO", label: "Converti in lavoro", tone: "bg-copper hover:bg-copper-lt" },
  ],
  CONVERTITO: [
    { to: "COMPLETATO", label: "Segna completato", tone: "bg-success hover:opacity-90" },
  ],
};

export function StatusActions({
  quoteId,
  status,
  canApprove,
  canWrite,
}: {
  quoteId: string;
  status: string;
  canApprove: boolean;
  canWrite: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const options = (TRANSITIONS[status] ?? []).filter((t) =>
    t.to === "APPROVATO" ? canApprove : canWrite
  );

  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((t) => (
        <button
          key={t.to}
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await updateQuoteStatus(quoteId, t.to);
              router.refresh();
            })
          }
          className={`rounded-md px-3.5 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${t.tone}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
