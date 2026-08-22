"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { aggiornaNome, cambiaPassword, aggiornaAvatar } from "./actions";

const inputCls =
  "w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm text-ink focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink2">
        {label}
      </label>
      {children}
    </div>
  );
}

function Feedback({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <p className={`mt-2 rounded-md px-3 py-2 text-sm ${ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
      {msg}
    </p>
  );
}

function Avatar({ name, image }: { name?: string; image?: string }) {
  const initials = name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  if (image) {
    return (
      <img
        src={image}
        alt={name ?? "avatar"}
        className="h-16 w-16 rounded-full border border-fog object-cover"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-copper/20 text-xl font-bold text-copper">
      {initials}
    </div>
  );
}

export default function ProfiloPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
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
      if (r.success) {
        await update({ name: fd.get("name") as string });
        router.refresh();
      }
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
      if (r.success) {
        await update();
        router.refresh();
      }
    });
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Profilo personale</h1>

      <div className="mb-6 flex items-center gap-4 rounded-lg border border-fog bg-surface p-5">
        <Avatar name={user?.name ?? ""} image={user?.image ?? undefined} />
        <div>
          <p className="font-semibold text-ink">{user?.name}</p>
          <p className="text-sm text-ink2">{user?.email}</p>
          <p className="mt-0.5 text-xs text-ink3">{user?.roleLabel}</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Cambio nome */}
        <section className="rounded-lg border border-fog bg-surface p-5">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-ink">
            Nome visualizzato
          </h2>
          <form onSubmit={handleNome} className="space-y-3">
            <Field label="Nome e cognome">
              <input
                name="name"
                className={inputCls}
                defaultValue={user?.name ?? ""}
                required
                minLength={2}
              />
            </Field>
            <button
              type="submit"
              disabled={nomePending}
              className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white hover:bg-copper/90 disabled:opacity-60"
            >
              {nomePending ? "Salvataggio…" : "Salva nome"}
            </button>
            {nomeMsg && <Feedback msg={nomeMsg.text} ok={nomeMsg.ok} />}
          </form>
        </section>

        {/* Cambio password */}
        <section className="rounded-lg border border-fog bg-surface p-5">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-ink">
            Cambia password
          </h2>
          <form onSubmit={handlePw} className="space-y-3">
            <Field label="Password attuale">
              <input type="password" name="current" className={inputCls} required autoComplete="current-password" />
            </Field>
            <Field label="Nuova password (min. 8 caratteri)">
              <input type="password" name="nuova" className={inputCls} required minLength={8} autoComplete="new-password" />
            </Field>
            <Field label="Conferma nuova password">
              <input type="password" name="conferma" className={inputCls} required autoComplete="new-password" />
            </Field>
            <button
              type="submit"
              disabled={pwPending}
              className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white hover:bg-copper/90 disabled:opacity-60"
            >
              {pwPending ? "Aggiornamento…" : "Aggiorna password"}
            </button>
            {pwMsg && <Feedback msg={pwMsg.text} ok={pwMsg.ok} />}
          </form>
        </section>

        {/* Foto profilo */}
        <section className="rounded-lg border border-fog bg-surface p-5">
          <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-ink">
            Foto profilo
          </h2>
          <form onSubmit={handleAvatar} className="space-y-3">
            <Field label="URL immagine (https://)">
              <input
                name="imageUrl"
                type="url"
                className={inputCls}
                placeholder="https://esempio.com/foto.jpg"
                defaultValue={user?.image ?? ""}
              />
            </Field>
            <p className="text-xs text-ink3">
              Incolla un link pubblico a un&apos;immagine (es. da Gravatar o un servizio di hosting foto).
            </p>
            <button
              type="submit"
              disabled={avatarPending}
              className="rounded-md bg-copper px-4 py-2 text-sm font-semibold text-white hover:bg-copper/90 disabled:opacity-60"
            >
              {avatarPending ? "Salvataggio…" : "Aggiorna foto"}
            </button>
            {avatarMsg && <Feedback msg={avatarMsg.text} ok={avatarMsg.ok} />}
          </form>
        </section>
      </div>
    </div>
  );
}
