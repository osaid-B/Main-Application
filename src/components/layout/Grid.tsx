import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import styles from "./Grid.module.css";

export type GridCols = 1 | 2 | 3 | 4 | 6 | 12;
export type GridGap = "xs" | "sm" | "md" | "lg" | "xl";
export type GridAlignItems = "start" | "center" | "end" | "stretch";

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of equal-width columns. */
  cols?: GridCols;
  /** Gap between cells. Maps to `--app-space-2..6`. */
  gap?: GridGap;
  /**
   * When true, collapse to 2 cols at `<=900px` and 1 col at `<=600px`.
   * If `cols` is already `<=2`, the tablet step is skipped.
   */
  responsive?: boolean;
  /** Cross-axis alignment for grid items. */
  alignItems?: GridAlignItems;
  children?: ReactNode;
}

/**
 * Equal-column CSS grid wrapper with token-based gaps and an opt-in
 * responsive collapse (tablet → 2 cols, mobile → 1 col).
 */
export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  {
    cols = 12,
    gap = "md",
    responsive = true,
    alignItems = "stretch",
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
        styles.grid,
        styles[`cols_${cols}`],
        styles[`gap_${gap}`],
        styles[`align_${alignItems}`],
        responsive && styles.responsive,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
