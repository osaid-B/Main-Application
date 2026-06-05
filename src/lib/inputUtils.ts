import type React from "react";

/** Blocks non-numeric keyboard input. Spread onto any numeric <input>. */
export const numericInputProps = {
  inputMode: "numeric" as const,
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey) return;
    const allowed = [
      "Backspace", "Delete", "Tab", "Enter", "Escape",
      "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
      "Home", "End", ".", ",",
    ];
    if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  },
};

/** Returns props for a Palestinian phone number input (digits only, max 10). */
export function makePhoneInputProps(onChange: (digits: string) => void) {
  return {
    inputMode: "numeric" as const,
    maxLength: 10,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.ctrlKey || e.metaKey) return;
      const allowed = ["Backspace", "Delete", "Tab", "Enter", "ArrowLeft", "ArrowRight", "Home", "End"];
      if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value.replace(/\D/g, "").slice(0, 10));
    },
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      onChange(e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 10));
    },
  };
}

/** Returns true when the phone number matches a Palestinian mobile/landline pattern. */
export function isValidPalestinianPhone(phone: string): boolean {
  const d = phone.replace(/\D/g, "");
  return /^0(59|56|58|57|55|54|53|52|50|2|8|9)\d{7,8}$/.test(d);
}
