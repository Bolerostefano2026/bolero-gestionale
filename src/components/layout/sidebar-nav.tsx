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
    <>
      <style>{`
        .nav-icon-item { position: relative; }
        .nav-icon-item .nav-tooltip {
          position: absolute;
          left: calc(100% + 10px);
          top: 50%;
          transform: translateY(-50%);
          background: var(--ink);
          color: var(--canvas);
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
          padding: 4px 9px;
          border-radius: 6px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 100ms ease;
          z-index: 100;
          letter-spacing: 0.01em;
        }
        .nav-icon-item:hover .nav-tooltip { opacity: 1; }
        .nav-icon-item .nav-tooltip::before {
          content: '';
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border: 4px solid transparent;
          border-right-color: var(--ink);
        }
      `}</style>

      {visibleItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        if (!item.available) {
          return (
            <div
              key={item.href}
              className="nav-icon-item flex items-center justify-center w-9 h-9 rounded-lg opacity-30 cursor-not-allowed"
            >
              <Icon size={16} strokeWidth={1.5} style={{ color: "var(--sidebar-ink2)" }} />
              <span className="nav-tooltip">{item.label} (presto)</span>
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title=""
            className={cn("nav-icon-item flex items-center justify-center w-9 h-9 rounded-lg transition-all")}
            style={
              isActive
                ? {
                    background: "var(--sidebar-active)",
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.07) inset",
                  }
                : {}
            }
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = "";
              }
            }}
          >
            <Icon
              size={16}
              strokeWidth={isActive ? 2 : 1.5}
              style={{ color: isActive ? "var(--sidebar-ink)" : "var(--sidebar-ink2)" }}
            />
            <span className="nav-tooltip">{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}
