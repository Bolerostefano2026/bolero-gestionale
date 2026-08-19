"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { markInvoiceSent } from "../actions";

export function MarkSentButton({ invoiceId }: { invoiceId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markInvoiceSent(invoiceId);
          router.refresh();
        })
      }
      className="flex items-center gap-1.5 rounded-md border border-fog px-3.5 py-2 text-sm font-medium text-ink2 hover:bg-sunken disabled:opacity-60"
    >
      <Send size={15} />
      {pending ? "Invio…" : "Segna come inviata"}
    </button>
  );
}
