import Link from "next/link";
import { Sparkles, ArrowRight, CircleDot } from "lucide-react";
import { generateBriefing } from "@/lib/ai/briefing";
import { cn } from "@/lib/utils";

const URGENCY_STYLES: Record<string, { dot: string; label: string }> = {
  alta: { dot: "text-danger", label: "Urgente" },
  media: { dot: "text-warn", label: "Da seguire" },
  bassa: { dot: "text-ink3", label: "Quando puoi" },
};

/**
 * Briefing operativo mostrato in cima alla dashboard. È un Server Component
 * asincrono: viene renderizzato in streaming, così il resto della dashboard
 * appare subito anche se l'AI impiega qualche secondo.
 */
export async function AiBriefing() {
  const briefing = await generateBriefing();

  return (
    <section className="rounded-lg border border-copper/30 bg-copper-bg/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={15} className="text-copper" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-copper">
          Il punto di oggi
        </h2>
        {!briefing.generatoDaAi && (
          <span className="rounded-full bg-sunken px-2 py-0.5 text-[10px] font-medium text-ink3">
            senza AI
          </span>
        )}
      </div>

      <p className="mb-4 text-[15px] font-medium leading-snug text-ink">
        {briefing.saluto}
      </p>

      {briefing.priorita.length > 0 && (
        <ul className="space-y-1.5">
          {briefing.priorita.map((p, i) => {
            const style = URGENCY_STYLES[p.urgenza] ?? URGENCY_STYLES.bassa;
            const content = (
              <>
                <CircleDot size={11} className={cn("mt-1 shrink-0", style.dot)} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{p.titolo}</span>
                  <span className="block text-xs text-ink2">{p.motivo}</span>
                </span>
                {p.link && (
                  <ArrowRight
                    size={14}
                    className="mt-0.5 shrink-0 text-ink3 transition group-hover:text-copper"
                  />
                )}
              </>
            );

            return (
              <li key={i}>
                {p.link ? (
                  <Link
                    href={p.link}
                    className="group flex items-start gap-2.5 rounded-md px-2 py-1.5 transition hover:bg-surface"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex items-start gap-2.5 px-2 py-1.5">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function AiBriefingSkeleton() {
  return (
    <section className="rounded-lg border border-copper/30 bg-copper-bg/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={15} className="animate-pulse text-copper" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-copper">
          Il punto di oggi
        </h2>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-sunken" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-sunken" />
      </div>
    </section>
  );
}
