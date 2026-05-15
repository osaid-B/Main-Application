import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "./Button";
import styles from "./Toast.module.css";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  /** Visual + ARIA category. Default: `"info"`. */
  type?: ToastType;
  /** Auto-dismiss duration in ms. Default: `3500`. Use `0` to disable auto-dismiss. */
  duration?: number;
  /** Optional bold title rendered above the message. */
  title?: string;
}

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  title?: string;
  state: "open" | "closing";
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 3500;
const MAX_VISIBLE = 5;
const EXIT_ANIMATION_MS = 200;

function generateId(): string {
  return `toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());
  const pausedRef = useRef<Set<string>>(new Set());

  const clearTimer = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t !== undefined) {
      window.clearTimeout(t);
      timersRef.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, state: "closing" } : t)),
      );
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, EXIT_ANIMATION_MS);
    },
    [clearTimer],
  );

  const scheduleDismiss = useCallback(
    (id: string, duration: number) => {
      if (duration <= 0) return;
      clearTimer(id);
      const handle = window.setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, handle);
    },
    [clearTimer, dismiss],
  );

  const toast = useCallback(
    (message: string, options?: ToastOptions): string => {
      const id = generateId();
      const item: ToastItem = {
        id,
        message,
        type: options?.type ?? "info",
        duration: options?.duration ?? DEFAULT_DURATION,
        title: options?.title,
        state: "open",
      };
      setToasts((prev) => {
        const next = [...prev, item];
        // Enforce MAX_VISIBLE — close the oldest ones.
        if (next.length > MAX_VISIBLE) {
          const excess = next.slice(0, next.length - MAX_VISIBLE);
          // Defer cascade dismiss to keep state update pure here.
          window.setTimeout(() => excess.forEach((t) => dismiss(t.id)), 0);
        }
        return next;
      });
      scheduleDismiss(id, item.duration);
      return id;
    },
    [dismiss, scheduleDismiss],
  );

  // Cleanup all timers on unmount.
  useEffect(() => {
    return () => {
      timersRef.current.forEach((handle) => window.clearTimeout(handle));
      timersRef.current.clear();
    };
  }, []);

  const handleMouseEnter = useCallback((id: string) => {
    pausedRef.current.add(id);
    const t = timersRef.current.get(id);
    if (t !== undefined) {
      window.clearTimeout(t);
      timersRef.current.delete(id);
    }
  }, []);

  const handleMouseLeave = useCallback(
    (id: string) => {
      pausedRef.current.delete(id);
      const item = toasts.find((t) => t.id === id);
      if (item && item.state === "open" && item.duration > 0) {
        scheduleDismiss(id, item.duration);
      }
    },
    [toasts, scheduleDismiss],
  );

  const value = useMemo<ToastContextValue>(() => ({ toast, dismiss }), [toast, dismiss]);

  // Mount portal only on the client (createPortal needs document).
  const portal =
    typeof document !== "undefined" ? (
      createPortal(
        <div className={styles.container} aria-live="polite" aria-atomic="false">
          {toasts.map((t) => {
            const isAlertRole = t.type === "error" || t.type === "warning";
            return (
              <div
                key={t.id}
                className={cn(styles.toast, styles[`type_${t.type}`])}
                data-state={t.state}
                role={isAlertRole ? "alert" : "status"}
                aria-live={isAlertRole ? "assertive" : "polite"}
                onMouseEnter={() => handleMouseEnter(t.id)}
                onMouseLeave={() => handleMouseLeave(t.id)}
                onFocus={() => handleMouseEnter(t.id)}
                onBlur={() => handleMouseLeave(t.id)}
              >
                <div className={styles.content}>
                  {t.title && <p className={styles.title}>{t.title}</p>}
                  <p className={styles.message}>{t.message}</p>
                </div>
                <Button
                  variant="icon"
                  size="sm"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className={styles.closeBtn}
                >
                  <X size={14} aria-hidden="true" />
                </Button>
              </div>
            );
          })}
        </div>,
        document.body,
      )
    ) : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {portal}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast() must be used within a <ToastProvider>");
  }
  return ctx;
}
