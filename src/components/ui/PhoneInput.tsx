import { useId, useState, type KeyboardEvent } from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/cn";
import { validatePhone, sanitizePhoneInput } from "../../utils/phoneValidation";
import styles from "./PhoneInput.module.css";

export interface PhoneInputProps {
  value: string;
  onChange: (digits: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  /** External error — overrides internal validation (used for submit-time errors). */
  error?: string;
  className?: string;
}

/**
 * Palestinian phone number input. Accepts 059/056 (10 digits) or 09 (9 digits).
 * Blocks non-numeric keys, shows formatted number on blur, validates on blur.
 */
export function PhoneInput({
  value,
  onChange,
  label,
  required,
  disabled,
  error: externalError,
  className,
}: PhoneInputProps) {
  const id = useId();
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);

  const validation = validatePhone(value);

  // Show validation state only after first blur, or when external error is passed
  const showValidation = touched || Boolean(externalError);
  const activeError = externalError ?? (showValidation && !validation.valid && value ? validation.error : undefined);
  const isValid = showValidation && validation.valid;

  // Display: raw digits while focused, formatted when blurred and valid
  const displayValue = focused ? value : (isValid ? validation.formatted : value);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const allowed = [
      "0","1","2","3","4","5","6","7","8","9",
      "Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End",
    ];
    // Allow browser shortcuts (copy/paste/select-all)
    if (e.ctrlKey || e.metaKey) return;
    if (!allowed.includes(e.key)) {
      e.preventDefault();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = sanitizePhoneInput(e.target.value);
    onChange(digits);
  }

  function handleFocus() {
    setFocused(true);
  }

  function handleBlur() {
    setFocused(false);
    setTouched(true);
  }

  return (
    <div className={cn(styles.wrapper, className)}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden>*</span>}
        </label>
      )}
      <div
        className={cn(
          styles.field,
          isValid && styles.fieldValid,
          activeError && styles.fieldError,
          disabled && styles.fieldDisabled,
        )}
      >
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="059-XXX-XXXX"
          aria-invalid={Boolean(activeError) || undefined}
          aria-describedby={activeError ? `${id}-error` : undefined}
          aria-required={required}
          className={styles.input}
          autoComplete="tel"
        />
        {isValid && !focused && (
          <span className={styles.validIcon} aria-hidden>
            <Check size={14} />
          </span>
        )}
      </div>
      {activeError && (
        <span id={`${id}-error`} className={styles.errorText} role="alert">
          {activeError}
        </span>
      )}
    </div>
  );
}
