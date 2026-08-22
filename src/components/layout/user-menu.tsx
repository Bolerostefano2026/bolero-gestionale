"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
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
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-sunken transition-colors"
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-copper"
          style={{ background: "var(--copper-bg)" }}
        >
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-[13px] font-medium leading-tight text-ink">
            {name.split(" ")[0]}
          </span>
          <span className="block text-[10px] leading-tight text-ink3">
            {roleLabel}
          </span>
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 z-20 mt-1.5 w-48 rounded-xl border border-fog bg-surface py-1.5"
            style={{ boxShadow: "var(--shadow-md)" }}
          >
            <div className="px-3 pb-2 pt-1">
              <p className="text-[13px] font-medium text-ink">{name}</p>
              <p className="text-[11px] text-ink3">{roleLabel}</p>
            </div>
            <div className="border-t border-fog my-1" />
            <Link
              href="/impostazioni/profilo"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-ink2 hover:bg-sunken hover:text-ink transition-colors"
            >
              <User size={14} strokeWidth={1.6} />
              Profilo
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-ink2 hover:bg-sunken hover:text-ink transition-colors"
              >
                <LogOut size={14} strokeWidth={1.6} />
                Esci
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
