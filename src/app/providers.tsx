"use client";

import { SessionProvider } from "next-auth/react";
import { NavProgress } from "@/components/layout/nav-progress";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NavProgress />
      {children}
    </SessionProvider>
  );
}
