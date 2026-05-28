import { RefreshCw } from "lucide-react";

export interface PageCrashFallbackProps {
  onReset: () => void;
}

/**
 * User-facing error card for Add* pages when an unexpected crash occurs.
 * Replaces white screen with a clear Arabic message and reload option.
 */
export function PageCrashFallback({ onReset }: PageCrashFallbackProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 320,
        padding: 32,
        gap: 16,
        textAlign: "center",
        direction: "rtl",
      }}
    >
      <div
        style={{
          maxWidth: 400,
          padding: 24,
          borderRadius: 12,
          border: "1px solid var(--app-border-strong)",
          background: "var(--app-surface)",
          boxShadow: "var(--app-shadow-md, 0 4px 16px rgba(0,0,0,.08))",
        }}
      >
        <p style={{ fontSize: 28, margin: "0 0 8px" }}>⚠️</p>
        <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "var(--app-text)" }}>
          حدث خطأ غير متوقع
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--app-text-muted)" }}>
          حدث خطأ غير متوقع. يرجى إعادة المحاولة.
        </p>
        <button
          type="button"
          onClick={onReset}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 20px",
            borderRadius: 6,
            background: "var(--app-accent)",
            color: "#fff",
            border: 0,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} />
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
