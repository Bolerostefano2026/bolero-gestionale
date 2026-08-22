import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="text-center">
        <p className="font-display text-7xl font-extrabold text-copper opacity-30">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Pagina non trovata</h1>
        <p className="mt-2 text-sm text-ink2">
          La risorsa che cerchi non esiste o è stata spostata.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-copper px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-copper-lt"
        >
          Torna alla dashboard
        </Link>
      </div>
    </div>
  );
}
