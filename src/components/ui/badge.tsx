import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<string, string> = {
  neutral: "bg-sunken text-ink2",
  copper: "bg-copper-bg text-copper",
  success: "bg-success-bg text-success",
  warn: "bg-warn-bg text-warn",
  danger: "bg-danger-bg text-danger",
};

export function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "copper" | "success" | "warn" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        TONE_CLASSES[tone]
      )}
    >
      {label}
    </span>
  );
}
