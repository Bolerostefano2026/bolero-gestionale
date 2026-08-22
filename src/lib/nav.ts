import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Ruler,
  GitBranch,
  Receipt,
  MessageSquare,
  Sparkles,
  Settings,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  available: boolean;
  group?: string;
  requireAny?: string[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, available: true },
  {
    label: "Clienti",
    href: "/clienti",
    icon: Users,
    available: true,
    group: "Lavoro",
    requireAny: ["clients:read_all", "clients:read_assigned"],
  },
  {
    label: "Calendario",
    href: "/calendario",
    icon: Calendar,
    available: true,
    group: "Lavoro",
    requireAny: ["appointments:read_all", "appointments:read_own"],
  },
  {
    label: "Preventivi",
    href: "/preventivi",
    icon: FileText,
    available: true,
    group: "Lavoro",
    requireAny: ["quotes:read"],
  },
  {
    label: "Misure",
    href: "/misure",
    icon: Ruler,
    available: true,
    group: "Lavoro",
    requireAny: ["measurements:read", "measurements:write"],
  },
  {
    label: "Workflow",
    href: "/workflow",
    icon: GitBranch,
    available: true,
    group: "Lavoro",
    requireAny: ["workflow:read", "workflow:write"],
  },
  {
    label: "Fatture",
    href: "/fatture",
    icon: Receipt,
    available: true,
    group: "Lavoro",
    requireAny: ["invoices:read"],
  },
  {
    label: "Chat",
    href: "/chat",
    icon: MessageSquare,
    available: true,
    group: "Strumenti",
    requireAny: ["chat:read"],
  },
  {
    label: "AI",
    href: "/ai",
    icon: Sparkles,
    available: true,
    group: "Strumenti",
    requireAny: ["ai:configure", "ai:approve_actions"],
  },
  {
    label: "Impostazioni",
    href: "/impostazioni",
    icon: Settings,
    available: true,
    group: "Strumenti",
    requireAny: ["users:manage"],
  },
];
