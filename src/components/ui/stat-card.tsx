"use client";

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
  const inner = (
    <div className="stat-card-inner relative overflow-hidden rounded-xl bg-surface px-5 py-4 h-full">
      <style>{`
        .stat-card-link { display: block; text-decoration: none; }
        .stat-card-link .stat-card-inner {
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--fog);
          transition: box-shadow 150ms ease, transform 150ms ease;
        }
        .stat-card-link:hover .stat-card-inner {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .stat-card-plain .stat-card-inner {
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--fog);
        }
        .stat-card-arrow { display: none; }
        .stat-card-link:hover .stat-card-arrow { display: block; }
      `}</style>
      <div
        className="absolute left-0 top-0 h-[3px] w-full"
        style={{ background: TONE_BAR[tone], opacity: 0.9 }}
      />
      <div className="mt-1.5 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink3">
            {label}
          </p>
          <p
            className="mt-2 font-display text-[32px] tabular-nums leading-none text-ink"
            style={{ fontWeight: 300, fontStyle: "italic" }}
          >
            {value}
          </p>
        </div>
        <Icon size={17} strokeWidth={1.5} style={{ color: TONE_ICON[tone], marginTop: 2 }} />
      </div>
      {href && (
        <p className="stat-card-arrow mt-3 text-[11px] font-medium" style={{ color: "var(--copper-lt)" }}>
          Apri →
        </p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="stat-card-link">{inner}</Link>;
  }

  return <div className="stat-card-plain">{inner}</div>;
}
