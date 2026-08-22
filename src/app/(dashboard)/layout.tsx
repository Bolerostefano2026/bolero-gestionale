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

  return (
    <div className="flex min-h-screen w-full">
      {/* Icon rail sidebar — desktop only */}
      <aside
        className="hidden md:flex md:flex-col md:w-[52px] shrink-0 z-20"
        style={{
          background: "var(--sidebar)",
          borderRight: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {/* Brand monogram */}
        <div className="flex items-center justify-center h-14 shrink-0">
          <span
            className="font-display text-[20px] leading-none select-none"
            style={{ fontStyle: "italic", fontWeight: 300, color: "var(--sidebar-ink)" }}
            title="Bolero Gestionale"
          >
            B
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0 10px 6px" }} />

        {/* Nav icons */}
        <div className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1.5 overflow-y-auto">
          <SidebarNav />
        </div>

        {/* Bottom divider */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "6px 10px 0" }} />

        {/* Footer label */}
        <div className="flex items-center justify-center h-10 shrink-0">
          <span
            className="text-[7px] font-semibold tracking-[0.2em] uppercase select-none"
            style={{ color: "var(--sidebar-ink3)" }}
          >
            CH
          </span>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="flex h-13 shrink-0 items-center justify-between px-5 md:px-6"
          style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--fog)",
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <MobileNav />
            {/* Mobile brand */}
            <span
              className="font-display text-xl leading-none text-ink md:hidden"
              style={{ fontStyle: "italic", fontWeight: 300 }}
            >
              Bolero
            </span>
            <div className="hidden sm:block">
              <CommandPalette />
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-1">
              <div className="sm:hidden">
                <CommandPalette />
              </div>
              <NotificationBell />
              <UserMenu name={user.name ?? ""} roleLabel={user.roleLabel} />
            </div>
          )}
        </header>

        <main className="flex-1 overflow-auto px-5 py-7 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
