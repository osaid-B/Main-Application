import { cn } from "../../lib/cn";
import styles from "./ButtonGroup.module.css";

export interface ButtonGroupOption<T extends string> {
  value: T;
  label: string;
  /** Optional small description rendered under the label. */
  hint?: string;
  disabled?: boolean;
}

export interface ButtonGroupProps<T extends string> {
  /** Group label (rendered above the options). */
  label?: string;
  /** Available choices. */
  options: ReadonlyArray<ButtonGroupOption<T>>;
  /** Selected value. */
  value: T;
  /** Change handler. */
  onChange: (value: T) => void;
  /** Layout density. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Radio-style segmented control. Used for payment terms, currency,
 * classification, etc. — keyboard-navigable with native button focus.
 */
export function ButtonGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  size = "md",
  className,
}: ButtonGroupProps<T>) {
  return (
    <div className={cn(styles.wrap, className)}>
      {label && <span className={styles.groupLabel}>{label}</span>}
      <div className={cn(styles.group, styles[`size_${size}`])} role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={opt.disabled}
              className={cn(styles.option, isActive && styles.active)}
              onClick={() => onChange(opt.value)}
            >
              <span className={styles.optLabel}>{opt.label}</span>
              {opt.hint && <span className={styles.optHint}>{opt.hint}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
