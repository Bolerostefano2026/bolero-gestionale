"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteMeasurement } from "../actions";

export function DeleteMeasurementButton({ measurementId }: { measurementId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-ink2">Eliminare?</span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await deleteMeasurement(measurementId);
              router.push("/misure");
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
