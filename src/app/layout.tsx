import type { Metadata } from "next";
import type React from "react";
import { DM_Sans } from "next/font/google";
import { Fraunces } from "next/font/google";
import { Providers } from "./providers";
import { NavProgress } from "@/components/layout/nav-progress";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
});

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "BOLERO — Gestionale",
  description: "Sistema operativo digitale per montaggio, tende e pergole.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="it"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <NavProgress />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
