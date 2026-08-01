"use client";

/**
 * Segment-level error boundary — catches render errors inside the root layout
 * (home page, search, listing pages, etc.) without losing the outer chrome.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        padding: "3rem 1.5rem",
        textAlign: "center",
        color: "var(--banco-fg, #fff)",
      }}
    >
      <p style={{ color: "#E8002D", marginBottom: "0.5rem", fontSize: "1.1rem" }}>
        حدث خطأ في التحميل
      </p>
      {error.message ? (
        <p
          style={{
            color: "var(--banco-muted, #888)",
            fontSize: "0.85rem",
            fontFamily: "monospace",
            marginBottom: "1rem",
          }}
        >
          {error.message}
        </p>
      ) : null}
      <button
        onClick={reset}
        style={{
          background: "#E8002D",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "0.5rem 1.25rem",
          cursor: "pointer",
        }}
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
