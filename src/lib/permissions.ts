// Registro dei permessi. Formato: "entita:azione".
// I permessi effettivi di un ruolo sono salvati come JSON in Role.permissions,
// non hard-coded: questo elenco serve solo da riferimento/tipo.

export const PERMISSIONS = {
  clients: ["read_all", "read_assigned", "write", "delete"],
  appointments: ["read_all", "read_own", "write"],
  quotes: ["read", "write", "approve", "delete"],
  measurements: ["read", "write"],
  products: ["manage"],
  workflow: ["read", "write"],
  invoices: ["read", "write", "approve_reminder"],
  payments: ["read", "write"],
  chat: ["read", "write"],
  users: ["manage"],
  ai: ["configure", "approve_actions"],
  audit: ["read"],
  stats: ["read_all", "read_partial"],
} as const;

export type PermissionEntity = keyof typeof PERMISSIONS;
export type Permission = `${PermissionEntity}:${string}`;

export const ROLE_PRESETS: Record<
  "titolare" | "ufficio" | "collaboratore",
  { label: string; permissions: Permission[] }
> = {
  titolare: {
    label: "Titolare",
    permissions: [
      "clients:read_all",
      "clients:write",
      "clients:delete",
      "appointments:read_all",
      "appointments:write",
      "quotes:read",
      "quotes:write",
      "quotes:approve",
      "quotes:delete",
      "measurements:read",
      "measurements:write",
      "products:manage",
      "workflow:read",
      "workflow:write",
      "invoices:read",
      "invoices:write",
      "invoices:approve_reminder",
      "payments:read",
      "payments:write",
      "chat:read",
      "chat:write",
      "users:manage",
      "ai:configure",
      "ai:approve_actions",
      "audit:read",
      "stats:read_all",
    ],
  },
  ufficio: {
    label: "Ufficio",
    permissions: [
      "clients:read_all",
      "clients:write",
      "appointments:read_all",
      "appointments:write",
      "quotes:read",
      "quotes:write",
      "measurements:read",
      "workflow:read",
      "workflow:write",
      "invoices:read",
      "invoices:write",
      "payments:read",
      "payments:write",
      "chat:read",
      "chat:write",
      "stats:read_partial",
    ],
  },
  collaboratore: {
    label: "Collaboratore",
    permissions: [
      "clients:read_assigned",
      "appointments:read_own",
      "appointments:write",
      "quotes:read",
      "measurements:read",
      "measurements:write",
      "workflow:read",
      "workflow:write",
      "chat:read",
      "chat:write",
    ],
  },
};

export function hasPermission(
  userPermissions: string[] | undefined | null,
  required: Permission
): boolean {
  if (!userPermissions) return false;
  return userPermissions.includes(required);
}

export function requirePermission(
  userPermissions: string[] | undefined | null,
  required: Permission
): void {
  if (!hasPermission(userPermissions, required)) {
    throw new Error(`Permesso negato: ${required}`);
  }
}
