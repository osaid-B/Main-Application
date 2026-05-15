import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import styles from "./TagInput.module.css";

export interface TagInputProps {
  label?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  hint?: string;
  /** Optional list of suggestions shown as quick-add chips. */
  suggestions?: string[];
  /** Max number of tags allowed. */
  max?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Multi-tag chip input. Accepts free-form values added with Enter / comma,
 * removable with the chip's X button. Optional suggestion chips appear
 * below for one-click addition.
 */
export function TagInput({
  label,
  value,
  onChange,
  placeholder = "Type and press Enter…",
  hint,
  suggestions,
  max,
  disabled,
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (value.includes(tag)) return;
    if (max != null && value.length >= max) return;
    onChange([...value, tag]);
    setDraft("");
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div className={cn(styles.wrap, className)}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={cn(styles.field, disabled && styles.disabled)}>
        {value.map((tag) => (
          <span key={tag} className={styles.chip}>
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className={styles.chipRemove}
              disabled={disabled}
              aria-label={`Remove ${tag}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => commit(draft)}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={disabled}
          className={styles.input}
          aria-label={label ?? "Add tag"}
        />
      </div>
      {hint && <span className={styles.hint}>{hint}</span>}
      {suggestions && suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions
            .filter((s) => !value.includes(s))
            .map((s) => (
              <button
                key={s}
                type="button"
                className={styles.suggestion}
                onClick={() => commit(s)}
                disabled={disabled}
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
