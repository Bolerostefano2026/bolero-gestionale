"use client";

import { useTransition } from "react";
import { toggleUserActive } from "./actions";
import { cn } from "@/lib/utils";

export function UserActiveToggle({
  userId,
  active,
  disabled,
}: {
  userId: string;
  active: boolean;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => startTransition(() => toggleUserActive(userId, !active))}
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60",
        active ? "bg-success-bg text-success" : "bg-sunken text-ink3"
      )}
    >
      {active ? "Attivo" : "Disattivo"}
    </button>
  );
}
