"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CLIENT_STATUS } from "@/lib/labels";
import type { ClientStatus } from "@prisma/client";

type Client = {
  id: string;
  name: string;
  surname: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  status: ClientStatus;
  createdAt: Date;
};

export function ClientiList({ clients }: { clients: Client[] }) {
  const router = useRouter();

  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-fog bg-surface px-4 py-12 text-center text-ink3">
        Nessun cliente trovato.
      </div>
    );
  }

  return (
    <>
      {/* MOBILE: card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {clients.map((c) => {
          const statusInfo = CLIENT_STATUS[c.status];
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => router.push(`/clienti/${c.id}`)}
              className="w-full text-left rounded-xl border border-fog bg-surface overflow-hidden active:bg-sunken"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-ink truncate">
                    {c.name} {c.surname}
                  </p>
                  <p className="text-xs text-ink3 mt-0.5 truncate">
                    {c.phone || c.email || c.city || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <Badge label={statusInfo.label} tone={statusInfo.tone} />
                  <ChevronRight size={16} className="text-ink3" />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-fog px-4 py-2 bg-sunken/40">
                <span className="text-xs text-ink3">
                  {c.city || "—"}
                </span>
                <span className="text-xs text-ink3">
                  {c.createdAt.toLocaleDateString("it-IT")}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* DESKTOP: tabella */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-fog bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fog bg-sunken text-left text-[11px] uppercase tracking-wide text-ink3">
              <th className="px-4 py-2.5 font-semibold">Nome</th>
              <th className="px-4 py-2.5 font-semibold">Contatti</th>
              <th className="px-4 py-2.5 font-semibold">Città</th>
              <th className="px-4 py-2.5 font-semibold">Stato</th>
              <th className="px-4 py-2.5 font-semibold">Creato</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const statusInfo = CLIENT_STATUS[c.status];
              return (
                <tr
                  key={c.id}
                  className="border-b border-fog last:border-0 hover:bg-sunken/60"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/clienti/${c.id}`}
                      className="font-medium text-ink hover:text-copper"
                    >
                      {c.name} {c.surname}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-ink2">
                    {c.phone || c.email || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-ink2">{c.city || "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge label={statusInfo.label} tone={statusInfo.tone} />
                  </td>
                  <td className="px-4 py-2.5 text-ink3">
                    {c.createdAt.toLocaleDateString("it-IT")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
