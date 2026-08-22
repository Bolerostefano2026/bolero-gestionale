"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="text-center">
        <p className="font-display text-7xl font-extrabold text-danger opacity-20">!</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Qualcosa è andato storto</h1>
        <p className="mt-2 text-sm text-ink2">
          Si è verificato un errore imprevisto. Prova di nuovo o contatta il supporto.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs font-mono text-ink3">Ref: {error.digest}</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-copper px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-copper-lt"
          >
            Riprova
          </button>
          <Link
            href="/"
            className="rounded-md border border-fog px-5 py-2.5 text-sm font-semibold text-ink2 transition hover:bg-sunken"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
