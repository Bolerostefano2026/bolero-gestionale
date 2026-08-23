import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import { CommandPalette } from "@/components/layout/command-palette";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user;

  const initials = (user.name ?? "?")
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar desktop — navy 220px */}
      <aside
        className="hidden md:flex md:flex-col md:w-[220px] shrink-0"
        style={{ background: "var(--sidebar)" }}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-baseline gap-2">
            <span
              className="font-display text-[24px] leading-none"
              style={{ fontStyle: "italic", fontWeight: 300, color: "var(--sidebar-ink)" }}
            >
              Bolero
            </span>
          </div>
          <p
            className="mt-1 text-[8px] font-semibold tracking-[0.25em] uppercase"
            style={{ color: "var(--sidebar-ink3)" }}
          >
            Gestionale · Ticino
          </p>
        </div>

        {/* Search shortcut */}
        <div className="px-3 pb-3">
          <CommandPalette compact />
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "0 12px 10px" }} />

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <SidebarNav />
        </div>

        {/* User footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="px-3 py-3 flex items-center gap-2.5">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold"
              style={{ background: "var(--sidebar-active)", color: "var(--copper-lt)" }}
            >
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-[12px] font-medium leading-tight"
                style={{ color: "var(--sidebar-ink)" }}
              >
                {(user.name ?? "").split(" ")[0]}
              </p>
              <p
                className="truncate text-[10px] leading-tight"
                style={{ color: "var(--sidebar-ink3)" }}
              >
                {user.roleLabel}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        {/* Top bar — slim, actions only */}
        <header
          className="flex h-12 shrink-0 items-center justify-between px-5 md:px-6"
          style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--fog)",
          }}
        >
          <div className="flex items-center gap-3">
            <MobileNav />
            {/* Mobile brand + search */}
            <span
              className="font-display text-xl leading-none text-ink md:hidden"
              style={{ fontStyle: "italic", fontWeight: 300 }}
            >
              Bolero
            </span>
            <div className="sm:hidden">
              <CommandPalette />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <NotificationBell />
            <UserMenu name={user.name ?? ""} roleLabel={user.roleLabel} />
          </div>
        </header>

        <main className="flex-1 overflow-auto px-4 py-5 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
