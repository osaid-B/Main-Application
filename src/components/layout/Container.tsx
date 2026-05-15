import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import styles from "./Container.module.css";

export type ContainerMaxWidth = "sm" | "md" | "lg" | "xl" | "full";
export type ContainerPadding = "none" | "sm" | "md" | "lg";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Max content width.
   * `sm` 640px · `md` 768px · `lg` 1024px · `xl` `var(--app-content-max)` · `full` 100%.
   */
  maxWidth?: ContainerMaxWidth;
  /**
   * Horizontal padding. At viewport <=600px, `sm` is forced regardless of prop.
   */
  padding?: ContainerPadding;
  /** Center horizontally with `margin-inline: auto`. */
  center?: boolean;
  children?: ReactNode;
}

/**
 * Generic max-width content wrapper. Centers content and applies horizontal
 * padding via design tokens. RTL-safe (uses logical `margin-inline`).
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { maxWidth = "xl", padding = "md", center = true, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        styles.container,
        styles[`maxWidth_${maxWidth}`],
        styles[`padding_${padding}`],
        center && styles.center,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
