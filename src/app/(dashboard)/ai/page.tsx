import { AiChatPanel } from "./chat-panel";

export default function AiPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold text-ink">Parla con Bolero</h1>
        <p className="mt-1 text-sm text-ink2">
          L&apos;AI Orchestrator ha accesso in sola lettura ai tuoi dati e propone azioni che
          restano in attesa della tua conferma esplicita.
        </p>
      </div>
      <AiChatPanel />
    </div>
  );
}
