"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteClient } from "../actions";

export function DeleteClientButton({ clientId }: { clientId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-ink2">Eliminare definitivamente?</span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await deleteClient(clientId);
              router.push("/clienti");
            })
          }
          className="rounded-md bg-danger px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Eliminazione…" : "Conferma"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-ink2 hover:bg-sunken"
        >
          Annulla
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-danger hover:bg-danger-bg"
    >
      <Trash2 size={15} />
      Elimina
    </button>
  );
}
