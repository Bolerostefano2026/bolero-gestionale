import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;

  async function authenticate(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const callbackUrl = (formData.get("callbackUrl") as string) || "/";

    try {
      await signIn("credentials", { email, password, redirectTo: callbackUrl });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect(`/login?error=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }
      throw error;
    }
  }

  return (
    <main className="flex min-h-screen">
      {/* Left — brand panel */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-14"
        style={{ background: "var(--sidebar)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="font-display text-[28px] leading-none"
            style={{ fontStyle: "italic", fontWeight: 300, color: "var(--sidebar-ink)" }}
          >
            B
          </span>
          <div style={{ width: "1px", height: "18px", background: "var(--sidebar-ink3)" }} />
          <span
            className="text-[9px] font-semibold tracking-[0.25em] uppercase"
            style={{ color: "var(--sidebar-ink2)" }}
          >
            Gestionale
          </span>
        </div>

        <div>
          <p
            className="font-display text-[46px] xl:text-[52px] leading-[1.1] tracking-tight"
            style={{ fontStyle: "italic", fontWeight: 300, color: "var(--sidebar-ink)" }}
          >
            Il tuo lavoro,<br />in ordine.
          </p>
          <div
            className="mt-7 mb-1"
            style={{ width: "32px", height: "1px", background: "var(--sidebar-ink3)" }}
          />
          <p className="mt-4 text-[13px] leading-relaxed" style={{ color: "var(--sidebar-ink2)" }}>
            Serramenti, tende e pergole —<br />
            tutto in un unico posto.
          </p>
        </div>

        <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: "var(--sidebar-ink3)" }}>
          Ticino · CH
        </p>
      </div>

      {/* Right — form panel */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-12"
        style={{ background: "var(--canvas)" }}
      >
        <div className="w-full max-w-[340px]">
          {/* Mobile brand */}
          <div className="mb-10 lg:hidden">
            <span
              className="font-display text-3xl text-ink"
              style={{ fontStyle: "italic", fontWeight: 300 }}
            >
              Bolero
            </span>
            <p className="mt-1 text-[10px] font-semibold tracking-[0.2em] uppercase text-copper">
              Gestionale
            </p>
          </div>

          <h2 className="mb-1 text-xl font-semibold text-ink">Accedi</h2>
          <p className="mb-7 text-sm text-ink3">Inserisci le tue credenziali aziendali.</p>

          <form action={authenticate} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={params.callbackUrl ?? "/"} />

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
                placeholder="nome@azienda.ch"
                className="w-full rounded-lg border border-fog bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink3 outline-none focus:border-copper focus:ring-2 focus:ring-copper/15"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full rounded-lg border border-fog bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink3 outline-none focus:border-copper focus:ring-2 focus:ring-copper/15"
              />
            </div>

            {params.error && (
              <div className="rounded-lg border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-danger">
                Email o password non corrette.
              </div>
            )}

            <button
              type="submit"
              className="mt-2 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98]"
              style={{
                background: "var(--copper)",
                boxShadow: "0 1px 2px rgba(168,88,32,.25), 0 3px 10px rgba(168,88,32,.12)",
              }}
            >
              Accedi
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
