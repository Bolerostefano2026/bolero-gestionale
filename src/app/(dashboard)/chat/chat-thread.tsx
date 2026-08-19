"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

type Message = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string };
};

export function ChatThread({
  clientId,
  currentUserId,
}: {
  clientId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function fetchMessages() {
    const res = await fetch(`/api/chat/${clientId}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
    }
  }

  useEffect(() => {
    // Polling an internal chat endpoint is intentional here — there's no
    // external subscription API to hang this off, so we fetch on mount and interval.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMessages();
    const interval = setInterval(() => void fetchMessages(), 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch(`/api/chat/${clientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) await fetchMessages();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-ink3">Nessun messaggio ancora.</p>
        )}
        {messages.map((m) => {
          const mine = m.sender.id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-lg px-3.5 py-2 ${
                mine ? "bg-copper text-white" : "bg-sunken text-ink"
              }`}>
                {!mine && (
                  <p className="mb-0.5 text-[11px] font-semibold text-copper">
                    {m.sender.name}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-ink3"}`}>
                  {new Date(m.createdAt).toLocaleTimeString("it-IT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-fog p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Scrivi un messaggio interno…"
          className="flex-1 rounded-md border border-fog bg-canvas px-3 py-2 text-sm outline-none focus:border-copper focus:ring-1 focus:ring-copper"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-copper text-white transition hover:bg-copper-lt disabled:opacity-50"
          aria-label="Invia"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
