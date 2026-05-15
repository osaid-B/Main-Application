import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { Container, type ContainerMaxWidth, type ContainerPadding } from "./Container";
import styles from "./PageWrapper.module.css";

export type PageWrapperState = "success" | "loading" | "error" | "empty";

export interface PageWrapperErrorInfo {
  message: string;
  onRetry?: () => void;
}

export interface PageWrapperEmptyState {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export interface PageWrapperProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Current view state. Body section adapts accordingly. */
  state?: PageWrapperState;
  /** Page heading (uses global `.page-title`). */
  title?: string;
  /** Page sub-heading (uses global `.page-subtitle`). */
  subtitle?: string;
  /** Right-aligned action slot (e.g., primary CTAs). */
  actions?: ReactNode;
  /** Payload rendered when `state === "error"`. */
  error?: PageWrapperErrorInfo;
  /** Payload rendered when `state === "empty"`. */
  emptyState?: PageWrapperEmptyState;
  /** Shortcut for `state="loading"`. When true, overrides `state`. */
  isLoading?: boolean;
  /** Rendered when `state === "success"`. */
  children?: ReactNode;
  /** Forwarded to the inner Container. */
  maxWidth?: ContainerMaxWidth;
  /** Forwarded to the inner Container. */
  padding?: ContainerPadding;
}

/**
 * Standard page chrome: title row + state-aware body.
 * Wraps content in a `Container` and centers loading / error / empty
 * states with a comfortable min-height.
 */
export const PageWrapper = forwardRef<HTMLDivElement, PageWrapperProps>(function PageWrapper(
  {
    state = "success",
    title,
    subtitle,
    actions,
    error,
    emptyState,
    isLoading = false,
    maxWidth = "xl",
    padding = "md",
    className,
    children,
    ...rest
  },
  ref,
) {
  const effectiveState: PageWrapperState = isLoading ? "loading" : state;
  const hasHeader = Boolean(title || subtitle || actions);

  return (
    <div ref={ref} className={cn(styles.page, className)} {...rest}>
      <Container maxWidth={maxWidth} padding={padding}>
        {hasHeader && (
          <header className={styles.header}>
            <div className={styles.titleBlock}>
              {title && <h1 className="page-title">{title}</h1>}
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className={styles.actions}>{actions}</div>}
          </header>
        )}

        <div
          className={cn(
            styles.body,
            effectiveState !== "success" && styles.bodyCentered,
          )}
        >
          {effectiveState === "loading" && (
            <div className={styles.stateBlock} role="status" aria-live="polite">
              <Spinner size="lg" label="Loading…" />
              <p className={styles.stateText}>Loading…</p>
            </div>
          )}

          {effectiveState === "error" && (
            <div
              className={cn(styles.stateBlock, styles.stateError)}
              role="alert"
            >
              <span className={styles.stateIcon} aria-hidden="true">
                <AlertCircle size={32} />
              </span>
              <p className={styles.stateText}>
                {error?.message ?? "Something went wrong."}
              </p>
              {error?.onRetry && (
                <Button variant="primary" size="md" onClick={error.onRetry}>
                  Retry
                </Button>
              )}
            </div>
          )}

          {effectiveState === "empty" && emptyState && (
            <div className={styles.stateBlock}>
              {emptyState.icon && (
                <span className={styles.stateIcon} aria-hidden="true">
                  {emptyState.icon}
                </span>
              )}
              <p className={styles.stateTitle}>{emptyState.title}</p>
              {emptyState.description && (
                <p className={styles.stateText}>{emptyState.description}</p>
              )}
              {emptyState.action && (
                <div className={styles.stateAction}>{emptyState.action}</div>
              )}
            </div>
          )}

          {effectiveState === "success" && children}
        </div>
      </Container>
    </div>
  );
});
