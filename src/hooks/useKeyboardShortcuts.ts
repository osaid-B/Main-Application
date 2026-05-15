import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

type ShortcutHandler = () => void;

export type ShortcutGroup = "nav" | "create" | "general" | "appearance" | "system";

export type ShortcutDef = {
  keys: string;
  description: string;
  action: ShortcutHandler;
  group?: ShortcutGroup;
};

const GO_TIMEOUT = 800;

export function useKeyboardShortcuts(
  onToggleHelp: () => void,
  onFocusSearch: () => void,
  onToggleDark: () => void,
  onLogout: () => void
): ShortcutDef[] {
  const navigate = useNavigate();
  const pendingG = useRef(false);
  const pendingN = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetSequence = () => {
    pendingG.current = false;
    pendingN.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const arm = (flag: { current: boolean }) => {
    resetSequence();
    flag.current = true;
    timerRef.current = setTimeout(resetSequence, GO_TIMEOUT);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName ?? "";
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement)?.isContentEditable;

      // Ctrl/Cmd + K → focus search
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "k") {
        e.preventDefault();
        onFocusSearch();
        resetSequence();
        return;
      }

      // Ctrl/Cmd + Shift + D → toggle dark mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        onToggleDark();
        resetSequence();
        return;
      }

      // Ctrl/Cmd + Shift + L → logout (confirm)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        onLogout();
        resetSequence();
        return;
      }

      // ? → toggle shortcuts help (only outside inputs)
      if (!isEditable && e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onToggleHelp();
        resetSequence();
        return;
      }

      // Escape → close help / clear sequence
      if (e.key === "Escape") {
        resetSequence();
        return;
      }

      if (isEditable) return;

      // ── G + ? navigation sequences ─────────────────────────────────────
      if (pendingG.current) {
        resetSequence();
        switch (e.key.toLowerCase()) {
          case "h": navigate("/dashboard"); break;
          case "c": navigate("/customers"); break;
          case "p": navigate("/products"); break;
          case "o": navigate("/purchases"); break;
          case "s": navigate("/suppliers"); break;
          case "i": navigate("/invoices"); break;
          case "y": navigate("/payments"); break;
          case "t": navigate("/treasury"); break;
          case "e": navigate("/employees"); break;
          case "d": navigate("/data-import"); break;
          case ",": navigate("/settings"); break;
        }
        return;
      }

      // ── N + ? create sequences ──────────────────────────────────────────
      if (pendingN.current) {
        resetSequence();
        switch (e.key.toLowerCase()) {
          case "i": navigate("/invoices"); break;
          case "p": navigate("/payments"); break;
          case "o": navigate("/purchases"); break;
          case "c": navigate("/customers"); break;
        }
        return;
      }

      if (e.key.toLowerCase() === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        arm(pendingG);
        return;
      }

      if (e.key.toLowerCase() === "n" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        arm(pendingN);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      resetSequence();
    };
  }, [navigate, onFocusSearch, onToggleHelp, onToggleDark, onLogout]);

  return [
    { keys: "Ctrl K",     description: "Focus search",      action: onFocusSearch, group: "general" },
    { keys: "?",          description: "Show this help",     action: onToggleHelp,  group: "general" },
    { keys: "G H",        description: "Dashboard",          action: () => navigate("/dashboard"),   group: "nav" },
    { keys: "G C",        description: "Customers",          action: () => navigate("/customers"),   group: "nav" },
    { keys: "G P",        description: "Products",           action: () => navigate("/products"),    group: "nav" },
    { keys: "G O",        description: "Purchases",          action: () => navigate("/purchases"),   group: "nav" },
    { keys: "G S",        description: "Suppliers",          action: () => navigate("/suppliers"),   group: "nav" },
    { keys: "G I",        description: "Invoices",           action: () => navigate("/invoices"),    group: "nav" },
    { keys: "G Y",        description: "Payments",           action: () => navigate("/payments"),    group: "nav" },
    { keys: "G T",        description: "Treasury",           action: () => navigate("/treasury"),    group: "nav" },
    { keys: "G E",        description: "Employees",          action: () => navigate("/employees"),   group: "nav" },
    { keys: "G ,",        description: "Settings",           action: () => navigate("/settings"),    group: "nav" },
    { keys: "N I",        description: "New Invoice",        action: () => navigate("/invoices"),    group: "create" },
    { keys: "N P",        description: "New Payment",        action: () => navigate("/payments"),    group: "create" },
    { keys: "N O",        description: "New Purchase",       action: () => navigate("/purchases"),   group: "create" },
    { keys: "N C",        description: "New Customer",       action: () => navigate("/customers"),   group: "create" },
    { keys: "Ctrl ⇧ D",  description: "Toggle dark mode",   action: onToggleDark,  group: "appearance" },
    { keys: "Ctrl ⇧ L",  description: "Sign out",           action: onLogout,      group: "system" },
  ];
}
