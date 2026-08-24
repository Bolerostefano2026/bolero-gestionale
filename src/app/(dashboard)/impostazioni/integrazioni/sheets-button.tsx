"use client";

import { useState } from "react";
import { RefreshCw, Check, AlertCircle } from "lucide-react";

export function SheetsButton() {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function sync() {
    setState("loading");
    try {
      const res = await fetch("/api/integrazioni/sheets-sync", { method: "POST" });
      const data = await res.json() as { ok?: boolean; righe?: number; error?: string };
      if (res.ok && data.ok) {
        setMsg(`${data.righe ?? 0} righe esportate`);
        setState("ok");
      } else {
        setMsg(data.error ?? "Errore");
        setState("error");
      }
    } catch {
      setMsg("Errore di rete");
      setState("error");
    }
    setTimeout(() => setState("idle"), 5000);
  }

  return (
    <div className="flex items-center gap-1.5">
      {state === "ok" && (
        <span className="flex items-center gap-1 text-xs text-success">
          <Check size={12} />
          {msg}
        </span>
      )}
      {state === "error" && (
        <span className="flex items-center gap-1 text-xs text-danger" title={msg}>
          <AlertCircle size={12} />
          Errore
        </span>
      )}
      <button
        type="button"
        onClick={sync}
        disabled={state === "loading"}
        className="flex items-center gap-1 rounded-md border border-fog px-2.5 py-1 text-xs font-medium text-ink2 hover:border-copper hover:text-copper disabled:opacity-50"
      >
        <RefreshCw size={11} className={state === "loading" ? "animate-spin" : ""} />
        Sincronizza ora
      </button>
    </div>
  );
}
