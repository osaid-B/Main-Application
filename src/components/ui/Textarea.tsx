import {
  forwardRef,
  useId,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "../../lib/cn";
import styles from "./Textarea.module.css";

export type TextareaSize = "sm" | "md" | "lg";
export type TextareaResize = "none" | "vertical" | "horizontal" | "both";

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  /** Padding + base font-size. Min-height scales with rows. */
  size?: TextareaSize;
  /** Optional label rendered above the field. */
  label?: string;
  /** Error message — renders below, applies danger border + `aria-invalid`. */
  error?: string;
  /** Helper text — rendered below when `error` is absent. */
  hint?: string;
  /** Stretch the wrapper to fill its container. */
  fullWidth?: boolean;
  /** Controls the native CSS `resize` axis. */
  resize?: TextareaResize;
  /** Visual disabled state, mirrors native `disabled`. */
  isDisabled?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      size = "md",
      label,
      error,
      hint,
      fullWidth,
      resize = "vertical",
      rows = 4,
      isDisabled,
      disabled,
      id,
      className,
      ...rest
    },
    ref,
  ) {
    const reactId = useId();
    const fieldId = id ?? `textarea-${reactId}`;
    const describedById = error
      ? `${fieldId}-error`
      : hint
        ? `${fieldId}-hint`
        : undefined;

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
          <label htmlFor={fieldId} className={styles.label}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          disabled={effectivelyDisabled}
          aria-invalid={hasError || undefined}
          aria-describedby={describedById}
          className={cn(
            styles.textarea,
            styles[`size_${size}`],
            styles[`resize_${resize}`],
            hasError && styles.textareaError,
            effectivelyDisabled && styles.textareaDisabled,
          )}
          {...rest}
        />
        {error ? (
          <span id={`${fieldId}-error`} className={styles.errorText} role="alert">
            {error}
          </span>
        ) : hint ? (
          <span id={`${fieldId}-hint`} className={styles.hintText}>
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);
