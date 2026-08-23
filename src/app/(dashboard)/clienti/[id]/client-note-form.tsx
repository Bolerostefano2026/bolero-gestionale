"use client";

import { useRef, useTransition } from "react";
import { MessageSquarePlus } from "lucide-react";
import { addClientNote } from "../actions";

export function ClientNoteForm({ clientId }: { clientId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const note = (form.elements.namedItem("note") as HTMLTextAreaElement).value;
    start(async () => {
      await addClientNote(clientId, note);
      ref.current?.reset();
    });
  }

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-2">
      <textarea
        name="note"
        required
        rows={2}
        placeholder="Aggiungi una nota interna…"
        className="w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none resize-none focus:border-copper focus:ring-1 focus:ring-copper"
      />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 rounded-md bg-copper px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-copper-lt disabled:opacity-60"
      >
        <MessageSquarePlus size={14} />
        {pending ? "Salvataggio…" : "Aggiungi nota"}
      </button>
    </form>
  );
}
