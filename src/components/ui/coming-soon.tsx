import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  title,
  description,
  phase,
  icon: Icon,
}: {
  title: string;
  description: string;
  phase: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-copper-bg text-copper">
        <Icon size={26} strokeWidth={1.75} />
      </span>
      <h1 className="mt-5 font-display text-xl font-bold text-ink">{title}</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink2">
        {description}
      </p>
      <span className="mt-4 rounded-full bg-sunken px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink3">
        {phase}
      </span>
    </div>
  );
}
