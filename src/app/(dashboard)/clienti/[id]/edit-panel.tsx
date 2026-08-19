"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { ClientForm } from "../client-form";

type ClientData = {
  id: string;
  name: string;
  surname: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  cap: string | null;
  status: string;
  notes: string | null;
};

export function EditClientPanel({
  client,
  canWrite,
}: {
  client: ClientData;
  canWrite: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="rounded-lg border border-fog bg-surface p-6">
        <ClientForm client={client} onCancel={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-fog bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
          Anagrafica
        </h2>
        {canWrite && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-copper hover:underline"
          >
            <Pencil size={13} />
            Modifica
          </button>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink3">Telefono</dt>
          <dd className="mt-0.5 text-ink">{client.phone || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink3">Email</dt>
          <dd className="mt-0.5 text-ink">{client.email || "—"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase tracking-wide text-ink3">Indirizzo</dt>
          <dd className="mt-0.5 text-ink">
            {[client.address, client.city, client.cap].filter(Boolean).join(", ") ||
              "—"}
          </dd>
        </div>
        {client.notes && (
          <div className="col-span-2">
            <dt className="text-xs uppercase tracking-wide text-ink3">Note</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-ink">{client.notes}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
