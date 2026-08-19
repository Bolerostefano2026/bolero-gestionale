import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/layout/notification-bell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-60 shrink-0 border-r border-fog bg-surface md:flex md:flex-col">
        <div className="px-5 py-6">
          <span className="font-display text-xl font-extrabold uppercase tracking-widest text-copper">
            Bolero
          </span>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-ink3">
            Gestionale
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <SidebarNav />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-fog bg-surface px-4 md:px-6">
          <div className="flex items-center gap-2">
            <MobileNav />
            <span className="font-display text-base font-extrabold uppercase tracking-widest text-copper md:hidden">
              Bolero
            </span>
          </div>
          {user && (
            <div className="flex items-center gap-1">
              <NotificationBell />
              <UserMenu name={user.name ?? ""} roleLabel={user.roleLabel} />
            </div>
          )}
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
