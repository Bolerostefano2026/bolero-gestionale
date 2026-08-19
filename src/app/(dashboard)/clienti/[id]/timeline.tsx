import type { LucideIcon } from "lucide-react";
import { UserPlus, Calendar, FileText } from "lucide-react";

export type TimelineEvent = {
  date: Date;
  icon: LucideIcon;
  label: string;
  detail?: string;
};

export function ClientTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink3">Nessuna attività registrata.</p>;
  }

  return (
    <ol className="relative space-y-5 border-l border-fog pl-6">
      {events.map((event, i) => {
        const Icon = event.icon;
        return (
          <li key={i} className="relative">
            <span className="absolute -left-[29px] flex h-6 w-6 items-center justify-center rounded-full border border-fog bg-surface text-copper">
              <Icon size={12} strokeWidth={2} />
            </span>
            <p className="text-sm font-medium text-ink">{event.label}</p>
            {event.detail && (
              <p className="mt-0.5 text-xs text-ink2">{event.detail}</p>
            )}
            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ink3">
              {event.date.toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export const TIMELINE_ICONS = { UserPlus, Calendar, FileText };
