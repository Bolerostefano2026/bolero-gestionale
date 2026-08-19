import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { ComingSoon } from "@/components/ui/coming-soon";
import { ClientForm } from "../client-form";

export default async function NuovoClientePage() {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "clients:write")) {
    return (
      <ComingSoon
        icon={Users}
        title="Nuovo cliente"
        description="Non hai i permessi per creare clienti."
        phase="Accesso limitato"
      />
    );
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/clienti"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-copper"
      >
        <ArrowLeft size={15} />
        Torna ai clienti
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">
        Nuovo cliente
      </h1>
      <div className="rounded-lg border border-fog bg-surface p-6">
        <ClientForm />
      </div>
    </div>
  );
}
