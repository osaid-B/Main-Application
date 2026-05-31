import { useEffect, useRef, useState } from "react";
import { Eye, MoreHorizontal } from "lucide-react";

export interface RowAction {
  label: string;
  onClick: () => void;
  variant?: "danger";
}

export interface RowActionsProps {
  onView?: () => void;
  primary?: RowAction;
  items?: RowAction[];
}

export function RowActions({ onView, primary, items = [] }: RowActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className={`ra-wrap${open ? " ra-wrap--open" : ""}`}>
      {onView && (
        <button type="button" className="ra-eye" onClick={onView} title="عرض">
          <Eye size={13} />
        </button>
      )}
      {primary && (
        <button type="button" className="ra-primary" onClick={primary.onClick}>
          {primary.label}
        </button>
      )}
      {items.length > 0 && (
        <div className="ra-overflow">
          <button
            type="button"
            className="ra-overflow-btn"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
          >
            <MoreHorizontal size={13} />
          </button>
          {open && (
            <div className="ra-menu">
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`ra-menu-item${item.variant === "danger" ? " ra-menu-item--danger" : ""}`}
                  onClick={() => {
                    setOpen(false);
                    item.onClick();
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
