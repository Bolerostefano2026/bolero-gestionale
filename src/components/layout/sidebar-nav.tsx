"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { canAny } = usePermissions();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.requireAny) return true;
    return canAny(...item.requireAny);
  });

  return (
    <nav className="flex flex-col gap-px">
      {visibleItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        if (!item.available) {
          return (
            <div
              key={item.href}
              className="flex items-center justify-between rounded-md px-3 py-2 text-[13px] cursor-not-allowed opacity-40"
            >
              <span className="flex items-center gap-2.5 text-ink3">
                <Icon size={15} strokeWidth={1.6} />
                {item.label}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-ink3">
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
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-all",
              isActive
                ? "bg-copper-bg text-copper"
                : "text-ink2 hover:bg-sunken hover:text-ink"
            )}
          >
            <Icon
              size={15}
              strokeWidth={isActive ? 2 : 1.6}
              className={isActive ? "text-copper" : ""}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
