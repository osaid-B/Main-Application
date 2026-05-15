import type { ComponentType, ReactNode } from "react";
import { cn } from "../../lib/cn";
import styles from "./RadioCardGroup.module.css";

export interface RadioCardOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: ComponentType<{ size?: number }>;
  badge?: ReactNode;
  disabled?: boolean;
}

export interface RadioCardGroupProps<T extends string> {
  label?: string;
  options: ReadonlyArray<RadioCardOption<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Card-style radio selector. Each option renders a full card with an
 * icon, label, and optional description — used for "Type" selectors
 * (individual / company / institution, etc.).
 */
export function RadioCardGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: RadioCardGroupProps<T>) {
  return (
    <div className={cn(styles.wrap, className)}>
      {label && <span className={styles.groupLabel}>{label}</span>}
      <div className={styles.grid} role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={opt.disabled}
              className={cn(styles.card, isActive && styles.active)}
              onClick={() => onChange(opt.value)}
            >
              {Icon && (
                <span className={styles.iconWrap}>
                  <Icon size={18} />
                </span>
              )}
              <div className={styles.body}>
                <span className={styles.label}>
                  {opt.label}
                  {opt.badge && <span className={styles.badge}>{opt.badge}</span>}
                </span>
                {opt.description && <span className={styles.description}>{opt.description}</span>}
              </div>
              <span className={cn(styles.dot, isActive && styles.dotActive)} aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}
