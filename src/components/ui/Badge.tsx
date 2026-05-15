import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import styles from "./Badge.module.css";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "count";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual tone of the badge. Defaults to `"neutral"`. */
  variant?: BadgeVariant;
  /** Size of the pill. Defaults to `"sm"`. */
  size?: BadgeSize;
  /** Icon node rendered before the label. */
  leftIcon?: ReactNode;
  /** Icon node rendered after the label. */
  rightIcon?: ReactNode;
  children: ReactNode;
}

/**
 * Inline-flex pill used for statuses, tags and counters.
 * Presentational by default — consumers may pass `role="status"` via spread
 * when semantic status communication is required.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    variant = "neutral",
    size = "sm",
    leftIcon,
    rightIcon,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        styles.badge,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        className,
      )}
      {...rest}
    >
      {leftIcon && (
        <span className={styles.icon} aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {children}
      {rightIcon && (
        <span className={styles.icon} aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </span>
  );
});
