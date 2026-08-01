"use client";

/**
 * Global error boundary for the Next.js web app.
 * Catches unhandled React render errors that would otherwise leave a black screen.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          padding: "2rem",
          background: "#0a0a0a",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem", color: "#E8002D" }}>
            حدث خطأ غير متوقع
          </h1>
          <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            {error.message || "خطأ في التحميل"}
            {error.digest ? (
              <span
                style={{
                  display: "block",
                  marginTop: "0.5rem",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  color: "#555",
                }}
              >
                digest: {error.digest}
              </span>
            ) : null}
          </p>
          <button
            onClick={reset}
            style={{
              background: "#E8002D",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0.6rem 1.5rem",
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
