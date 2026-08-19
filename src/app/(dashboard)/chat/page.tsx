import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatThread } from "./chat-thread";
import { cn } from "@/lib/utils";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;

  const clients = await prisma.client.findMany({
    include: {
      messages: {
        where: { type: "INTERNAL" },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { messages: true },
      },
    },
  });

  const clientsWithLastMessage = clients.map((c) => {
    const unread = c.messages.filter(
      (m) => m.senderId !== userId && !(m.readBy as string[]).includes(userId)
    ).length;
    return { ...c, messages: c.messages.slice(0, 1), unread };
  });

  const sorted = clientsWithLastMessage
    .filter((c) => c._count.messages > 0 || c.id === cliente)
    .sort((a, b) => {
      const aDate = a.messages[0]?.createdAt ?? a.createdAt;
      const bDate = b.messages[0]?.createdAt ?? b.createdAt;
      return bDate.getTime() - aDate.getTime();
    });

  const allClients = await prisma.client.findMany({
    select: { id: true, name: true, surname: true },
    orderBy: { surname: "asc" },
  });

  const selectedClient = cliente
    ? allClients.find((c) => c.id === cliente)
    : undefined;

  return (
    <div className="flex h-[calc(100vh-8.5rem)] gap-4">
      <div className="w-72 shrink-0 overflow-y-auto rounded-lg border border-fog bg-surface">
        <div className="border-b border-fog px-3.5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink3">
            Conversazioni
          </p>
        </div>
        <nav className="divide-y divide-fog">
          {sorted.map((c) => {
            const last = c.messages[0];
            return (
              <Link
                key={c.id}
                href={`/chat?cliente=${c.id}`}
                className={cn(
                  "block px-3.5 py-3 hover:bg-sunken",
                  cliente === c.id && "bg-copper-bg"
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">
                    {c.name} {c.surname}
                  </p>
                  {c.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-copper px-1 text-[10px] font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
                {last && (
                  <p className="mt-0.5 truncate text-xs text-ink3">{last.content}</p>
                )}
              </Link>
            );
          })}
          {sorted.length === 0 && (
            <p className="px-3.5 py-6 text-center text-xs text-ink3">
              Nessuna conversazione ancora.
            </p>
          )}
        </nav>

        <div className="border-t border-fog p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink3">
            Tutti i clienti
          </p>
          <div className="space-y-0.5">
            {allClients.map((c) => (
              <Link
                key={c.id}
                href={`/chat?cliente=${c.id}`}
                className="block rounded-md px-2 py-1 text-xs text-ink2 hover:bg-sunken"
              >
                {c.name} {c.surname}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-lg border border-fog bg-surface">
        {selectedClient ? (
          <div className="flex h-full flex-col">
            <div className="border-b border-fog px-4 py-3">
              <Link
                href={`/clienti/${selectedClient.id}`}
                className="text-sm font-semibold text-ink hover:text-copper"
              >
                {selectedClient.name} {selectedClient.surname}
              </Link>
              <p className="text-[11px] uppercase tracking-wide text-ink3">
                Chat interna
              </p>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatThread clientId={selectedClient.id} currentUserId={userId} />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageSquare size={28} className="mb-3 text-ink3" />
            <p className="text-sm text-ink2">
              Seleziona un cliente per aprire la conversazione.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
