import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import { CommandPalette } from "@/components/layout/command-palette";

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
      {/* Sidebar desktop */}
      <aside className="hidden w-56 shrink-0 border-r border-fog bg-surface md:flex md:flex-col">
        {/* Brand lockup */}
        <div className="px-6 pt-7 pb-5">
          <span
            className="font-display block text-[22px] leading-none text-ink"
            style={{ fontStyle: "italic", fontWeight: 300, letterSpacing: "-0.01em" }}
          >
            Bolero
          </span>
          <span
            className="mt-1.5 block text-[9px] font-semibold tracking-[0.22em] uppercase text-copper"
          >
            Gestionale
          </span>
        </div>

        <div className="mx-4 mb-4 border-t border-fog" />

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <SidebarNav />
        </div>

        {/* Sidebar footer */}
        <div className="border-t border-fog px-5 py-3">
          <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-ink3">
            Ticino · CH
          </p>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-fog bg-surface px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <MobileNav />
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
