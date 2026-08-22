"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const prevPath = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      // new route loaded — complete bar
      setWidth(100);
      const t = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 300);
      prevPath.current = pathname;
      return () => clearTimeout(t);
    }
  }, [pathname]);

  // Expose a way to start the bar from link clicks
  useEffect(() => {
    function onLinkClick(e: MouseEvent) {
      const a = (e.target as Element)?.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href === pathname) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      setVisible(true);
      setWidth(0);

      // ramp to 70% quickly, then slow down
      let w = 0;
      const ramp = () => {
        w = w < 50 ? w + 6 : w < 70 ? w + 1 : w;
        setWidth(Math.min(w, 70));
        if (w < 70) rafRef.current = requestAnimationFrame(ramp);
      };
      rafRef.current = requestAnimationFrame(ramp);
    }

    document.addEventListener("click", onLinkClick);
    return () => document.removeEventListener("click", onLinkClick);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[2px] transition-all"
      style={{
        width: `${width}%`,
        background: "var(--copper-lt)",
        transitionDuration: width === 100 ? "200ms" : "80ms",
        transitionTimingFunction: "ease",
        boxShadow: "0 0 8px var(--copper-lt)",
      }}
    />
  );
}
