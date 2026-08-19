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
      await signIn("credentials", {
        email,
        password,
        redirectTo: callbackUrl,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect(`/login?error=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }
      throw error;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-widest uppercase text-copper">
            Bolero
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink3">
            Gestionale Aziendale
          </p>
        </div>

        <form
          action={authenticate}
          className="rounded-lg border border-fog bg-surface p-8 shadow-sm"
        >
          <input type="hidden" name="callbackUrl" value={params.callbackUrl ?? "/"} />

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
                className="w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-copper focus:ring-1 focus:ring-copper"
                placeholder="nome@azienda.it"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-md border border-fog bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-copper focus:ring-1 focus:ring-copper"
                placeholder="••••••••"
              />
            </div>
          </div>

          {params.error && (
            <p className="mt-4 rounded-md bg-danger-bg px-3 py-2 text-xs text-danger">
              Email o password non corrette.
            </p>
          )}

          <button
            type="submit"
            className="mt-6 w-full rounded-md bg-copper px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-copper-lt"
          >
            Accedi
          </button>
        </form>
      </div>
    </main>
  );
}
