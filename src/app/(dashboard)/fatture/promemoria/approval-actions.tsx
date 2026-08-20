"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, AlertTriangle } from "lucide-react";
import { approveReminder, rejectReminder } from "../actions";

export function ApprovalActions({ draftId }: { draftId: string }) {
  const [pending, startTransition] = useTransition();
  const [avviso, setAvviso] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setAvviso(null);
              const esito = await approveReminder(draftId);
              if (!esito.inviata) setAvviso(esito.motivo ?? "Invio non riuscito.");
              router.refresh();
            })
          }
          className="flex items-center gap-1.5 rounded-md bg-success px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          <Check size={15} />
          {pending ? "Invio in corso…" : "Approva e invia"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await rejectReminder(draftId);
              router.refresh();
            })
          }
          className="flex items-center gap-1.5 rounded-md border border-fog px-3.5 py-2 text-sm font-medium text-ink2 hover:bg-sunken disabled:opacity-60"
        >
          <X size={15} />
          Rifiuta
        </button>
      </div>

      {avviso && (
        <div className="mt-3 flex items-start gap-2 rounded-md bg-warn-bg px-3 py-2 text-xs text-warn">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            <strong>Approvato, ma l&apos;email non è partita.</strong> {avviso} Il testo
            resta qui sotto: puoi copiarlo e inviarlo manualmente.
          </span>
        </div>
      )}
    </div>
  );
}
