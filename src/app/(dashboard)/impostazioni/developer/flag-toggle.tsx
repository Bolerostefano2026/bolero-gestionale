"use client";

import { useTransition } from "react";
import { toggleFeatureFlag, deleteFeatureFlag } from "./actions";
import { Trash2 } from "lucide-react";

export function FlagToggle({ flagKey, enabled }: { flagKey: string; enabled: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(() => toggleFeatureFlag(flagKey, !enabled))}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${enabled ? "bg-success" : "bg-fog"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

export function DeleteFlagButton({ flagKey }: { flagKey: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm(`Eliminare il flag "${flagKey}"?`)) {
          start(() => deleteFeatureFlag(flagKey));
        }
      }}
      className="flex h-7 w-7 items-center justify-center rounded-md text-ink3 hover:bg-danger-bg hover:text-danger disabled:opacity-40"
    >
      <Trash2 size={13} />
    </button>
  );
}
