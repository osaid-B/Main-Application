import {
  forwardRef,
  useId,
  type SelectHTMLAttributes,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";
import styles from "./Select.module.css";

export type SelectSize = "sm" | "md" | "lg";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Control height. Matches the shared form-control scale. */
  size?: SelectSize;
  /** Optional label rendered above the select. */
  label?: string;
  /** Error message — renders below, applies danger border + `aria-invalid`. */
  error?: string;
  /** Helper text — rendered below when `error` is absent. */
  hint?: string;
  /** Options to render. Use `disabled` to grey out individual entries. */
  options: SelectOption[];
  /** Rendered as a disabled first option with empty value. */
  placeholder?: string;
  /** Node rendered inside the field on the inline-start edge. */
  leftIcon?: ReactNode;
  /** Stretch the wrapper to fill its container. */
  fullWidth?: boolean;
  /** Visual disabled state, mirrors native `disabled`. */
  isDisabled?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    size = "md",
    label,
    error,
    hint,
    options,
    placeholder,
    leftIcon,
    fullWidth,
    isDisabled,
    disabled,
    id,
    className,
    value,
    defaultValue,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const selectId = id ?? `select-${reactId}`;
  const describedById = error
    ? `${selectId}-error`
    : hint
      ? `${selectId}-hint`
      : undefined;

  const hasError = Boolean(error);
  const effectivelyDisabled = Boolean(disabled || isDisabled);

  // If a placeholder is provided and no value is set, ensure the placeholder is shown.
  const resolvedDefaultValue =
    placeholder && value === undefined && defaultValue === undefined
      ? ""
      : defaultValue;

  return (
    <div
      className={cn(
        styles.wrapper,
        fullWidth && styles.fullWidth,
        className,
      )}
    >
      {label && (
        <label htmlFor={selectId} className={styles.label}>
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
        <select
          ref={ref}
          id={selectId}
          disabled={effectivelyDisabled}
          aria-invalid={hasError || undefined}
          aria-describedby={describedById}
          value={value}
          defaultValue={resolvedDefaultValue}
          className={cn(
            styles.select,
            leftIcon && styles.selectWithStart,
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className={cn(styles.icon, styles.chevron)} aria-hidden="true">
          <ChevronDown size={16} />
        </span>
      </div>
      {error ? (
        <span id={`${selectId}-error`} className={styles.errorText} role="alert">
          {error}
        </span>
      ) : hint ? (
        <span id={`${selectId}-hint`} className={styles.hintText}>
          {hint}
        </span>
      ) : null}
    </div>
  );
});
