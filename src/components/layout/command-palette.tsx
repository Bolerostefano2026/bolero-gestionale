"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  FileText,
  GitBranch,
  Ruler,
  Receipt,
  Plus,
  Calendar,
  Loader2,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SearchResult = {
  type: "cliente" | "preventivo" | "progetto" | "misura" | "fattura";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

const TYPE_META = {
  cliente: { icon: Users, label: "Cliente" },
  preventivo: { icon: FileText, label: "Preventivo" },
  progetto: { icon: GitBranch, label: "Progetto" },
  misura: { icon: Ruler, label: "Misura" },
  fattura: { icon: Receipt, label: "Fattura" },
} as const;

const QUICK_ACTIONS: { label: string; href: string; icon: typeof Plus }[] = [
  { label: "Nuovo cliente", href: "/clienti/nuovo", icon: Users },
  { label: "Nuovo preventivo", href: "/preventivi/nuovo", icon: FileText },
  { label: "Nuova misurazione", href: "/misure/nuovo", icon: Ruler },
  { label: "Nuovo progetto", href: "/workflow/nuovo", icon: GitBranch },
  { label: "Nuova fattura", href: "/fatture/nuovo", icon: Receipt },
  { label: "Vai al calendario", href: "/calendario", icon: Calendar },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        setResults([]);
        setActiveIndex(0);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    let annullato = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok && !annullato) {
          const data = await res.json();
          setResults(data.results ?? []);
          setActiveIndex(0);
        }
      } finally {
        if (!annullato) setLoading(false);
      }
    }, 200);

    return () => {
      annullato = true;
      clearTimeout(timer);
    };
  }, [query]);

  const showingActions = query.trim().length < 2;
  const items = showingActions
    ? QUICK_ACTIONS.map((a) => ({ href: a.href, title: a.label, icon: a.icon, subtitle: undefined, badge: undefined }))
    : results.map((r) => ({
        href: r.href,
        title: r.title,
        subtitle: r.subtitle,
        icon: TYPE_META[r.type].icon,
        badge: TYPE_META[r.type].label,
      }));

  function chiudi() {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(0);
  }

  function go(href: string) {
    chiudi();
    router.push(href);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && items[activeIndex]) {
      e.preventDefault();
      go(items[activeIndex].href);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-fog bg-canvas px-3 py-1.5 text-sm text-ink3 transition hover:border-copper hover:text-ink2"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Cerca…</span>
        <kbd className="ml-2 hidden rounded border border-fog px-1.5 py-0.5 text-[10px] font-medium text-ink3 sm:inline">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
          <div className="absolute inset-0 bg-black/40" onClick={chiudi} />
          <div className="relative w-full max-w-xl overflow-hidden rounded-lg border border-fog bg-surface shadow-2xl">
            <div className="flex items-center gap-2.5 border-b border-fog px-4 py-3">
              {loading ? (
                <Loader2 size={16} className="animate-spin text-ink3" />
              ) : (
                <Search size={16} className="text-ink3" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Cerca clienti, preventivi, progetti…"
                className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink3"
              />
            </div>

            <div className="max-h-80 overflow-y-auto py-1.5">
              {showingActions && (
                <p className="px-4 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink3">
                  Azioni rapide
                </p>
              )}

              {items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={`${item.href}-${i}`}
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => go(item.href)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left",
                      i === activeIndex ? "bg-copper-bg" : "hover:bg-sunken"
                    )}
                  >
                    <Icon
                      size={16}
                      className={i === activeIndex ? "text-copper" : "text-ink3"}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{item.title}</span>
                      {item.subtitle && (
                        <span className="block truncate text-xs text-ink3">
                          {item.subtitle}
                        </span>
                      )}
                    </span>
                    {item.badge && (
                      <span className="shrink-0 rounded-full bg-sunken px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink3">
                        {item.badge}
                      </span>
                    )}
                    {i === activeIndex && (
                      <CornerDownLeft size={13} className="shrink-0 text-copper" />
                    )}
                  </button>
                );
              })}

              {!showingActions && !loading && items.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-ink3">
                  Nessun risultato per &ldquo;{query}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
