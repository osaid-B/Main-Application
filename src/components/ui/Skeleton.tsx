import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import styles from "./Skeleton.module.css";

export type SkeletonVariant = "text" | "circle" | "rect";

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  /** Shape of the placeholder. */
  variant?: SkeletonVariant;
  /** CSS width. Numbers are treated as pixels. */
  width?: string | number;
  /** CSS height. Numbers are treated as pixels. Defaults depend on variant. */
  height?: string | number;
  /** When `variant="text"`, render N stacked shimmer bars. Last bar is shorter. */
  lines?: number;
  /** Round the rect variant. Ignored for `text` / `circle`. */
  rounded?: boolean;
}

function toCssLength(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

function defaultHeight(variant: SkeletonVariant): string {
  if (variant === "circle") return "40px";
  if (variant === "rect") return "100px";
  return "1em";
}

/**
 * Shimmering placeholder for loading content. Presentational only
 * (`aria-hidden`), so always pair with a screen-reader-visible signal
 * elsewhere on the page when loading state is meaningful.
 */
export const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(
  { variant = "text", width = "100%", height, lines = 1, rounded = true, className, style, ...rest },
  ref,
) {
  const resolvedHeight = toCssLength(height) ?? defaultHeight(variant);
  const resolvedWidth = toCssLength(width) ?? "100%";

  if (variant === "text" && lines > 1) {
    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={cn(styles.stack, className)}
        style={style}
        {...rest}
      >
        {Array.from({ length: lines }).map((_, idx) => {
          const isLast = idx === lines - 1;
          const lineStyle: CSSProperties = {
            width: isLast ? "60%" : resolvedWidth,
            height: resolvedHeight,
          };
          return (
            <span
              key={idx}
              className={cn(styles.bar, styles.variant_text)}
              style={lineStyle}
            />
          );
        })}
      </span>
    );
  }

  const mergedStyle: CSSProperties = {
    width: resolvedWidth,
    height: resolvedHeight,
    ...style,
  };

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(
        styles.bar,
        styles[`variant_${variant}`],
        variant === "rect" && rounded && styles.rounded,
        className,
      )}
      style={mergedStyle}
      {...rest}
    />
  );
});
