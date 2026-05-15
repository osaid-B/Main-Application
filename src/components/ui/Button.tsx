import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "danger" | "icon" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Show a spinner and disable the button. */
  isLoading?: boolean;
  /** Icon node rendered before the label. Ignored when `variant="icon"`. */
  leftIcon?: ReactNode;
  /** Icon node rendered after the label. Ignored when `variant="icon"`. */
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    type = "button",
    className,
    children,
    ...rest
  },
  ref,
) {
  const iconOnly = variant === "icon";

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        styles.button,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        className,
      )}
      {...rest}
    >
      {isLoading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        !iconOnly &&
        leftIcon && (
          <span className={styles.icon} aria-hidden="true">
            {leftIcon}
          </span>
        )
      )}
      {children}
      {!isLoading && !iconOnly && rightIcon && (
        <span className={styles.icon} aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
});
