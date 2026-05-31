import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, MoreHorizontal } from "lucide-react";

export interface RowAction {
  label: string;
  onClick: () => void;
  variant?: "danger";
  show?: boolean;
  icon?: React.ReactNode;
}

export interface RowActionsProps {
  onView?: () => void;
  primary?: RowAction;
  items?: RowAction[];
}

export function RowActions({ onView, primary, items = [] }: RowActionsProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  function openMenu() {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const visibleItems = items.filter((a) => a.show !== false);
    const menuHeight = visibleItems.length * 40 + 16;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const top =
      spaceBelow < menuHeight && spaceAbove > menuHeight
        ? rect.top - menuHeight + window.scrollY
        : rect.bottom + 4 + window.scrollY;

    const isRTL =
      document.dir === "rtl" || document.documentElement.dir === "rtl";
    const left = isRTL
      ? rect.right - 180 + window.scrollX
      : rect.left + window.scrollX;

    setPos({ top, left });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function handler() {
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handler() {
      setOpen(false);
    }
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [open]);

  const visibleItems = items.filter((a) => a.show !== false);

  return (
    <div className="ra-wrap" onClick={(e) => e.stopPropagation()}>
      {onView && (
        <button type="button" className="ra-eye" onClick={onView} title="عرض">
          <Eye size={13} />
        </button>
      )}

      {primary && (
        <button
          type="button"
          className="ra-primary"
          onClick={(e) => {
            e.stopPropagation();
            primary.onClick();
          }}
        >
          {primary.icon}
          {primary.label}
        </button>
      )}

      {visibleItems.length > 0 && (
        <>
          <button
            ref={btnRef}
            type="button"
            className={`ra-overflow-btn${open ? " ra-overflow-btn--open" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              open ? setOpen(false) : openMenu();
            }}
            title="المزيد"
          >
            <MoreHorizontal size={13} />
          </button>

          {open &&
            createPortal(
              <div
                className="ra-menu"
                style={{
                  position: "fixed",
                  top: pos.top,
                  left: pos.left,
                  zIndex: 9999,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {visibleItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`ra-menu-item${item.variant === "danger" ? " ra-menu-item--danger" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(false);
                      item.onClick();
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>,
              document.body
            )}
        </>
      )}
    </div>
  );
}
