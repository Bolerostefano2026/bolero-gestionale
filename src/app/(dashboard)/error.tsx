"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Sessione scaduta → redirect a login
    if (
      error.message?.toLowerCase().includes("unauthorized") ||
      error.message?.toLowerCase().includes("non autorizzato") ||
      error.message?.toLowerCase().includes("unauthenticated")
    ) {
      router.push("/login");
    }
    console.error("[Dashboard Error]", error);
  }, [error, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
        <AlertTriangle size={26} className="text-danger" />
      </div>
      <h1 className="font-display text-xl font-bold text-ink">Qualcosa è andato storto</h1>
      <p className="mt-2 max-w-sm text-sm text-ink2">
        Si è verificato un errore. Riprova oppure torna alla dashboard.
      </p>
      {error.digest && (
        <p className="mt-1.5 font-mono text-[11px] text-ink3">Ref: {error.digest}</p>
      )}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt"
        >
          <RefreshCw size={14} />
          Riprova
        </button>
        <a
          href="/"
          className="rounded-md border border-fog px-4 py-2 text-sm font-semibold text-ink2 transition hover:bg-sunken"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
}
