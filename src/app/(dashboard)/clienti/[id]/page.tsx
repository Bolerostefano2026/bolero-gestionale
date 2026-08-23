import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  Calendar,
  FileText,
  Plus,
  Ruler,
  GitBranch,
  MessageSquare,
  Receipt,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import {
  CLIENT_STATUS,
  APPOINTMENT_STATUS,
  QUOTE_STATUS,
  APPOINTMENT_TYPE,
  WORKFLOW_STAGE_LABEL,
  INVOICE_STATUS,
} from "@/lib/labels";
import { EditClientPanel } from "./edit-panel";
import { DeleteClientButton } from "./delete-button";
import { ClientTimeline, type TimelineEvent } from "./timeline";
import { ClientNoteForm } from "./client-note-form";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      appointments: { orderBy: { scheduledAt: "desc" } },
      quotes: { orderBy: { createdAt: "desc" } },
      measurements: {
        orderBy: { createdAt: "desc" },
        include: { product: { select: { name: true } } },
      },
      projects: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { issuedAt: "desc" } },
    },
  });

  if (!client) notFound();

  const canWrite = hasPermission(user.permissions, "clients:write");
  const canDelete = hasPermission(user.permissions, "clients:delete");
  const canReadInvoices = hasPermission(user.permissions, "invoices:read");
  const canWriteInvoices = hasPermission(user.permissions, "invoices:write");
  const statusInfo = CLIENT_STATUS[client.status];

  const events: TimelineEvent[] = [
    {
      date: client.createdAt,
      icon: UserPlus,
      label: "Cliente creato",
    },
  ];

  for (const a of client.appointments) {
    events.push({
      date: a.scheduledAt,
      icon: Calendar,
      label: `${APPOINTMENT_TYPE[a.type]} — ${APPOINTMENT_STATUS[a.status].label}`,
      detail: a.address ?? undefined,
    });
  }

  for (const q of client.quotes) {
    events.push({
      date: q.createdAt,
      icon: FileText,
      label: `Preventivo ${q.number} creato`,
    });
    if (q.status !== "BOZZA") {
      events.push({
        date: q.updatedAt,
        icon: FileText,
        label: `Preventivo ${q.number} — ${QUOTE_STATUS[q.status].label}`,
      });
    }
  }

  for (const m of client.measurements) {
    events.push({
      date: m.createdAt,
      icon: Ruler,
      label: `Misure rilevate — ${m.product.name}`,
    });
  }

  for (const p of client.projects) {
    events.push({
      date: p.createdAt,
      icon: GitBranch,
      label: `Progetto "${p.title}" avviato`,
    });
    if (p.stage !== "CONTATTO") {
      events.push({
        date: p.updatedAt,
        icon: GitBranch,
        label: `Progetto "${p.title}" — ${WORKFLOW_STAGE_LABEL[p.stage]}`,
      });
    }
  }

  if (canReadInvoices) {
    for (const inv of client.invoices) {
      events.push({
        date: inv.issuedAt,
        icon: Receipt,
        label: `Fattura ${inv.number} — ${INVOICE_STATUS[inv.status].label}`,
      });
    }
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="max-w-4xl">
      <Link
        href="/clienti"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-copper"
      >
        <ArrowLeft size={15} />
        Torna ai clienti
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-ink">
              {client.name} {client.surname}
            </h1>
            <Badge label={statusInfo.label} tone={statusInfo.tone} />
          </div>
          <p className="mt-1 text-sm text-ink2">
            Cliente dal {client.createdAt.toLocaleDateString("it-IT")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/chat?cliente=${client.id}`}
            className="flex items-center gap-1.5 rounded-md border border-fog px-3 py-2 text-sm font-medium text-ink2 hover:bg-sunken"
          >
            <MessageSquare size={15} />
            Chat
          </Link>
          {canDelete && <DeleteClientButton clientId={client.id} />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <EditClientPanel
            client={{
              id: client.id,
              name: client.name,
              surname: client.surname,
              phone: client.phone,
              email: client.email,
              address: client.address,
              city: client.city,
              cap: client.cap,
              status: client.status,
              notes: client.notes,
            }}
            canWrite={canWrite}
          />

          <div className="rounded-lg border border-fog bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
                Appuntamenti
              </h2>
              {canWrite && (
                <Link
                  href={`/calendario?cliente=${client.id}`}
                  className="flex items-center gap-1 text-xs font-medium text-copper hover:underline"
                >
                  <Plus size={13} />
                  Nuovo
                </Link>
              )}
            </div>
            {client.appointments.length === 0 ? (
              <p className="text-sm text-ink3">Nessun appuntamento.</p>
            ) : (
              <ul className="space-y-2">
                {client.appointments.map((a) => {
                  const s = APPOINTMENT_STATUS[a.status];
                  return (
                    <li
                      key={a.id}
                      className="flex items-center justify-between rounded-md border border-fog px-3 py-2 text-sm"
                    >
                      <span className="text-ink">
                        {APPOINTMENT_TYPE[a.type]} —{" "}
                        {a.scheduledAt.toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <Badge label={s.label} tone={s.tone} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-fog bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
                Misure
              </h2>
              {canWrite && (
                <Link
                  href={`/misure/nuovo?cliente=${client.id}`}
                  className="flex items-center gap-1 text-xs font-medium text-copper hover:underline"
                >
                  <Plus size={13} />
                  Nuova
                </Link>
              )}
            </div>
            {client.measurements.length === 0 ? (
              <p className="text-sm text-ink3">Nessuna misurazione.</p>
            ) : (
              <ul className="space-y-2">
                {client.measurements.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/misure/${m.id}`}
                      className="flex items-center justify-between rounded-md border border-fog px-3 py-2 text-sm hover:border-copper"
                    >
                      <span className="text-ink">{m.product.name}</span>
                      <span className="text-xs text-ink3">
                        {m.createdAt.toLocaleDateString("it-IT")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-fog bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
                Progetti
              </h2>
              {canWrite && (
                <Link
                  href={`/workflow/nuovo?cliente=${client.id}`}
                  className="flex items-center gap-1 text-xs font-medium text-copper hover:underline"
                >
                  <Plus size={13} />
                  Nuovo
                </Link>
              )}
            </div>
            {client.projects.length === 0 ? (
              <p className="text-sm text-ink3">Nessun progetto.</p>
            ) : (
              <ul className="space-y-2">
                {client.projects.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/workflow/${p.id}`}
                      className="flex items-center justify-between rounded-md border border-fog px-3 py-2 text-sm hover:border-copper"
                    >
                      <span className="text-ink">{p.title}</span>
                      <Badge label={WORKFLOW_STAGE_LABEL[p.stage]} tone="copper" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-fog bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
                Preventivi
              </h2>
              {canWrite && (
                <Link
                  href={`/preventivi/nuovo?cliente=${client.id}`}
                  className="flex items-center gap-1 text-xs font-medium text-copper hover:underline"
                >
                  <Plus size={13} />
                  Nuovo
                </Link>
              )}
            </div>
            {client.quotes.length === 0 ? (
              <p className="text-sm text-ink3">Nessun preventivo.</p>
            ) : (
              <ul className="space-y-2">
                {client.quotes.map((q) => {
                  const s = QUOTE_STATUS[q.status];
                  return (
                    <li key={q.id}>
                      <Link
                        href={`/preventivi/${q.id}`}
                        className="flex items-center justify-between rounded-md border border-fog px-3 py-2 text-sm hover:border-copper"
                      >
                        <span className="text-ink">
                          {q.number} — CHF 
                          {Number(q.total).toLocaleString("it-CH", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        <Badge label={s.label} tone={s.tone} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {canReadInvoices && (
            <div className="rounded-lg border border-fog bg-surface p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
                  Fatture
                </h2>
                {canWriteInvoices && (
                  <Link
                    href={`/fatture/nuovo?cliente=${client.id}`}
                    className="flex items-center gap-1 text-xs font-medium text-copper hover:underline"
                  >
                    <Plus size={13} />
                    Nuova
                  </Link>
                )}
              </div>
              {client.invoices.length === 0 ? (
                <p className="text-sm text-ink3">Nessuna fattura.</p>
              ) : (
                <ul className="space-y-2">
                  {client.invoices.map((inv) => {
                    const s = INVOICE_STATUS[inv.status];
                    return (
                      <li key={inv.id}>
                        <Link
                          href={`/fatture/${inv.id}`}
                          className="flex items-center justify-between rounded-md border border-fog px-3 py-2 text-sm hover:border-copper"
                        >
                          <span className="text-ink">
                            {inv.number} — CHF 
                            {Number(inv.total).toLocaleString("it-CH", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          <Badge label={s.label} tone={s.tone} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-fog bg-surface p-6">
            <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-ink">
              Timeline
            </h2>
            <ClientTimeline events={events} />
          </div>

          {canWrite && (
            <div className="rounded-lg border border-fog bg-surface p-6">
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink">
                Note interne
              </h2>
              {client.notes && (
                <div className="mb-4 max-h-48 overflow-y-auto rounded-md border border-fog bg-sunken p-3">
                  {client.notes.split("\n").filter(Boolean).reverse().map((line, i) => (
                    <p key={i} className="mb-1.5 text-xs text-ink2 last:mb-0 whitespace-pre-wrap">{line}</p>
                  ))}
                </div>
              )}
              <ClientNoteForm clientId={client.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
