import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** px value — the modal will also cap at calc(100vw - 32px) */
  width?: number;
  children: ReactNode;
  footer?: ReactNode;
  maxHeight?: string;
  /** When false, clicking backdrop / Escape does not close. Default: true */
  isDismissible?: boolean;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  width = 480,
  children,
  footer,
  maxHeight = "88vh",
  isDismissible = true,
}: BaseModalProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const [closing, setClosing] = useState(false);
  const reactId = useId();

  const requestClose = useCallback(() => {
    if (!isDismissible) return;
    setClosing(true);
    window.setTimeout(() => { setClosing(false); onClose(); }, 180);
  }, [isDismissible, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Capture focus and autofocus first element
  useEffect(() => {
    if (!isOpen) return;
    prevFocusRef.current = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      const el = surfaceRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      el?.focus();
    }, 30);
    return () => {
      window.clearTimeout(t);
      prevFocusRef.current?.focus();
    };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); requestClose(); }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [isOpen, requestClose]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const surface = surfaceRef.current;
    if (!surface) return;
    const focusables = Array.from(surface.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!focusables.length) { e.preventDefault(); return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey) {
      if (active === first || !surface.contains(active)) { e.preventDefault(); last.focus(); }
    } else {
      if (active === last) { e.preventDefault(); first.focus(); }
    }
  }, []);

  if (!isOpen) return null;

  const titleId = `bm-title-${reactId}`;

  return createPortal(
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 9000,
          backgroundColor: "rgba(15,23,42,0.55)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          animation: closing ? "bmBackdropOut 180ms ease forwards" : "bmBackdropIn 200ms ease forwards",
        }}
        onClick={requestClose}
      />

      {/* ── Modal surface ─────────────────────────────────────────────────── */}
      <div
        ref={surfaceRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9001,
          width, maxWidth: "calc(100vw - 32px)", maxHeight,
          backgroundColor: "#FFFFFF",
          borderRadius: 20,
          boxShadow: "0 32px 80px rgba(0,0,0,0.22), 0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          direction: "rtl",
          animation: closing
            ? "bmModalOut 180ms cubic-bezier(0.4,0,1,1) forwards"
            : "bmModalIn 220ms cubic-bezier(0.16,1,0.3,1) forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #F1F5F9",
          flexShrink: 0,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <h2 id={titleId} style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A", lineHeight: 1.3 }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="إغلاق"
            style={{
              width: 32, height: 32, borderRadius: 8, border: "none",
              backgroundColor: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#94A3B8", flexShrink: 0, marginInlineStart: 8,
              transition: "background-color 150ms, color 150ms",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FEF2F2"; e.currentTarget.style.color = "#DC2626"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#94A3B8"; }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "20px 24px" }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{ padding: "14px 24px", borderTop: "1px solid #F1F5F9", flexShrink: 0, backgroundColor: "#FFFFFF" }}>
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes bmBackdropIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes bmBackdropOut { from { opacity: 1 } to { opacity: 0 } }
        @keyframes bmModalIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.93) translateY(8px); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1)    translateY(0);  }
        }
        @keyframes bmModalOut {
          from { opacity: 1; transform: translate(-50%, -50%) scale(1)    translateY(0);  }
          to   { opacity: 0; transform: translate(-50%, -50%) scale(0.95) translateY(4px); }
        }
        @keyframes bmSpin { to { transform: rotate(360deg); } }
      `}</style>
    </>,
    document.body,
  );
}
