import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, MapPin, Plus, Search } from "lucide-react";
import { cn } from "../../lib/cn";
import styles from "./SmartLocationPicker.module.css";

export interface SmartLocationPickerProps {
  label?: string;
  /** Available top-level locations (e.g., governorates). */
  options: string[];
  /** Currently selected value. */
  value: string;
  onChange: (value: string) => void;
  /** Disabled state — e.g., a child picker waiting for parent selection. */
  disabled?: boolean;
  placeholder?: string;
  /** Allow inline "Add new …" entry when no match. */
  allowAddNew?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
}

/**
 * Searchable single-select with keyboard navigation + optional "add new"
 * inline entry. Two of these can be stacked to form a cascading picker
 * (governorate -> city) — wire the second one's `options` to the first's
 * value.
 */
export function SmartLocationPicker({
  label,
  options,
  value,
  onChange,
  disabled,
  placeholder = "Select…",
  allowAddNew = false,
  required,
  error,
  hint,
  className,
}: SmartLocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Focus search when opening.
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const select = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  const noMatch = open && query && filtered.length === 0;

  return (
    <div className={cn(styles.wrap, className)} ref={wrapRef}>
      {label && (
        <span className={styles.label}>
          {label}{required && <span className={styles.required}>*</span>}
        </span>
      )}
      <button
        type="button"
        className={cn(styles.trigger, open && styles.triggerOpen, error && styles.triggerError)}
        onClick={() => { if (!disabled) { if (open) setQuery(""); setOpen((o) => !o); } }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <MapPin size={14} aria-hidden className={styles.triggerIcon} />
        <span className={cn(styles.triggerValue, !value && styles.triggerPlaceholder)}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} aria-hidden className={cn(styles.triggerChevron, open && styles.chevronOpen)} />
      </button>

      {open && (
        <div className={styles.menu} role="listbox">
          <div className={styles.searchRow}>
            <Search size={13} aria-hidden />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
              placeholder="Search…"
              className={styles.searchInput}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, filtered.length - 1)); }
                else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
                else if (e.key === "Enter")  { e.preventDefault(); if (filtered[activeIndex]) select(filtered[activeIndex]); }
                else if (e.key === "Escape") { setOpen(false); setQuery(""); }
              }}
            />
          </div>
          <ul className={styles.list}>
            {filtered.map((opt, i) => (
              <li key={opt}>
                <button
                  type="button"
                  className={cn(styles.option, i === activeIndex && styles.optionActive, opt === value && styles.optionSelected)}
                  onClick={() => select(opt)}
                  onMouseEnter={() => setActiveIndex(i)}
                  role="option"
                  aria-selected={opt === value}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
          {noMatch && (
            <div className={styles.empty}>
              <p>No match for "{query}"</p>
              {allowAddNew && (
                <button type="button" className={styles.addNew} onClick={() => select(query.trim())}>
                  <Plus size={12} /> Add "{query.trim()}"
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {error ? (
        <span className={styles.error}>{error}</span>
      ) : hint ? (
        <span className={styles.hint}>{hint}</span>
      ) : null}
    </div>
  );
}
