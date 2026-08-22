import Link from "next/link";
import { Suspense } from "react";
import { Users, CalendarClock, FileText, Wrench, AlertTriangle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { AiBriefing, AiBriefingSkeleton } from "@/components/dashboard/ai-briefing";
import { APPOINTMENT_STATUS, APPOINTMENT_TYPE } from "@/lib/labels";
import type { Prisma } from "@prisma/client";

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - 30);

  const canSeeAllAppointments = hasPermission(user.permissions, "appointments:read_all");
  const canSeeInvoices = hasPermission(user.permissions, "invoices:read");
  const todaysAppointmentsWhere: Prisma.AppointmentWhereInput = {
    scheduledAt: { gte: todayStart, lte: todayEnd },
    ...(canSeeAllAppointments ? {} : { assignedToId: user.id }),
  };

  // Ultimi 6 mesi per il grafico fatturato
  const sei = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const fatturatoRange = new Date();
  fatturatoRange.setMonth(fatturatoRange.getMonth() - 5);
  fatturatoRange.setDate(1);
  fatturatoRange.setHours(0, 0, 0, 0);

  const [
    clientCount,
    todaysAppointments,
    pendingQuotesCount,
    inProgressCount,
    userCount,
    overdueInvoices,
    staleClients,
    fattureGrafico,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.appointment.findMany({
      where: todaysAppointmentsWhere,
      include: { client: { select: { name: true, surname: true } } },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.quote.count({ where: { status: "IN_ATTESA" } }),
    prisma.client.count({ where: { status: "IN_LAVORAZIONE" } }),
    hasPermission(user.permissions, "users:manage")
      ? prisma.user.count()
      : Promise.resolve(null),
    canSeeInvoices
      ? prisma.invoice.count({ where: { status: "SCADUTA" } })
      : Promise.resolve(0),
    prisma.client.findMany({
      where: {
        status: { in: ["ATTIVO", "IN_LAVORAZIONE"] },
        updatedAt: { lt: staleThreshold },
      },
      select: { id: true, name: true, surname: true, updatedAt: true },
      orderBy: { updatedAt: "asc" },
      take: 5,
    }),
    canSeeInvoices
      ? prisma.invoice.findMany({
          where: { status: "PAGATA", issuedAt: { gte: fatturatoRange } },
          select: { total: true, issuedAt: true },
        })
      : Promise.resolve([]),
  ]);

  // Aggrega fatturato per mese
  const MESI_IT = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
  const fatturatoMensile = sei.map(({ year, month }) => {
    const totale = fattureGrafico
      .filter((f) => f.issuedAt.getFullYear() === year && f.issuedAt.getMonth() === month)
      .reduce((sum, f) => sum + Number(f.total), 0);
    return { label: MESI_IT[month], totale };
  });
  const maxFatturato = Math.max(...fatturatoMensile.map((m) => m.totale), 1);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink">
          Bentornato, {user.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-ink2">
          Ecco il quadro operativo di oggi.
        </p>
      </div>

      <div className="mb-6">
        <Suspense fallback={<AiBriefingSkeleton />}>
          <AiBriefing />
        </Suspense>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Clienti totali" value={clientCount} icon={Users} tone="copper" />
        <StatCard
          label="Appuntamenti oggi"
          value={todaysAppointments.length}
          icon={CalendarClock}
        />
        <StatCard
          label="Preventivi in attesa"
          value={pendingQuotesCount}
          icon={FileText}
          tone="warn"
        />
        <StatCard label="Clienti in lavorazione" value={inProgressCount} icon={Wrench} />
        {overdueInvoices > 0 && (
          <StatCard
            label="Fatture scadute"
            value={overdueInvoices}
            icon={AlertTriangle}
            tone="warn"
          />
        )}
        {userCount !== null && (
          <StatCard label="Utenti attivi" value={userCount} icon={Users} tone="success" />
        )}
      </div>

      {canSeeInvoices && (
        <div className="mt-8 rounded-lg border border-fog bg-surface p-6">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-ink">
            Fatturato mensile — ultimi 6 mesi (CHF)
          </h2>
          <svg viewBox="0 0 600 160" className="w-full" aria-label="Grafico fatturato mensile">
            {/* Linee guida orizzontali */}
            {[0, 25, 50, 75, 100].map((pct) => (
              <line
                key={pct}
                x1="40" y1={130 - pct * 1.1}
                x2="590" y2={130 - pct * 1.1}
                stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"
              />
            ))}
            {/* Barre */}
            {fatturatoMensile.map((m, i) => {
              const barW = 60;
              const gap = 27;
              const x = 50 + i * (barW + gap);
              const h = Math.max((m.totale / maxFatturato) * 110, m.totale > 0 ? 4 : 0);
              const y = 130 - h;
              return (
                <g key={i}>
                  <rect
                    x={x} y={y} width={barW} height={h}
                    rx="4" fill="#c8914a" fillOpacity={m.totale > 0 ? "0.85" : "0.15"}
                  />
                  {m.totale > 0 && (
                    <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.7">
                      {m.totale >= 1000 ? `${(m.totale / 1000).toFixed(1)}k` : m.totale.toFixed(0)}
                    </text>
                  )}
                  <text x={x + barW / 2} y={148} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity="0.6">
                    {m.label}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="mt-2 flex gap-6 text-xs text-ink2">
            <span>
              Totale 6 mesi:{" "}
              <strong className="text-ink">
                CHF {fatturatoMensile.reduce((s, m) => s + m.totale, 0).toLocaleString("it-CH", { minimumFractionDigits: 2 })}
              </strong>
            </span>
            <span>
              Media mensile:{" "}
              <strong className="text-ink">
                CHF {(fatturatoMensile.reduce((s, m) => s + m.totale, 0) / 6).toLocaleString("it-CH", { minimumFractionDigits: 2 })}
              </strong>
            </span>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-fog bg-surface p-6">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-ink">
            Appuntamenti di oggi
          </h2>
          {todaysAppointments.length === 0 ? (
            <p className="text-sm text-ink3">Nessun appuntamento programmato per oggi.</p>
          ) : (
            <ul className="space-y-2">
              {todaysAppointments.map((a) => {
                const s = APPOINTMENT_STATUS[a.status];
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-md border border-fog px-3 py-2 text-sm"
                  >
                    <span className="text-ink">
                      <strong className="tabular-nums">
                        {a.scheduledAt.toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </strong>{" "}
                      · {APPOINTMENT_TYPE[a.type]} — {a.client.name} {a.client.surname}
                    </span>
                    <Badge label={s.label} tone={s.tone} />
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/calendario"
            className="mt-3 inline-block text-xs font-semibold text-copper hover:underline"
          >
            Vai al calendario →
          </Link>
        </div>

        <div className="rounded-lg border border-fog bg-surface p-6">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-ink">
            Clienti senza aggiornamenti da 30+ giorni
          </h2>
          {staleClients.length === 0 ? (
            <p className="text-sm text-ink3">
              Tutti i clienti attivi hanno ricevuto un aggiornamento di recente.
            </p>
          ) : (
            <ul className="space-y-2">
              {staleClients.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/clienti/${c.id}`}
                    className="flex items-center justify-between rounded-md border border-fog px-3 py-2 text-sm hover:border-copper"
                  >
                    <span className="text-ink">
                      {c.name} {c.surname}
                    </span>
                    <span className="text-xs text-ink3">
                      ultimo agg. {c.updatedAt.toLocaleDateString("it-IT")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
