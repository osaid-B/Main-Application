import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "./Button";
import styles from "./SideDrawer.module.css";

type DrawerSide = "left" | "right";

export interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  side?: DrawerSide;
  closeLabel?: string;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SideDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  side = "left",
  closeLabel = "Close drawer",
  footer,
  children,
  className,
}: SideDrawerProps) {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(false);
  const titleId = useId();
  const subtitleId = useId();
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timeout = window.setTimeout(() => setMounted(false), 180);
    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const timeout = window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(styles.backdrop, visible && styles.visible)}
      data-side={side}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        ref={panelRef}
        className={cn(styles.panel, styles[`side_${side}`], visible && styles.visible, className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.eyebrow}>{title}</span>
            <h2 id={titleId}>{title}</h2>
            {subtitle ? <p id={subtitleId}>{subtitle}</p> : null}
          </div>
          <Button
            variant="icon"
            size="sm"
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className={styles.closeButton}
          >
            <X size={16} aria-hidden="true" />
          </Button>
        </header>

        <div className={styles.body}>{children}</div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </aside>
    </div>,
    document.body,
  );
}
