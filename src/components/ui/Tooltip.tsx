import {
  cloneElement,
  isValidElement,
  useCallback,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "../../lib/cn";
import styles from "./Tooltip.module.css";

export type TooltipSide = "top" | "right" | "bottom" | "left";
export type TooltipAlign = "start" | "center" | "end";

export interface TooltipProps {
  /** Tooltip content. */
  content: ReactNode;
  /** Side of the trigger to anchor against. */
  side?: TooltipSide;
  /** Cross-axis alignment along the chosen side. */
  align?: TooltipAlign;
  /** Show delay in milliseconds. */
  delay?: number;
  /** Single React element that activates the tooltip. */
  children: ReactElement;
  /** Disable the tooltip entirely. */
  isDisabled?: boolean;
  /** Extra class for the floating bubble. */
  className?: string;
}

type ChildProps = {
  "aria-describedby"?: string;
  onMouseEnter?: (event: MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (event: MouseEvent<HTMLElement>) => void;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
};

/**
 * Lightweight, no-portal tooltip. Wraps the child in an inline-flex span
 * that hosts the floating bubble via absolute positioning. The trigger
 * itself receives `aria-describedby` so assistive tech announces it.
 */
export function Tooltip({
  content,
  side = "top",
  align = "center",
  delay = 200,
  children,
  isDisabled = false,
  className,
}: TooltipProps) {
  const tooltipId = useId();
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const show = useCallback(() => {
    if (isDisabled) return;
    clearTimer();
    timerRef.current = setTimeout(() => setIsVisible(true), delay);
  }, [delay, isDisabled]);

  const hide = useCallback(() => {
    clearTimer();
    setIsVisible(false);
  }, []);

  if (!isValidElement(children)) {
    return children;
  }

  const childProps = children.props as ChildProps;

  const trigger = cloneElement(children, {
    "aria-describedby": isVisible ? tooltipId : childProps["aria-describedby"],
    onMouseEnter: (event: MouseEvent<HTMLElement>) => {
      childProps.onMouseEnter?.(event);
      show();
    },
    onMouseLeave: (event: MouseEvent<HTMLElement>) => {
      childProps.onMouseLeave?.(event);
      hide();
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      childProps.onFocus?.(event);
      show();
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      childProps.onBlur?.(event);
      hide();
    },
  } as ChildProps);

  return (
    <span className={styles.wrapper}>
      {trigger}
      {!isDisabled && (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            styles.tooltip,
            styles[`side_${side}`],
            styles[`align_${align}`],
            isVisible && styles.visible,
            className,
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
