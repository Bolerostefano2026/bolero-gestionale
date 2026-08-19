"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions";

export function UserMenu({
  name,
  roleLabel,
}: {
  name: string;
  roleLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-sunken"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-copper-bg text-xs font-bold text-copper">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-ink">
            {name}
          </span>
          <span className="block text-[11px] leading-tight text-ink3">
            {roleLabel}
          </span>
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-44 rounded-md border border-fog bg-surface py-1 shadow-lg">
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink2 hover:bg-sunken"
              >
                <LogOut size={15} />
                Esci
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
