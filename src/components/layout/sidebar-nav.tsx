"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        if (!item.available) {
          return (
            <div
              key={item.href}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-ink3 cursor-not-allowed"
              title="In arrivo"
            >
              <span className="flex items-center gap-3">
                <Icon size={17} strokeWidth={1.75} />
                {item.label}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-ink3/70">
                Presto
              </span>
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-copper-bg text-copper"
                : "text-ink2 hover:bg-sunken hover:text-ink"
            )}
          >
            <Icon size={17} strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
