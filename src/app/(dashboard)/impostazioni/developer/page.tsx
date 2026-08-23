import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Code2, Plus, CheckCircle2, XCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDeveloper } from "@/lib/developer";
import { createFeatureFlag } from "./actions";
import { FlagToggle, DeleteFlagButton } from "./flag-toggle";

export default async function DeveloperPage() {
  const session = await auth();
  if (!isDeveloper(session?.user.email)) notFound();

  const flags = await prisma.featureFlag.findMany({ orderBy: { key: "asc" } });

  return (
    <div className="max-w-2xl">
      <Link
        href="/impostazioni"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-copper"
      >
        <ArrowLeft size={15} />
        Impostazioni
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-copper text-white">
          <Code2 size={18} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Developer</h1>
          <p className="text-xs text-ink3">Accesso riservato — Daniele Tarantino</p>
        </div>
      </div>

      {/* Info accesso */}
      <div className="mb-6 rounded-xl border border-copper/30 bg-copper-bg px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-copper mb-1">Pannello sviluppatore</p>
        <p className="text-sm text-ink2">
          Questa sezione è protetta a livello di codice sorgente e accessibile solo all&apos;account <strong className="text-ink">danieletarantino01@gmail.com</strong>.
          Nessun altro utente — indipendentemente dal ruolo — può visualizzarla.
        </p>
      </div>

      {/* Feature Flags */}
      <div className="rounded-xl border border-fog bg-surface overflow-hidden">
        <div className="border-b border-fog bg-sunken px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Feature Flags</p>
            <p className="text-xs text-ink3">Attiva o disattiva funzionalità del gestionale</p>
          </div>
        </div>

        {flags.length === 0 ? (
          <div className="px-5 py-10 text-center text-ink3 text-sm">
            Nessun flag configurato.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fog text-left text-[10px] uppercase tracking-wide text-ink3">
                <th className="px-5 py-2.5 font-semibold">Chiave</th>
                <th className="px-5 py-2.5 font-semibold">Nome</th>
                <th className="px-5 py-2.5 font-semibold hidden sm:table-cell">Descrizione</th>
                <th className="px-5 py-2.5 font-semibold text-center">Stato</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => (
                <tr key={f.key} className="border-b border-fog last:border-0 hover:bg-sunken/60">
                  <td className="px-5 py-3 font-mono text-xs text-copper">{f.key}</td>
                  <td className="px-5 py-3 font-medium text-ink">{f.label}</td>
                  <td className="px-5 py-3 text-ink3 hidden sm:table-cell text-xs">
                    {f.description ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {f.enabled
                        ? <CheckCircle2 size={13} className="text-success" />
                        : <XCircle size={13} className="text-ink3" />
                      }
                      <FlagToggle flagKey={f.key} enabled={f.enabled} />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <DeleteFlagButton flagKey={f.key} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form nuovo flag */}
      <div className="mt-6 rounded-xl border border-fog bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink flex items-center gap-1.5">
          <Plus size={14} className="text-copper" />
          Aggiungi feature flag
        </h2>
        <form action={createFeatureFlag} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-ink3">Chiave (snake_case)</label>
              <input
                name="key"
                required
                placeholder="es. nuova_sezione"
                className="w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm font-mono outline-none focus:border-copper focus:ring-1 focus:ring-copper"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-ink3">Nome leggibile</label>
              <input
                name="label"
                required
                placeholder="es. Nuova sezione report"
                className="w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-ink3">Descrizione (opzionale)</label>
            <input
              name="description"
              placeholder="A cosa serve questo flag…"
              className="w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white transition hover:bg-copper-lt"
          >
            Crea flag
          </button>
        </form>
      </div>

      {/* Info tecnica */}
      <div className="mt-6 rounded-xl border border-fog bg-sunken px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-ink3 mb-2">Come usare i feature flags nel codice</p>
        <pre className="text-xs text-ink2 whitespace-pre-wrap font-mono leading-relaxed">{`import { prisma } from "@/lib/prisma";

// Nel server component o action:
const flag = await prisma.featureFlag.findUnique({
  where: { key: "nome_flag" },
});
if (flag?.enabled) {
  // funzionalità attiva
}`}</pre>
      </div>
    </div>
  );
}
