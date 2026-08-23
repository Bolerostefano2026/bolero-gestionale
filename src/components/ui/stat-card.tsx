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
      className="relative overflow-hidden rounded-2xl border border-fog h-full flex flex-col justify-between
                 transition-all duration-150 active:scale-[0.97] group-hover:shadow-xl group-hover:-translate-y-[2px]"
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
        minHeight: "120px",
      }}
    >
      {/* Barra colorata in alto */}
      <div
        className="absolute left-0 top-0 h-[3px] w-full"
        style={{ background: TONE_BAR[tone] }}
      />

      <div className="flex flex-col gap-3 px-5 pt-6 pb-5">
        {/* Icona + label */}
        <div className="flex items-center gap-2">
          <Icon size={18} strokeWidth={1.8} style={{ color: TONE_ICON[tone], flexShrink: 0 }} />
          <p
            className="text-sm font-bold uppercase tracking-[0.07em] leading-tight"
            style={{ color: "var(--ink3)" }}
          >
            {label}
          </p>
        </div>

        {/* Numero — grande, bold, leggibile */}
        <p
          className="tabular-nums leading-none"
          style={{
            fontSize: "clamp(2.2rem, 8vw, 3rem)",
            fontWeight: 700,
            color: TONE_NUM[tone],
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </p>
      </div>

      {/* Footer tap hint — visibile solo su hover desktop */}
      {href && (
        <div
          className="px-5 pb-3 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
          style={{ color: "var(--copper-lt)" }}
        >
          Apri →
        </div>
      )}
    </div>
  );

  if (href) return <Link href={href} className="group block h-full">{card}</Link>;
  return card;
}
