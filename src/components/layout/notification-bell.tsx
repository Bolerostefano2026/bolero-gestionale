"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  async function fetchNotifications() {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 15000);
    return () => clearInterval(interval);
  }, []);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      await fetch("/api/notifications", { method: "PATCH" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink2 hover:bg-sunken"
        aria-label="Notifiche"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-copper" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 max-h-96 w-80 overflow-y-auto rounded-md border border-fog bg-surface py-1 shadow-lg">
            <div className="border-b border-fog px-3.5 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink3">
                Notifiche
              </p>
            </div>
            {notifications.length === 0 ? (
              <p className="px-3.5 py-6 text-center text-xs text-ink3">
                Nessuna notifica.
              </p>
            ) : (
              notifications.map((n) => {
                const content = (
                  <div className="px-3.5 py-2.5 hover:bg-sunken">
                    <p className="text-sm font-medium text-ink">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs text-ink2">{n.body}</p>}
                    <p className="mt-0.5 text-[11px] text-ink3">
                      {new Date(n.createdAt).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
