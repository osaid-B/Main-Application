import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/cn";
import styles from "./Input.module.css";

export type InputVariant =
  | "text"
  | "email"
  | "password"
  | "search"
  | "date"
  | "number"
  | "tel";
export type InputSize = "sm" | "md" | "lg";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  /** Visual + semantic input type. `password` adds a show/hide toggle. */
  variant?: InputVariant;
  /** Control height. Matches the shared form-control scale. */
  size?: InputSize;
  /** Optional label rendered above the input. */
  label?: string;
  /** Error message — renders below, applies danger border + `aria-invalid`. */
  error?: string;
  /** Helper text — rendered below when `error` is absent. */
  hint?: string;
  /** Node rendered inside the field on the inline-start edge. */
  leftIcon?: ReactNode;
  /** Node rendered inside the field on the inline-end edge. Ignored when `variant="password"`. */
  rightIcon?: ReactNode;
  /** Stretch the wrapper to fill its container. */
  fullWidth?: boolean;
  /** Show a subtle disabled visual + block interaction. Mirrors native `disabled`. */
  isDisabled?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    variant = "text",
    size = "md",
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    fullWidth,
    isDisabled,
    disabled,
    id,
    className,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? `input-${reactId}`;
  const describedById = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = variant === "password";
  const resolvedType = isPassword
    ? isPasswordVisible
      ? "text"
      : "password"
    : variant;
  const hasError = Boolean(error);
  const effectivelyDisabled = Boolean(disabled || isDisabled);

  return (
    <div
      className={cn(
        styles.wrapper,
        fullWidth && styles.fullWidth,
        className,
      )}
    >
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div
        className={cn(
          styles.field,
          styles[`size_${size}`],
          hasError && styles.fieldError,
          effectivelyDisabled && styles.fieldDisabled,
        )}
      >
        {leftIcon && (
          <span className={cn(styles.icon, styles.iconStart)} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          disabled={effectivelyDisabled}
          aria-invalid={hasError || undefined}
          aria-describedby={describedById}
          className={cn(
            styles.input,
            leftIcon && styles.inputWithStart,
            (rightIcon || isPassword) && styles.inputWithEnd,
          )}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setIsPasswordVisible((v) => !v)}
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            aria-pressed={isPasswordVisible}
            disabled={effectivelyDisabled}
            className={cn(styles.iconEnd, styles.toggle)}
          >
            {isPasswordVisible ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
          </button>
        ) : (
          rightIcon && (
            <span className={cn(styles.icon, styles.iconEnd)} aria-hidden="true">
              {rightIcon}
            </span>
          )
        )}
      </div>
      {error ? (
        <span id={`${inputId}-error`} className={styles.errorText} role="alert">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className={styles.hintText}>
          {hint}
        </span>
      ) : null}
    </div>
  );
});
