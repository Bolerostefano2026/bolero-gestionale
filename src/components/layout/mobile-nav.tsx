"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-ink2 hover:bg-sunken md:hidden"
        aria-label="Apri menu"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-surface p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-lg font-extrabold uppercase tracking-widest text-copper">
                Bolero
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink2 hover:bg-sunken"
                aria-label="Chiudi menu"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
