"use client";

import { useSession } from "next-auth/react";

export function usePermissions() {
  const { data: session } = useSession();
  const permissions = (session?.user?.permissions ?? []) as string[];
  const roleName = session?.user?.roleName ?? "";

  function can(permission: string): boolean {
    return permissions.includes(permission);
  }

  function canAny(...perms: string[]): boolean {
    return perms.some((p) => permissions.includes(p));
  }

  const isTitolare = roleName === "titolare";

  return { can, canAny, permissions, roleName, isTitolare };
}
