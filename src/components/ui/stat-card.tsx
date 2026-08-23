import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const TONE_BAR: Record<string, string> = {
  neutral: "var(--fog)",
  copper:  "var(--copper)",
  success: "var(--success)",
  warn:    "var(--warn)",
};
const TONE_ICON: Record<string, string> = {
  neutral: "var(--ink3)",
  copper:  "var(--copper)",
  success: "var(--success)",
  warn:    "var(--warn)",
};
const TONE_NUM: Record<string, string> = {
  neutral: "var(--ink)",
  copper:  "var(--copper)",
  success: "var(--success)",
  warn:    "var(--warn)",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "neutral" | "copper" | "success" | "warn";
  href?: string;
}) {
  const card = (
    <div
      className="relative overflow-hidden rounded-2xl bg-surface border border-fog h-full transition-all duration-150 group-hover:shadow-xl group-hover:-translate-y-[3px]"
      style={{ boxShadow: "var(--shadow-sm)", minHeight: "110px" }}
    >
      {/* Barra colorata in alto */}
      <div
        className="absolute left-0 top-0 h-[3px] w-full"
        style={{ background: TONE_BAR[tone] }}
      />

      {/* Layout orizzontale: sinistra label+icona, destra numero */}
      <div className="flex h-full items-center justify-between px-6 py-5">
        {/* Sinistra */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Icon size={16} strokeWidth={1.5} style={{ color: TONE_ICON[tone] }} />
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink3">{label}</p>
          </div>
          {href && (
            <p
              className="text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--copper-lt)" }}
            >
              Apri →
            </p>
          )}
        </div>

        {/* Destra — numero grande */}
        <p
          className="font-display tabular-nums leading-none"
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 300,
            fontStyle: "italic",
            color: TONE_NUM[tone],
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );

  if (href) return <Link href={href} className="group block h-full">{card}</Link>;
  return card;
}
