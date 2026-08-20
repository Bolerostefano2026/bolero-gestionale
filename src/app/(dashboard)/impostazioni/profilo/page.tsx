"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { aggiornaNome, cambiaPassword, aggiornaAvatar } from "./actions";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-ink2 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm text-ink focus:border-copper focus:outline-none"
    />
  );
}

function Alert({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <p className={`mt-2 text-sm font-medium ${ok ? "text-green-600" : "text-red-600"}`}>{msg}</p>
  );
}

export default function ProfiloPage() {
  const { data: session, update } = useSession();
  const user = session?.user;

  const [nomePending, startNome] = useTransition();
  const [pwPending, startPw] = useTransition();
  const [avatarPending, startAvatar] = useTransition();

  const [nomeMsg, setNomeMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [avatarMsg, setAvatarMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleNome(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startNome(async () => {
      const r = await aggiornaNome(fd);
      setNomeMsg({ text: r.success ?? r.error ?? "", ok: !!r.success });
      if (r.success) update();
    });
  }

  async function handlePw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startPw(async () => {
      const r = await cambiaPassword(fd);
      setPwMsg({ text: r.success ?? r.error ?? "", ok: !!r.success });
      if (r.success) (e.target as HTMLFormElement).reset();
    });
  }

  async function handleAvatar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startAvatar(async () => {
      const r = await aggiornaAvatar(fd);
      setAvatarMsg({ text: r.success ?? r.error ?? "", ok: !!r.success });
      if (r.success) update();
    });
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-bold text-ink mb-6">Profilo</h1>

      {/* Avatar */}
      <div className="mb-6 flex items-center gap-4">
        {user?.image ? (
          <img src={user.image} alt="avatar" className="h-16 w-16 rounded-full object-cover border border-fog" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-copper/20 flex items-center justify-center text-2xl font-bold text-copper">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-ink">{user?.name}</p>
          <p className="text-sm text-ink2">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Cambio nome */}
        <section className="rounded-lg border border-fog bg-surface p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink mb-4">
            Nome visualizzato
          </h2>
          <form onSubmit={handleNome} className="space-y-3">
            <Field label="Nome e cognome">
              <Input name="name" defaultValue={user?.name ?? ""} required minLength={2} />
            </Field>
            <button
              type="submit"
              disabled={nomePending}
              className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white hover:bg-copper/90 disabled:opacity-60"
            >
              {nomePending ? "Salvataggio..." : "Salva nome"}
            </button>
            {nomeMsg && <Alert msg={nomeMsg.text} ok={nomeMsg.ok} />}
          </form>
        </section>

        {/* Cambio password */}
        <section className="rounded-lg border border-fog bg-surface p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink mb-4">
            Cambia password
          </h2>
          <form onSubmit={handlePw} className="space-y-3">
            <Field label="Password attuale">
              <Input type="password" name="current" required autoComplete="current-password" />
            </Field>
            <Field label="Nuova password">
              <Input type="password" name="nuova" required minLength={8} autoComplete="new-password" />
            </Field>
            <Field label="Conferma nuova password">
              <Input type="password" name="conferma" required autoComplete="new-password" />
            </Field>
            <button
              type="submit"
              disabled={pwPending}
              className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white hover:bg-copper/90 disabled:opacity-60"
            >
              {pwPending ? "Aggiornamento..." : "Aggiorna password"}
            </button>
            {pwMsg && <Alert msg={pwMsg.text} ok={pwMsg.ok} />}
          </form>
        </section>

        {/* Avatar URL */}
        <section className="rounded-lg border border-fog bg-surface p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink mb-4">
            Foto profilo
          </h2>
          <form onSubmit={handleAvatar} className="space-y-3">
            <Field label="URL immagine">
              <Input
                name="imageUrl"
                type="url"
                placeholder="https://..."
                defaultValue={user?.image ?? ""}
              />
            </Field>
            <button
              type="submit"
              disabled={avatarPending}
              className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white hover:bg-copper/90 disabled:opacity-60"
            >
              {avatarPending ? "Salvataggio..." : "Aggiorna foto"}
            </button>
            {avatarMsg && <Alert msg={avatarMsg.text} ok={avatarMsg.ok} />}
          </form>
        </section>
      </div>
    </div>
  );
}
