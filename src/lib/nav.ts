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
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, available: true },
  { label: "Clienti", href: "/clienti", icon: Users, available: true },
  { label: "Calendario", href: "/calendario", icon: Calendar, available: true },
  { label: "Preventivi", href: "/preventivi", icon: FileText, available: true },
  { label: "Misure", href: "/misure", icon: Ruler, available: true },
  { label: "Workflow", href: "/workflow", icon: GitBranch, available: true },
  { label: "Fatture", href: "/fatture", icon: Receipt, available: true },
  { label: "Chat", href: "/chat", icon: MessageSquare, available: true },
  { label: "AI", href: "/ai", icon: Sparkles, available: true },
  { label: "Impostazioni", href: "/impostazioni", icon: Settings, available: true },
];
