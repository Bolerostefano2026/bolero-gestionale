"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { updateUser, deleteUser } from "./actions";

const inputClass =
  "w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper";

type Props = {
  userId: string;
  name: string;
  email: string;
};

export function UserActions({ userId, name, email }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleEdit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateUser(userId, formData);
        setEditOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore imprevisto");
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteUser(userId);
        setDeleteOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore imprevisto");
        setDeleteOpen(false);
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={() => { setError(null); setEditOpen(true); }}
          title="Modifica utente"
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink3 hover:bg-sunken hover:text-copper transition"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => { setError(null); setDeleteOpen(true); }}
          title="Elimina utente"
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink3 hover:bg-danger-bg hover:text-danger transition"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Modal modifica */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-fog bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-fog px-5 py-4">
              <h2 className="text-sm font-semibold text-ink">Modifica utente</h2>
              <button onClick={() => setEditOpen(false)} className="text-ink3 hover:text-ink">
                <X size={16} />
              </button>
            </div>
            <form action={handleEdit} className="space-y-3 px-5 py-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">Nome</label>
                <input name="name" defaultValue={name} required className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">Email</label>
                <input name="email" type="email" defaultValue={email} required className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
                  Nuova password <span className="normal-case font-normal text-ink3">(lascia vuoto per non cambiare)</span>
                </label>
                <input name="password" type="password" placeholder="••••••••" className={inputClass} />
              </div>
              {error && <p className="rounded-md bg-danger-bg px-3 py-2 text-xs text-danger">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setEditOpen(false)} className="rounded-md px-3 py-1.5 text-sm text-ink2 hover:text-ink">
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-md bg-copper px-4 py-1.5 text-sm font-semibold text-white hover:bg-copper-lt disabled:opacity-60"
                >
                  {pending ? "Salvataggio…" : "Salva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal conferma eliminazione */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-fog bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-fog px-5 py-4">
              <h2 className="text-sm font-semibold text-ink">Elimina utente</h2>
              <button onClick={() => setDeleteOpen(false)} className="text-ink3 hover:text-ink">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-ink2">
                Sei sicuro di voler eliminare <strong className="text-ink">{name}</strong>? Questa azione non può essere annullata.
              </p>
              {error && <p className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-xs text-danger">{error}</p>}
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setDeleteOpen(false)} className="rounded-md px-3 py-1.5 text-sm text-ink2 hover:text-ink">
                  Annulla
                </button>
                <button
                  onClick={handleDelete}
                  disabled={pending}
                  className="rounded-md bg-danger px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {pending ? "Eliminazione…" : "Elimina"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
