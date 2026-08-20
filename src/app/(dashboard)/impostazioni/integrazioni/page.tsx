import Link from "next/link";
import { ArrowLeft, Calendar, Sheet, Mail, Settings, Sparkles, ImageIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Badge } from "@/components/ui/badge";

const INTEGRATIONS = [
  {
    icon: Sparkles,
    name: "AI Orchestrator (Claude)",
    description:
      "Alimenta la sezione \"Parla con Bolero\": ricerca clienti, riepiloghi e proposte di azione con Claude via Anthropic API.",
    envVar: "ANTHROPIC_API_KEY",
    connected: () => Boolean(process.env.ANTHROPIC_API_KEY),
  },
  {
    icon: ImageIcon,
    name: "Supabase Storage",
    description:
      "Storage per le foto delle schede di misurazione. Senza questa integrazione le foto vengono comunque salvate (come base64 nel database) ma non scala bene su grandi volumi.",
    envVar: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY",
    connected: () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  },
  {
    icon: Calendar,
    name: "Google Calendar",
    description:
      "Sincronizza gli appuntamenti del calendario Bolero con Google Calendar in entrambe le direzioni.",
    envVar: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET",
    connected: () => Boolean(process.env.GOOGLE_CLIENT_ID),
  },
  {
    icon: Sheet,
    name: "Google Sheets",
    description:
      "Esporta automaticamente clienti e preventivi confermati su un foglio Google condiviso.",
    envVar: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET",
    connected: () => Boolean(process.env.GOOGLE_CLIENT_ID),
  },
  {
    icon: Mail,
    name: "Email transazionali (Resend)",
    description:
      "Invio reale dei promemoria approvati e delle comunicazioni al cliente. Finché non è connesso, i promemoria restano visibili in coda ma non vengono recapitati.",
    envVar: "RESEND_API_KEY + EMAIL_MITTENTE",
    connected: () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_MITTENTE),
  },
];

export default async function IntegrazioniPage() {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "products:manage")) {
    return (
      <ComingSoon
        icon={Settings}
        title="Integrazioni"
        description="Questa sezione è riservata al titolare."
        phase="Accesso limitato"
      />
    );
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/impostazioni"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink2 hover:text-copper"
      >
        <ArrowLeft size={15} />
        Torna a Impostazioni
      </Link>

      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Integrazioni</h1>
      <p className="mb-6 text-sm text-ink2">
        Servizi esterni predisposti nell&apos;architettura. Richiedono credenziali da
        configurare in <code className="rounded bg-sunken px-1 py-0.5 text-xs">.env</code>{" "}
        prima di poter essere attivati.
      </p>

      <div className="space-y-3">
        {INTEGRATIONS.map((integration) => {
          const Icon = integration.icon;
          const isConnected = integration.connected();
          return (
            <div
              key={integration.name}
              className="flex items-start gap-4 rounded-lg border border-fog bg-surface p-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-copper-bg text-copper">
                <Icon size={18} />
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">{integration.name}</p>
                  <Badge
                    label={isConnected ? "Connesso" : "Non connesso"}
                    tone={isConnected ? "success" : "neutral"}
                  />
                </div>
                <p className="mt-1 text-sm text-ink2">{integration.description}</p>
                <p className="mt-2 text-xs text-ink3">
                  Variabili richieste:{" "}
                  <code className="rounded bg-sunken px-1 py-0.5">{integration.envVar}</code>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
