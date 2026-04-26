import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import "./OverflowContent.css";

type OverflowMetaItem = {
  label: string;
  value: string;
};

type OverflowContentProps = {
  preview: string;
  title: string;
  content: string;
  subtitle?: string;
  meta?: OverflowMetaItem[];
  buttonLabel?: string;
  className?: string;
};

function clampPreview(value: string) {
  if (!value.trim()) return "No details";
  return value.length > 72 ? `${value.slice(0, 72)}...` : value;
}

export default function OverflowContent({
  preview,
  title,
  content,
  subtitle,
  meta = [],
  buttonLabel,
  className = "",
}: OverflowContentProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 340 });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : false;

  const previewText = useMemo(() => clampPreview(preview), [preview]);

  useEffect(() => {
    if (!open || !triggerRef.current || isMobile) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const width = Math.min(360, Math.max(280, rect.width + 80));
    const nextLeft = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    const nextTop = rect.bottom + 10;

    setPosition({ top: nextTop, left: nextLeft, width });
  }, [open, isMobile]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const handleViewportChange = () => setOpen(false);

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`overflow-content-trigger ${className}`.trim()}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        aria-expanded={open}
        aria-label={buttonLabel ?? `Open ${title}`}
      >
        <span className="overflow-content-preview">{previewText}</span>
        <Info size={14} />
      </button>

      {open
        ? createPortal(
            <>
              {isMobile ? <button type="button" className="overflow-content-backdrop" onClick={() => setOpen(false)} /> : null}

              <div
                ref={panelRef}
                className={`overflow-content-panel ${isMobile ? "mobile" : "desktop"}`}
                style={isMobile ? undefined : position}
                role="dialog"
                aria-modal={isMobile}
              >
                <div className="overflow-content-head">
                  <div>
                    <strong>{title}</strong>
                    {subtitle ? <span>{subtitle}</span> : null}
                  </div>

                  <button
                    type="button"
                    className="overflow-content-close"
                    onClick={() => setOpen(false)}
                    aria-label="Close details"
                  >
                    <X size={15} />
                  </button>
                </div>

                {meta.length > 0 ? (
                  <div className="overflow-content-meta">
                    {meta.map((item) => (
                      <div key={`${item.label}-${item.value}`}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="overflow-content-body">
                  <p>{content.trim() || "No details recorded."}</p>
                </div>
              </div>
            </>,
            document.body
          )
        : null}
    </>
  );
}
