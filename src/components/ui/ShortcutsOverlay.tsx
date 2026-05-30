import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Compass,
  FilePlus,
  LogOut,
  Moon,
  Settings2,
  X,
} from "lucide-react";
import type { ShortcutDef } from "../../hooks/useKeyboardShortcuts";
import { useSettings } from "../../context/SettingsContext";
import "./ShortcutsOverlay.css";

type Props = {
  shortcuts: ShortcutDef[];
  onClose: () => void;
  isDark?: boolean;
};

const GROUP_ORDER = ["general", "nav", "create", "appearance", "system"];

export default function ShortcutsOverlay({ shortcuts, onClose, isDark }: Props) {
  const { isArabic } = useSettings();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const groupMeta: Record<string, { label: string; icon: React.ReactNode }> = {
    nav: {
      label: isArabic ? "التنقل" : "Navigate",
      icon: <Compass size={13} />,
    },
    create: {
      label: isArabic ? "الإنشاء" : "Create",
      icon: <FilePlus size={13} />,
    },
    general: {
      label: isArabic ? "عام" : "General",
      icon: <Settings2 size={13} />,
    },
    appearance: {
      label: isArabic ? "المظهر" : "Appearance",
      icon: <Moon size={13} />,
    },
    system: {
      label: isArabic ? "النظام" : "System",
      icon: <LogOut size={13} />,
    },
  };

  const grouped = GROUP_ORDER.map((groupKey) => ({
    key: groupKey,
    meta: groupMeta[groupKey],
    items: shortcuts.filter((s) => (s.group ?? "general") === groupKey),
  })).filter((g) => g.items.length > 0);

  return createPortal(
    <>
      <button
        type="button"
        className="shortcuts-overlay-backdrop"
        onClick={onClose}
        aria-label={isArabic ? "إغلاق الاختصارات" : "Close shortcuts"}
      />
      <div
        className="shortcuts-overlay-panel"
        role="dialog"
        aria-label={isArabic ? "اختصارات لوحة المفاتيح" : "Keyboard shortcuts"}
        aria-modal="true"
      >
        <div className="shortcuts-overlay-head">
          <div className="shortcuts-overlay-title">
            <strong>{isArabic ? "اختصارات لوحة المفاتيح" : "Keyboard Shortcuts"}</strong>
            {isDark !== undefined && (
              <span className="shortcuts-theme-badge">
                {isDark
                  ? (isArabic ? "الوضع الداكن" : "Dark mode")
                  : (isArabic ? "الوضع الفاتح" : "Light mode")}
              </span>
            )}
          </div>
          <button
            type="button"
            className="shortcuts-close-btn"
            onClick={onClose}
            aria-label={isArabic ? "إغلاق" : "Close"}
          >
            <X size={15} />
            <kbd>Esc</kbd>
          </button>
        </div>

        <div className="shortcuts-overlay-body">
          {grouped.map((group) => (
            <div key={group.key} className="shortcuts-group">
              <div className="shortcuts-group-label">
                {group.meta.icon}
                <span>{group.meta.label}</span>
              </div>
              <div className="shortcuts-list">
                {group.items.map((s) => (
                  <div
                    key={s.keys}
                    className={`shortcuts-row ${group.key === "system" ? "shortcuts-row--danger" : ""}`}
                  >
                    <span className="shortcuts-desc">{s.description}</span>
                    <div className="shortcuts-keys">
                      {s.keys.split(" ").map((k, i) => (
                        <kbd key={i}>{k}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}
