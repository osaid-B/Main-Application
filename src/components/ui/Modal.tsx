import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "./Button";
import styles from "./Modal.module.css";

export type ModalVariant = "dialog" | "drawer" | "alert";
export type ModalSize = "sm" | "md" | "lg";

export interface ModalProps {
  /** Controls visibility. When `false` the modal unmounts entirely. */
  isOpen: boolean;
  /** Called when the user requests close (overlay click, Escape, close button). */
  onClose: () => void;
  /** Optional title rendered in the header; wires up `aria-labelledby`. */
  title?: string;
  /** Optional description rendered under the title; wires up `aria-describedby`. */
  description?: string;
  /** Visual variant. `alert` uses `role="alertdialog"` and danger emphasis. */
  variant?: ModalVariant;
  /** Width preset — applies to `dialog` variant only. */
  size?: ModalSize;
  /** When `false`, Escape + overlay click do not close the modal. */
  isDismissible?: boolean;
  /** Optional footer slot (typically action buttons). */
  footer?: ReactNode;
  /** Modal body. */
  children: ReactNode;
  /** Optional override for the dialog surface class. */
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  variant = "dialog",
  size = "md",
  isDismissible = true,
  footer,
  children,
  className,
}: ModalProps): JSX.Element | null {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const reactId = useId();
  const titleId = title ? `modal-title-${reactId}` : undefined;
  const descriptionId = description ? `modal-desc-${reactId}` : undefined;

  // Body scroll lock while open.
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Capture previously-focused element + autofocus into modal.
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    // Defer to let portal mount first.
    const t = window.setTimeout(() => {
      const surface = surfaceRef.current;
      if (!surface) return;
      const focusables = surface.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const first = focusables[0];
      if (first) {
        first.focus();
      } else {
        surface.focus();
      }
    }, 0);
    return () => {
      window.clearTimeout(t);
      // Restore focus on unmount.
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === "function") {
        prev.focus();
      }
    };
  }, [isOpen]);

  // Escape key handling.
  useEffect(() => {
    if (!isOpen || !isDismissible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, isDismissible, onClose]);

  // Focus trap — wrap Tab/Shift+Tab inside the modal.
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "Tab") return;
      const surface = surfaceRef.current;
      if (!surface) return;
      const focusables = Array.from(
        surface.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute("data-focus-guard"));
      if (focusables.length === 0) {
        e.preventDefault();
        surface.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !surface.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [],
  );

  const handleOverlayMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDismissible) return;
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [isDismissible, onClose],
  );

  if (!isOpen) return null;

  const isAlert = variant === "alert";
  const isDrawer = variant === "drawer";

  const surfaceClass = cn(
    styles.surface,
    isDrawer && styles.drawer,
    !isDrawer && !isAlert && styles.dialog,
    isAlert && styles.alert,
    !isDrawer && !isAlert && styles[`size_${size}`],
    isClosing && styles.closing,
    className,
  );

  return createPortal(
    <div
      className={cn(styles.scrim, isDrawer && styles.drawerScrim, isClosing && styles.closing)}
      onMouseDown={handleOverlayMouseDown}
      data-state={isClosing ? "closing" : "open"}
    >
      <div
        ref={surfaceRef}
        role={isAlert ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={surfaceClass}
        onKeyDown={handleKeyDown}
        // Surface the closing state for consumers who want to coordinate.
        data-is-closing={isClosing || undefined}
      >
        {(title || description) && (
          <header className={styles.header}>
            <div className={styles.headerText}>
              {title && (
                <h2 id={titleId} className={styles.title}>
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className={styles.description}>
                  {description}
                </p>
              )}
            </div>
            {isDismissible && (
              <Button
                variant="icon"
                size="sm"
                onClick={() => {
                  setIsClosing(true);
                  // Defer the actual onClose to allow the exit animation.
                  window.setTimeout(onClose, 150);
                }}
                aria-label="Close"
                className={styles.closeBtn}
              >
                <X size={16} aria-hidden="true" />
              </Button>
            )}
          </header>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
