"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { advanceStage } from "../actions";

export function AdvanceButton({
  projectId,
  nextStageLabel,
}: {
  projectId: string;
  nextStageLabel: string;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleAdvance() {
    setError(null);
    startTransition(async () => {
      try {
        await advanceStage(projectId, note || undefined);
        setNote("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore imprevisto");
      }
    });
  }

  return (
    <div className="rounded-lg border border-fog bg-surface p-4">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink2">
        Nota di transizione (opzionale)
      </label>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="es. Cliente ha confermato telefonicamente"
        className="mb-3 w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper"
      />
      <button
        type="button"
        onClick={handleAdvance}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt disabled:opacity-60"
      >
        {pending ? "Avanzamento…" : `Avanza a "${nextStageLabel}"`}
        <ArrowRight size={15} />
      </button>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
