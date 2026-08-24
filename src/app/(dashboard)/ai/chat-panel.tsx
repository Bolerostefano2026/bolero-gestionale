"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Check, Pencil, Loader2 } from "lucide-react";

type PendingAction = {
  id: string;
  action: string;
  summary: string;
  status: "PENDING" | "EXECUTED" | "REJECTED";
};

type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; actions: PendingAction[] }
  | { role: "error"; content: string };

const SUGGESTIONS = [
  "Ci sono preventivi in attesa di approvazione?",
  "Trovami il cliente Mario Rossi",
  "Che stato ha il progetto di Mario Rossi?",
];

export function AiChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || pending) return;

    const updatedMessages = [...messages, { role: "user" as const, content: message }];
    setMessages(updatedMessages);
    setInput("");
    setPending(true);

    // Costruisce la history da passare all'API (solo scambi user/assistant)
    const history = updatedMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-10)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "error", content: data.error }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply, actions: data.actions ?? [] },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "error", content: "Impossibile contattare l'AI. Riprova." },
      ]);
    } finally {
      setPending(false);
    }
  }

  async function decide(actionId: string, decision: "confirm" | "reject") {
    setMessages((prev) =>
      prev.map((m) =>
        m.role === "assistant"
          ? {
              ...m,
              actions: m.actions.map((a) =>
                a.id === actionId
                  ? { ...a, status: decision === "confirm" ? "EXECUTED" : "REJECTED" }
                  : a
              ),
            }
          : m
      )
    );

    const res = await fetch(`/api/ai/actions/${actionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Errore imprevisto" }));
      setMessages((prev) => [...prev, { role: "error", content: data.error }]);
    }

    if (decision === "reject") {
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col rounded-lg border border-fog bg-surface">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles size={28} className="mb-3 text-copper" />
            <p className="mb-4 max-w-sm text-sm text-ink2">
              Scrivi in linguaggio naturale. Prima di modificare qualsiasi dato ti chiederò
              conferma.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-fog px-3 py-1.5 text-xs text-ink2 hover:border-copper hover:text-copper"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          if (m.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[75%] rounded-lg bg-copper px-3.5 py-2 text-sm text-white">
                  {m.content}
                </div>
              </div>
            );
          }
          if (m.role === "error") {
            return (
              <div key={i} className="flex justify-start">
                <div className="max-w-[75%] rounded-lg bg-danger-bg px-3.5 py-2 text-sm text-danger">
                  {m.content}
                </div>
              </div>
            );
          }
          return (
            <div key={i} className="flex justify-start">
              <div className="max-w-[85%] space-y-2">
                <div className="rounded-lg bg-sunken px-3.5 py-2 text-sm text-ink">
                  {m.content}
                </div>
                {m.actions.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-copper/40 bg-copper-bg px-3.5 py-3"
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-copper">
                      Ho capito questo
                    </p>
                    <p className="mb-3 text-sm text-ink">{a.summary}</p>
                    {a.status === "PENDING" ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => decide(a.id, "confirm")}
                          className="flex items-center gap-1.5 rounded-md bg-copper px-3 py-1.5 text-xs font-semibold text-white hover:bg-copper-lt"
                        >
                          <Check size={13} />
                          Conferma
                        </button>
                        <button
                          type="button"
                          onClick={() => decide(a.id, "reject")}
                          className="flex items-center gap-1.5 rounded-md border border-fog px-3 py-1.5 text-xs font-medium text-ink2 hover:bg-sunken"
                        >
                          <Pencil size={13} />
                          Modifica
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-ink3">
                        {a.status === "EXECUTED" ? "✓ Eseguita" : "Annullata"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {pending && (
          <div className="flex items-center gap-2 text-xs text-ink3">
            <Loader2 size={14} className="animate-spin" />
            Bolero sta pensando…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-fog p-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Scrivi a Bolero…"
          className="flex-1 rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper"
        />
        <button
          type="button"
          onClick={() => send(input)}
          disabled={pending || !input.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-copper text-white transition hover:bg-copper-lt disabled:opacity-50"
          aria-label="Invia"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
