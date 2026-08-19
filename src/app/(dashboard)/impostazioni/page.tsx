import Link from "next/link";
import { Settings, Ruler, Plug, ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { ComingSoon } from "@/components/ui/coming-soon";
import { CreateUserForm } from "./create-user-form";
import { UserActiveToggle } from "./user-active-toggle";

export default async function ImpostazioniPage() {
  const session = await auth();
  const user = session!.user;

  if (!hasPermission(user.permissions, "users:manage")) {
    return (
      <ComingSoon
        icon={Settings}
        title="Impostazioni"
        description="Questa sezione è riservata al titolare."
        phase="Accesso limitato"
      />
    );
  }

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.role.findMany({ orderBy: { label: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Utenti &amp; ruoli
          </h1>
          <p className="mt-1 text-sm text-ink2">
            Gestisci l&apos;accesso di titolare, ufficio e collaboratori.
          </p>
        </div>
      </div>

      <Link
        href="/impostazioni/prodotti"
        className="mb-6 flex items-center justify-between rounded-lg border border-fog bg-surface p-5 transition hover:border-copper"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-copper-bg text-copper">
            <Ruler size={17} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Prodotti &amp; schede misure</p>
            <p className="text-xs text-ink2">
              Configura i prodotti e i campi delle schede di misurazione
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-ink3" />
      </Link>

      <Link
        href="/impostazioni/integrazioni"
        className="mb-6 flex items-center justify-between rounded-lg border border-fog bg-surface p-5 transition hover:border-copper"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-copper-bg text-copper">
            <Plug size={17} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Integrazioni</p>
            <p className="text-xs text-ink2">
              Google Calendar, Google Sheets ed email transazionali
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-ink3" />
      </Link>

      <div className="mb-6 flex justify-end">
        <CreateUserForm roles={roles.map((r) => ({ id: r.id, label: r.label }))} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-fog bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-fog bg-sunken text-left text-[11px] uppercase tracking-wide text-ink3">
              <th className="px-4 py-2.5 font-semibold">Nome</th>
              <th className="px-4 py-2.5 font-semibold">Email</th>
              <th className="px-4 py-2.5 font-semibold">Ruolo</th>
              <th className="px-4 py-2.5 font-semibold">Stato</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-fog last:border-0">
                <td className="px-4 py-2.5 font-medium text-ink">{u.name}</td>
                <td className="px-4 py-2.5 text-ink2">{u.email}</td>
                <td className="px-4 py-2.5 text-ink2">{u.role.label}</td>
                <td className="px-4 py-2.5">
                  <UserActiveToggle
                    userId={u.id}
                    active={u.active}
                    disabled={u.id === user.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
