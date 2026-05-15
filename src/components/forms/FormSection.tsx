import { useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";
import styles from "./FormSection.module.css";

export interface FormSectionProps {
  /** Step number (1, 2, 3…) shown in the circle. */
  number: number;
  /** Section title. */
  title: string;
  /** Optional subtitle / helper text. */
  subtitle?: string;
  /** "3 / 4 completed" progress hint. */
  progress?: string;
  /** Mark section as complete (turns the circle green w/ checkmark). */
  isComplete?: boolean;
  /** Allow collapsing the body. */
  collapsible?: boolean;
  /** Initial collapsed state when `collapsible`. */
  defaultCollapsed?: boolean;
  /** Body content. */
  children: ReactNode;
  className?: string;
}

/**
 * Numbered, optionally collapsible form section with a completion indicator.
 * Used by the Progressive Disclosure Add-Customer / Add-Supplier forms.
 */
export function FormSection({
  number,
  title,
  subtitle,
  progress,
  isComplete = false,
  collapsible = false,
  defaultCollapsed = false,
  children,
  className,
}: FormSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const open = !collapsible || !collapsed;

  return (
    <section className={cn(styles.section, isComplete && styles.complete, className)}>
      <header className={styles.header}>
        <span className={cn(styles.bubble, isComplete && styles.bubbleComplete)} aria-hidden>
          {isComplete ? <Check size={14} /> : number}
        </span>
        <div className={styles.titleBlock}>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {progress && <span className={styles.progress}>{progress}</span>}
        {collapsible && (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={cn(styles.toggle, !collapsed && styles.toggleOpen)}
            aria-label={collapsed ? "Expand section" : "Collapse section"}
            aria-expanded={!collapsed}
          >
            <ChevronDown size={14} />
          </button>
        )}
      </header>
      {open && <div className={styles.body}>{children}</div>}
    </section>
  );
}
