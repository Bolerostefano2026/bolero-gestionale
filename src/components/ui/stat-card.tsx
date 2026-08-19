import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "neutral" | "copper" | "success" | "warn";
}) {
  const toneClasses: Record<string, string> = {
    neutral: "bg-sunken text-ink2",
    copper: "bg-copper-bg text-copper",
    success: "bg-success-bg text-success",
    warn: "bg-warn-bg text-warn",
  };

  return (
    <div className="rounded-lg border border-fog bg-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink3">
          {label}
        </span>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md",
            toneClasses[tone]
          )}
        >
          <Icon size={16} strokeWidth={2} />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums text-ink">
        {value}
      </p>
    </div>
  );
}
