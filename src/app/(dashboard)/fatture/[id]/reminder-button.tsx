"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { createReminder } from "../actions";

export function ReminderButton({ invoiceId }: { invoiceId: string }) {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (done) {
    return (
      <p className="text-sm text-ink2">
        Promemoria creato — in attesa di approvazione del titolare.
      </p>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await createReminder(invoiceId);
          setDone(true);
          router.refresh();
        })
      }
      className="flex items-center gap-1.5 rounded-md bg-warn-bg px-3.5 py-2 text-sm font-semibold text-warn transition hover:opacity-90 disabled:opacity-60"
    >
      <AlertTriangle size={15} />
      {pending ? "Creazione…" : "Crea promemoria pagamento"}
    </button>
  );
}
