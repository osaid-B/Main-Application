import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import styles from "./Stack.module.css";

export type StackDirection = "vertical" | "horizontal";
export type StackGap = "xs" | "sm" | "md" | "lg" | "xl";
export type StackAlign = "start" | "center" | "end" | "stretch";
export type StackJustify = "start" | "center" | "end" | "between" | "around";

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  /** Stack axis: `vertical` (column) or `horizontal` (row). */
  direction?: StackDirection;
  /** Gap between children. Maps to `--app-space-2..6`. */
  gap?: StackGap;
  /** Cross-axis alignment. */
  align?: StackAlign;
  /** Main-axis distribution. */
  justify?: StackJustify;
  /** Allow children to wrap onto multiple lines. */
  wrap?: boolean;
  children?: ReactNode;
}

/**
 * Opinionated flex-stack with token-based gap. Use `Flex` when you need
 * lower-level control (row-reverse, baseline alignment, grow, etc.).
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  {
    direction = "vertical",
    gap = "md",
    align = "stretch",
    justify = "start",
    wrap = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        styles.stack,
        styles[`direction_${direction}`],
        styles[`gap_${gap}`],
        styles[`align_${align}`],
        styles[`justify_${justify}`],
        wrap && styles.wrap,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
