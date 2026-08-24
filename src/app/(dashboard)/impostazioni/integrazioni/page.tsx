import Link from "next/link";
import { ArrowLeft, Calendar, Sheet, Mail, Settings, Sparkles, ImageIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Badge } from "@/components/ui/badge";
import { SheetsButton } from "./sheets-button";

const INTEGRATIONS = [
  {
    icon: Sparkles,
    name: "AI Orchestrator (Claude)",
    description:
      "Alimenta la sezione \"Parla con Bolero\": ricerca clienti, riepiloghi e proposte di azione con Claude via Anthropic API.",
    envVar: "ANTHROPIC_API_KEY",
    connected: () => Boolean(process.env.ANTHROPIC_API_KEY),
    note: null,
  },
  {
    icon: ImageIcon,
    name: "Supabase Storage",
    description:
      "Storage per le foto delle schede di misurazione. Senza questa integrazione le foto vengono comunque salvate (come base64 nel database) ma non scala bene su grandi volumi.",
    envVar: "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY",
    connected: () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    note: null,
  },
  {
    icon: Calendar,
    name: "Google Calendar",
    description:
      "Sincronizza automaticamente gli appuntamenti di Bolero con un calendario Google condiviso. Ogni appuntamento creato, modificato o eliminato si aggiorna in tempo reale.",
    envVar: "GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_KEY / GOOGLE_CALENDAR_ID",
    connected: () =>
      Boolean(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
          process.env.GOOGLE_SERVICE_ACCOUNT_KEY &&
          process.env.GOOGLE_CALENDAR_ID
      ),
    note: "Richiede un service account Google Cloud con accesso al Calendar API. Condividi il calendario con l'email del service account.",
  },
  {
    icon: Sheet,
    name: "Google Sheets",
    description:
      "Esporta clienti, preventivi e fatture su un foglio Google condiviso. Usa il tasto \"Sincronizza ora\" per aggiornare manualmente i dati.",
    envVar: "GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_KEY / GOOGLE_SHEET_ID",
    connected: () =>
      Boolean(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
          process.env.GOOGLE_SERVICE_ACCOUNT_KEY &&
          process.env.GOOGLE_SHEET_ID
      ),
    note: "Richiede un service account Google Cloud con accesso allo Sheets API. Crea il foglio con 3 schede: Clienti, Preventivi, Fatture — poi condividilo con l'email del service account.",
    hasAction: true,
  },
  {
    icon: Mail,
    name: "Email transazionali (Resend)",
    description:
      "Invio reale delle notifiche ai titolari: appuntamenti, preventivi fermi, fatture scadute. Senza questa integrazione le notifiche restano solo in-app.",
    envVar: "RESEND_API_KEY / EMAIL_MITTENTE",
    connected: () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_MITTENTE),
    note: "EMAIL_MITTENTE = info@boleroserramenti.ch (deve essere un dominio verificato su Resend).",
  },
  {
    icon: Settings,
    name: "Cron alert giornalieri (Vercel)",
    description:
      "Ogni mattina alle 07:00 controlla fatture scadute, preventivi fermi da 14+ giorni e appuntamenti odierni, inviando notifiche automatiche al titolare e ai collaboratori.",
    envVar: "CRON_SECRET",
    connected: () => Boolean(process.env.CRON_SECRET),
    note: "Genera un segreto casuale (es. con openssl rand -hex 32) e aggiungilo sia su Vercel che nell'header x-cron-secret delle chiamate cron.",
  },
];

export default async function IntegrazioniPage() {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, "users:manage")) {
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
        Servizi esterni collegati al gestionale. Le variabili d&apos;ambiente vanno configurate
        su{" "}
        <span className="rounded bg-sunken px-1 py-0.5 text-xs font-mono">
          Vercel → Settings → Environment Variables
        </span>
        .
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
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{integration.name}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {"hasAction" in integration && integration.hasAction && isConnected && (
                      <SheetsButton />
                    )}
                    <Badge
                      label={isConnected ? "Connesso" : "Non connesso"}
                      tone={isConnected ? "success" : "neutral"}
                    />
                  </div>
                </div>
                <p className="mt-1 text-sm text-ink2">{integration.description}</p>
                {integration.note && (
                  <p className="mt-1.5 text-xs text-ink3 italic">{integration.note}</p>
                )}
                <p className="mt-2 text-xs text-ink3">
                  Variabili richieste:{" "}
                  <code className="rounded bg-sunken px-1 py-0.5 font-mono">
                    {integration.envVar}
                  </code>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
