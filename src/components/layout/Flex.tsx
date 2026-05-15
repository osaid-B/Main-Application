import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import styles from "./Flex.module.css";

export type FlexDirection = "row" | "row-reverse" | "column" | "column-reverse";
export type FlexGap = "xs" | "sm" | "md" | "lg" | "xl" | "none";
export type FlexAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type FlexJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

export interface FlexProps extends HTMLAttributes<HTMLDivElement> {
  /** Render as `inline-flex` instead of `flex`. */
  inline?: boolean;
  /** Flex direction. */
  direction?: FlexDirection;
  /** Gap between children. `none` disables. Maps to `--app-space-2..6`. */
  gap?: FlexGap;
  /** Cross-axis alignment. */
  align?: FlexAlign;
  /** Main-axis distribution. */
  justify?: FlexJustify;
  /** Allow children to wrap onto multiple lines. */
  wrap?: boolean;
  /** Apply `flex: 1` so this element grows to fill its parent. */
  grow?: boolean;
  children?: ReactNode;
}

/**
 * Lower-level flexbox primitive. Exposes more knobs than `Stack`
 * (row-reverse, baseline, evenly, grow). Prefer `Stack` for typical
 * vertical/horizontal layouts.
 */
export const Flex = forwardRef<HTMLDivElement, FlexProps>(function Flex(
  {
    inline = false,
    direction = "row",
    gap = "none",
    align = "stretch",
    justify = "start",
    wrap = false,
    grow = false,
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
        inline ? styles.inline : styles.flex,
        styles[`direction_${direction}`],
        styles[`gap_${gap}`],
        styles[`align_${align}`],
        styles[`justify_${justify}`],
        wrap && styles.wrap,
        grow && styles.grow,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
