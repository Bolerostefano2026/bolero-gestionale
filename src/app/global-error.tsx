"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="it">
      <body style={{ margin: 0, background: "#FFFFFF", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <p style={{ fontSize: "5rem", fontWeight: 800, color: "#c8914a", opacity: 0.25, margin: 0 }}>
            500
          </p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1a1a2e", marginTop: "1rem" }}>
            Errore critico
          </h1>
          <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.5rem", maxWidth: 360 }}>
            Il gestionale ha incontrato un problema grave. Ricarica la pagina o contatta il supporto.
          </p>
          {error.digest && (
            <p style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.5rem" }}>
              Ref: {error.digest}
            </p>
          )}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button
              onClick={reset}
              style={{
                background: "#c8914a",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                padding: "0.625rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Riprova
            </button>
            <a
              href="/"
              style={{
                border: "1px solid #e5e7eb",
                color: "#6b7280",
                borderRadius: "0.375rem",
                padding: "0.625rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
