import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import styles from "./Spinner.module.css";

export type SpinnerSize = "sm" | "md" | "lg";
export type SpinnerTone = "primary" | "neutral" | "inverse";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual diameter of the ring. `sm` 14px · `md` 20px · `lg` 32px. */
  size?: SpinnerSize;
  /** Color tone of the ring. Use `inverse` on dark backgrounds. */
  tone?: SpinnerTone;
  /** Screen-reader-only label announced by assistive tech. */
  label?: string;
}

/**
 * Circular spinning indicator. Border-based, same approach as the
 * Button loading state. Renders an sr-only label for accessibility.
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = "md", tone = "primary", label = "Loading…", className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn(styles.root, styles[`size_${size}`], styles[`tone_${tone}`], className)}
      {...rest}
    >
      <span className={styles.ring} aria-hidden="true" />
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
});
