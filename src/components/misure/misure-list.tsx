"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Camera } from "lucide-react";

type Measurement = {
  id: string;
  clientId: string;
  createdAt: Date;
  photos: unknown;
  client: { name: string; surname: string };
  product: { name: string };
  createdBy: { name: string } | null;
};

export function MisureList({ measurements }: { measurements: Measurement[] }) {
  const router = useRouter();

  if (measurements.length === 0) {
    return (
      <div className="rounded-lg border border-fog bg-surface px-4 py-12 text-center text-ink3">
        Nessuna misurazione trovata.
      </div>
    );
  }

  const photoCount = (m: Measurement) =>
    Array.isArray(m.photos) ? (m.photos as unknown[]).length : 0;

  return (
    <>
      {/* MOBILE / TABLET: card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {measurements.map((m) => (
          <div
            key={m.id}
            className="rounded-xl border border-fog bg-surface overflow-hidden"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            {/* Header card — click → misura */}
            <button
              type="button"
              onClick={() => router.push(`/misure/${m.id}`)}
              className="w-full flex items-center justify-between px-4 pt-4 pb-3 text-left active:bg-sunken"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink3 mb-1">
                  {m.product.name}
                </p>
                <p className="text-base font-bold text-ink truncate">
                  {m.client.name} {m.client.surname}
                </p>
              </div>
              <ChevronRight size={18} className="text-ink3 shrink-0 ml-2" />
            </button>

            {/* Footer card */}
            <div className="flex items-center justify-between border-t border-fog px-4 py-2.5 bg-sunken/40">
              <div className="flex items-center gap-3 text-xs text-ink3">
                <span>{m.createdAt.toLocaleDateString("it-IT")}</span>
                {photoCount(m) > 0 && (
                  <span className="flex items-center gap-1">
                    <Camera size={12} />
                    {photoCount(m)}
                  </span>
                )}
                {m.createdBy && <span>· {m.createdBy.name}</span>}
              </div>
              {/* Link cartella cliente */}
              <Link
                href={`/clienti/${m.clientId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-semibold text-copper hover:underline"
              >
                Cartella →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP: tabella */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-fog bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fog bg-sunken text-left text-[11px] uppercase tracking-wide text-ink3">
              <th className="px-4 py-2.5 font-semibold">Cliente</th>
              <th className="px-4 py-2.5 font-semibold">Prodotto</th>
              <th className="px-4 py-2.5 font-semibold">Rilevato da</th>
              <th className="px-4 py-2.5 font-semibold">Foto</th>
              <th className="px-4 py-2.5 font-semibold">Data</th>
              <th className="px-4 py-2.5 font-semibold w-8" />
            </tr>
          </thead>
          <tbody>
            {measurements.map((m) => (
              <tr
                key={m.id}
                className="border-b border-fog last:border-0 hover:bg-sunken/60 cursor-pointer"
                onClick={() => router.push(`/misure/${m.id}`)}
              >
                <td className="px-4 py-3">
                  {/* Click sul nome va alla cartella cliente — stopPropagation evita che vada anche alla misura */}
                  <Link
                    href={`/clienti/${m.clientId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-copper hover:underline"
                  >
                    {m.client.name} {m.client.surname}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink2">{m.product.name}</td>
                <td className="px-4 py-3 text-ink3">{m.createdBy?.name ?? "—"}</td>
                <td className="px-4 py-3 text-ink2">
                  {photoCount(m) > 0 ? `${photoCount(m)} foto` : "—"}
                </td>
                <td className="px-4 py-3 text-ink3">
                  {m.createdAt.toLocaleDateString("it-IT")}
                </td>
                <td className="px-4 py-3 text-ink3">
                  <ChevronRight size={16} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
