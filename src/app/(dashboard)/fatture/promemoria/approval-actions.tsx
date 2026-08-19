"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { approveReminder, rejectReminder } from "../actions";

export function ApprovalActions({ draftId }: { draftId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await approveReminder(draftId);
            router.refresh();
          })
        }
        className="flex items-center gap-1.5 rounded-md bg-success px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        <Check size={15} />
        Approva e invia
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
  );
}
