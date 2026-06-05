import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  isOpen,
  itemName,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;
  return (
    <DeleteConfirmDialogContent
      itemName={itemName}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

function DeleteConfirmDialogContent({
  itemName,
  onConfirm,
  onCancel,
}: {
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isValid = pin === "123";

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
      if (e.key === "Enter" && isValid) {
        e.preventDefault();
        onConfirm();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isValid, onCancel, onConfirm]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onCancel();
  }

  function handleCancelClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    onCancel();
  }

  function handleConfirmClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (isValid) onConfirm();
  }

  const pinBorderColor =
    pin.length === 0 ? "#E2E8F0" :
    isValid ? "#16A34A" :
    pin.length >= 3 ? "#DC2626" : "#E2E8F0";

  const pinBg =
    pin.length === 0 ? "white" :
    isValid ? "#F0FDF4" :
    pin.length >= 3 ? "#FEF2F2" : "white";

  return createPortal(
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "32px 28px",
          width: "400px",
          maxWidth: "90vw",
          boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          animation: "dialogIn 220ms cubic-bezier(0.16,1,0.3,1) forwards",
        }}
      >
        {/* Warning Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          backgroundColor: "#FEF2F2",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0, textAlign: "center" }}>
          تأكيد الحذف
        </h3>

        <p style={{ fontSize: 13, color: "#64748B", textAlign: "center", margin: 0, lineHeight: 1.6 }}>
          هذا الإجراء لا يمكن التراجع عنه. أدخل الرقم 123 للتأكيد.
        </p>

        <div style={{
          backgroundColor: "#FEF2F2", color: "#DC2626",
          borderRadius: 8, padding: "8px 16px",
          fontSize: 14, fontWeight: 600,
          width: "100%", textAlign: "center",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {itemName}
        </div>

        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          maxLength={3}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="أدخل 123 للتأكيد"
          style={{
            width: "100%", height: 52,
            border: `2px solid ${pinBorderColor}`,
            borderRadius: 12,
            backgroundColor: pinBg,
            fontSize: 22, fontWeight: 700, letterSpacing: 8,
            textAlign: "center", outline: "none",
            transition: "border-color 150ms ease, background-color 150ms ease",
            boxSizing: "border-box",
            direction: "ltr",
            fontFamily: "inherit",
          }}
        />

        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <button
            type="button"
            onClick={handleCancelClick}
            style={{
              flex: 1, height: 44,
              border: "1.5px solid #E2E8F0", borderRadius: 10,
              backgroundColor: "white", color: "#475569",
              fontSize: 14, fontWeight: 500, cursor: "pointer",
              transition: "all 150ms ease", fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F8FAFC"; e.currentTarget.style.borderColor = "#CBD5E1"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.borderColor = "#E2E8F0"; }}
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={!isValid}
            style={{
              flex: 1, height: 44,
              border: "none", borderRadius: 10,
              backgroundColor: isValid ? "#DC2626" : "#FCA5A5",
              color: "white",
              fontSize: 14, fontWeight: 600,
              cursor: isValid ? "pointer" : "not-allowed",
              opacity: isValid ? 1 : 0.7,
              transition: "all 180ms ease",
              boxShadow: isValid ? "0 4px 12px rgba(220,38,38,0.3)" : "none",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { if (isValid) { e.currentTarget.style.backgroundColor = "#B91C1C"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={(e) => { if (isValid) { e.currentTarget.style.backgroundColor = "#DC2626"; e.currentTarget.style.transform = "translateY(0)"; } }}
          >
            تأكيد الحذف
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dialogIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body,
  );
}
