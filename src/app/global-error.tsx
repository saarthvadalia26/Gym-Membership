"use client";

import { useEffect } from "react";

/**
 * Catches errors that bubble up past every other error boundary, including
 * crashes inside the root layout. Replaces the default Next.js
 * "Application error" screen with the actual error message + digest.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 18, margin: 0, fontWeight: 600 }}>
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#475569",
              marginTop: 12,
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              textAlign: "left",
              background: "#f1f5f9",
              padding: 12,
              borderRadius: 8,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            {error.message || "Unknown error"}
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              background: "#0284c7",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
