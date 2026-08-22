"use client";

import { useTransition } from "react";
import { changeUserRole } from "./actions";

interface Props {
  userId: string;
  currentRoleId: string;
  roles: { id: string; label: string }[];
  disabled?: boolean;
}

export function UserRoleSelect({ userId, currentRoleId, roles, disabled }: Props) {
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const roleId = e.target.value;
    startTransition(async () => {
      try {
        await changeUserRole(userId, roleId);
      } catch (err) {
        alert((err as Error).message);
      }
    });
  }

  return (
    <select
      defaultValue={currentRoleId}
      onChange={handleChange}
      disabled={disabled || pending}
      className="rounded-md border border-fog bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-copper disabled:cursor-not-allowed disabled:opacity-50"
    >
      {roles.map((r) => (
        <option key={r.id} value={r.id}>{r.label}</option>
      ))}
    </select>
  );
}
