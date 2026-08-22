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

  // Group items
  const ungrouped = visibleItems.filter((i) => !i.group);
  const groups: Record<string, typeof visibleItems> = {};
  for (const item of visibleItems) {
    if (item.group) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    }
  }

  const renderItem = (item: (typeof visibleItems)[0]) => {
    const isActive =
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    const Icon = item.icon;

    if (!item.available) {
      return (
        <div
          key={item.href}
          className="flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] opacity-35 cursor-not-allowed"
          style={{ color: "var(--sidebar-ink2)" }}
        >
          <Icon size={15} strokeWidth={1.5} />
          <span>{item.label}</span>
          <span
            className="ml-auto text-[9px] font-semibold tracking-widest uppercase"
            style={{ color: "var(--sidebar-ink3)" }}
          >
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
          "flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-all",
        )}
        style={
          isActive
            ? {
                background: "var(--sidebar-active)",
                color: "var(--sidebar-ink)",
                boxShadow: "0 0 0 1px rgba(59,130,246,0.2) inset",
              }
            : { color: "var(--sidebar-ink2)" }
        }
        onMouseEnter={(e) => {
          if (!isActive)
            (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover)";
        }}
        onMouseLeave={(e) => {
          if (!isActive) (e.currentTarget as HTMLElement).style.background = "";
        }}
      >
        <Icon
          size={15}
          strokeWidth={isActive ? 2 : 1.5}
          style={{ color: isActive ? "var(--copper-lt)" : "var(--sidebar-ink3)" }}
        />
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="flex flex-col gap-0.5">
      {ungrouped.map(renderItem)}

      {Object.entries(groups).map(([group, items]) => (
        <div key={group} className="mt-4">
          <p
            className="px-3 mb-1 text-[9px] font-semibold tracking-[0.18em] uppercase"
            style={{ color: "var(--sidebar-ink3)" }}
          >
            {group}
          </p>
          {items.map(renderItem)}
        </div>
      ))}
    </nav>
  );
}
