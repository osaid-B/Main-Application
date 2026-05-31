import "./Treasury.css";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  FileImage,
  Info,
  Link2,
  Printer,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Tooltip } from "../components/ui/Tooltip";
import type { TreasuryInstrument } from "../types/treasury";
import { STATUS_AR, TYPE_AR, DIRECTION_LABELS_AR } from "../types/treasury";

// ─── helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date();


function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ar-PS", { day: "2-digit", month: "2-digit" })
    + " " + d.toLocaleTimeString("ar-PS", { hour: "2-digit", minute: "2-digit" });
}

function daysDiff(isoOrDDMMYYYY: string): number {
  // Handle DD/MM/YYYY format
  let date: Date;
  if (isoOrDDMMYYYY.includes("/")) {
    const [dd, mm, yyyy] = isoOrDDMMYYYY.split("/");
    date = new Date(`${yyyy}-${mm}-${dd}`);
  } else {
    date = new Date(isoOrDDMMYYYY.split("T")[0]);
  }
  return Math.ceil((date.getTime() - TODAY.getTime()) / 86_400_000);
}

function dueDaysLabel(dueDate: string): { label: string; danger: boolean } {
  const diff = daysDiff(dueDate);
  if (diff > 0) return { label: `${diff} يوماً متبقياً`, danger: false };
  if (diff < 0) return { label: `متأخر ${Math.abs(diff)} ${Math.abs(diff) === 1 ? "يوم" : "أيام"}`, danger: true };
  return { label: "مستحق اليوم", danger: true };
}

const CURRENCY_SYMBOL: Record<string, string> = { ILS: "₪", JOD: "د.أ", USD: "$" };

function formatMoney(amount: number, currency: string) {
  const sym = CURRENCY_SYMBOL[currency] ?? currency;
  return `${sym}${amount.toLocaleString("ar-PS", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Status flow steps for progress bar
const MAIN_FLOW: { key: string; label: string }[] = [
  { key: "draft",     label: "مسودة"  },
  { key: "pending",   label: "معلقة"  },
  { key: "deposited", label: "مودعة"  },
  { key: "cleared",   label: "محصّلة" },
];

function statusDotClass(stepKey: string, currentStatus: string): string {
  const bounced    = currentStatus === "bounced";
  const cancelled  = currentStatus === "cancelled";
  const under      = currentStatus === "under_review";
  const partial    = currentStatus === "partially_applied";

  const mainIdx    = MAIN_FLOW.findIndex(s => s.key === stepKey);
  const currentIdx = MAIN_FLOW.findIndex(s => s.key === currentStatus);

  if (bounced && stepKey === "deposited") return "bounced";
  if ((cancelled || under) && stepKey === currentStatus) return "bounced";
  if (partial && stepKey === "deposited") return "done";
  if (currentIdx > mainIdx) return "done";
  if (currentIdx === mainIdx) return "active";
  return "";
}

// ─── TreasuryDetailPanel ──────────────────────────────────────────────────────

interface TreasuryDetailPanelProps {
  instrument: TreasuryInstrument;
  isArabic: boolean;
  onClose: () => void;
  onAction: (action: "submit" | "deposit" | "clear" | "bounce" | "redeposit" | "legal" | "review" | "cancel") => void;
  onCopyRef: () => void;
}

export function TreasuryDetailPanel({
  instrument,
  isArabic,
  onClose,
  onAction,
  onCopyRef,
}: TreasuryDetailPanelProps) {
  const { status } = instrument;
  const due = dueDaysLabel(instrument.dueDate);
  const side = isArabic ? "left" : "right";

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.28)",
          zIndex: 1200, backdropFilter: "blur(2px)",
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={instrument.id}
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          [side]: 0,
          width: "min(420px, 100vw)",
          background: "var(--app-surface)",
          boxShadow: "var(--app-shadow-overlay)",
          zIndex: 1210,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── Panel header ──────────────────────────── */}
        <div className="trs-panel-header">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="trs-panel-ref">{instrument.id}</span>
            <Button variant="icon" size="sm" onClick={onClose} aria-label="إغلاق">
              <X size={16} />
            </Button>
          </div>

          <div className="trs-panel-type-row">
            <span
              className={`trs-badge trs-dir-badge--${instrument.direction}`}
              style={{ fontSize: 12 }}
            >
              {DIRECTION_LABELS_AR[instrument.direction]} · {TYPE_AR[instrument.type]}
            </span>
            <span className={`trs-badge trs-badge--${status}`} style={{ fontSize: 12 }}>
              {STATUS_AR[status]}
            </span>
          </div>

          {/* Status flow */}
          <div>
            <div className="trs-status-flow" role="list" aria-label="مراحل الأداة">
              {MAIN_FLOW.map((step, i) => {
                const dotClass = statusDotClass(step.key, status);
                return (
                  <div className="trs-flow-step" key={step.key} role="listitem">
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div className={`trs-flow-dot ${dotClass}`}>
                        {dotClass === "done" ? <Check size={10} /> : i + 1}
                      </div>
                      <span className={`trs-flow-label ${dotClass}`}>{step.label}</span>
                    </div>
                    {i < MAIN_FLOW.length - 1 && (
                      <div className={`trs-flow-line ${dotClass === "done" || (MAIN_FLOW[i + 1] && statusDotClass(MAIN_FLOW[i + 1].key, status) !== "") ? "done" : ""}`} />
                    )}
                  </div>
                );
              })}

              {/* Show bounced/cancelled as deviation */}
              {(status === "bounced" || status === "cancelled" || status === "under_review") && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginInlineStart: 8 }}>
                  <div className={`trs-flow-dot bounced`}>
                    <AlertTriangle size={9} />
                  </div>
                  <span className="trs-flow-label bounced">{STATUS_AR[status]}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Panel body ────────────────────────────── */}
        <div className="trs-panel-body" style={{ overflowY: "auto", flex: 1, padding: "0 20px" }}>

          {/* المعلومات الأساسية */}
          <div className="trs-panel-section">
            <div className="trs-panel-section-title">
              <Info size={12} /> المعلومات الأساسية
            </div>

            <span className="trs-panel-amount">
              {formatMoney(instrument.amount, instrument.currency)}
            </span>

            {instrument.currency !== "ILS" && (
              <span style={{ fontSize: 12, color: "var(--app-text-muted)", marginBottom: 10, display: "block" }}>
                ما يعادل {formatMoney(instrument.amountInILS, "ILS")} تقريباً
              </span>
            )}

            <div className="trs-panel-grid" style={{ marginTop: 12 }}>
              <div className="trs-panel-field">
                <span>العملة</span>
                <strong>{instrument.currency}</strong>
              </div>
              <div className="trs-panel-field">
                <span>تاريخ الشيك</span>
                <strong className="mono">{instrument.instrumentDate}</strong>
              </div>
              <div className="trs-panel-field">
                <span>تاريخ الاستحقاق</span>
                <strong className={`mono ${due.danger ? "overdue" : ""}`}>
                  {instrument.dueDate}
                </strong>
              </div>
              <div className="trs-panel-field">
                <span>الأيام المتبقية</span>
                <strong className={due.danger ? "overdue" : ""} style={{ fontSize: 13 }}>
                  {due.label}
                </strong>
              </div>
              {instrument.referenceNumber && (
                <div className="trs-panel-field">
                  <span>المرجع</span>
                  <strong className="mono">{instrument.referenceNumber}</strong>
                </div>
              )}
            </div>
          </div>

          {/* بيانات الساحب */}
          <div className="trs-panel-section">
            <div className="trs-panel-section-title">
              <Building2 size={12} /> بيانات الساحب
            </div>
            <div className="trs-panel-grid">
              <div className="trs-panel-field">
                <span>الاسم</span>
                <strong>{instrument.drawerName}</strong>
              </div>
              {instrument.drawerType && (
                <div className="trs-panel-field">
                  <span>نوع الطرف</span>
                  <strong>
                    {instrument.drawerType === "customer" ? "زبون"
                      : instrument.drawerType === "supplier" ? "مورد"
                      : "أخرى"}
                  </strong>
                </div>
              )}
              <div className="trs-panel-field">
                <span>المستفيد</span>
                <strong>{instrument.payeeName}</strong>
              </div>
            </div>
            {instrument.drawerId && (
              <Button
                variant="ghost"
                size="sm"
                className="trs-act-btn"
                style={{ marginTop: 8 }}
                rightIcon={<ArrowUpRight size={12} />}
              >
                عرض الملف
              </Button>
            )}
          </div>

          {/* البيانات البنكية */}
          <div className="trs-panel-section">
            <div className="trs-panel-section-title">
              <CheckCircle2 size={12} /> البيانات البنكية
            </div>
            <div className="trs-panel-grid">
              <div className="trs-panel-field">
                <span>البنك</span>
                <strong>{instrument.bankName}</strong>
              </div>
              {instrument.branchName && (
                <div className="trs-panel-field">
                  <span>الفرع</span>
                  <strong>{instrument.branchName}</strong>
                </div>
              )}
              <div className="trs-panel-field">
                <span>رقم الحساب</span>
                <strong className="mono">{"*".repeat(Math.max(0, instrument.accountNumber.length - 4)) + instrument.accountNumber.slice(-4)}</strong>
              </div>
              {instrument.checkNumber && (
                <div className="trs-panel-field">
                  <span>رقم الشيك</span>
                  <strong className="mono">{instrument.checkNumber}</strong>
                </div>
              )}
              {instrument.iban && (
                <div className="trs-panel-field" style={{ gridColumn: "span 2" }}>
                  <span>IBAN</span>
                  <strong className="mono" style={{ fontSize: 11.5, overflowWrap: "anywhere" }}>{instrument.iban}</strong>
                </div>
              )}
              {instrument.swiftCode && (
                <div className="trs-panel-field">
                  <span>رمز SWIFT</span>
                  <strong className="mono">{instrument.swiftCode}</strong>
                </div>
              )}
            </div>
          </div>

          {/* بيانات MICR */}
          {instrument.micrRaw && (
            <div className="trs-panel-section">
              <div className="trs-panel-section-title">
                <Info size={12} /> بيانات MICR المقروءة
                <Tooltip
                  content="MICR هو الرمز المطبوع في أسفل الشيك بحبر خاص. يحتوي على رمز البنك والفرع ورقم الحساب ورقم الشيك."
                  side="top"
                >
                  <span className="trs-help-icon">?</span>
                </Tooltip>
              </div>
              <div style={{
                background: "var(--app-surface-muted)",
                border: "1px solid var(--app-border)",
                borderRadius: "var(--app-radius-sm)",
                padding: "8px 12px",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                color: "var(--app-text)",
                marginBottom: 10,
                overflowX: "auto",
                whiteSpace: "nowrap",
              }}>
                {instrument.micrRaw}
              </div>
              <div className="trs-panel-grid">
                {instrument.micrBankCode && (
                  <div className="trs-panel-field">
                    <span>كود البنك</span>
                    <strong className="mono">{instrument.micrBankCode}</strong>
                  </div>
                )}
                {instrument.micrAccountNumber && (
                  <div className="trs-panel-field">
                    <span>رقم الحساب</span>
                    <strong className="mono">{instrument.micrAccountNumber}</strong>
                  </div>
                )}
                {instrument.micrCheckNumber && (
                  <div className="trs-panel-field">
                    <span>رقم الشيك</span>
                    <strong className="mono">{instrument.micrCheckNumber}</strong>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                {instrument.micrVerified ? (
                  <span className="trs-micr-verified ok">
                    <Check size={11} /> تم التحقق يدوياً
                  </span>
                ) : (
                  <span className="trs-micr-verified pending">
                    <TriangleAlert size={11} /> بانتظار المراجعة
                  </span>
                )}
              </div>
            </div>
          )}

          {/* الفواتير المرتبطة */}
          <div className="trs-panel-section">
            <div className="trs-panel-section-title">
              <Link2 size={12} /> الفواتير المرتبطة
            </div>
            {instrument.linkedInvoiceIds.length > 0 ? (
              instrument.linkedInvoiceIds.map(invId => (
                <div key={invId} className="trs-linked-invoice">
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span className="trs-linked-inv-ref">{invId}</span>
                    <span className="trs-linked-inv-name">{instrument.drawerName}</span>
                  </div>
                </div>
              ))
            ) : (
              <span style={{ fontSize: 13, color: "var(--app-text-muted)" }}>
                لا توجد فواتير مرتبطة
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="trs-act-btn"
              style={{ marginTop: 8 }}
              leftIcon={<Link2 size={12} />}
            >
              + ربط بفاتورة
            </Button>
          </div>

          {/* صورة الشيك */}
          <div className="trs-panel-section">
            <div className="trs-panel-section-title">
              <FileImage size={12} /> صورة الشيك
            </div>
            {instrument.imageUrl ? (
              <img
                src={instrument.imageUrl}
                alt="صورة الشيك"
                style={{ width: "100%", borderRadius: "var(--app-radius-md)", border: "1px solid var(--app-border)" }}
              />
            ) : (
              <div className="trs-img-placeholder" role="button" tabIndex={0}>
                <Upload size={18} style={{ margin: "0 auto 6px" }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>رفع صورة الشيك</div>
                <div style={{ fontSize: 11.5 }}>اسحب وأفلت أو انقر للاختيار</div>
              </div>
            )}
          </div>

          {/* ملاحظات */}
          {instrument.notes && (
            <div className="trs-panel-section">
              <div className="trs-panel-section-title">ملاحظات</div>
              <p style={{ fontSize: 13.5, color: "var(--app-text-soft)", margin: 0, lineHeight: 1.6 }}>
                {instrument.notes}
              </p>
            </div>
          )}

          {/* سجل الحالات */}
          <div className="trs-panel-section">
            <div className="trs-panel-section-title">سجل الحالات</div>
            <div className="trs-history-list">
              {[...instrument.statusHistory].reverse().map((entry, i) => (
                <div key={i} className="trs-history-entry">
                  <div
                    className={`trs-history-dot ${
                      entry.status === "bounced" || entry.status === "cancelled" ? "bounced"
                      : entry.status === "cleared" ? "cleared"
                      : ""
                    }`}
                  />
                  <div className="trs-history-status">{STATUS_AR[entry.status]}</div>
                  <div className="trs-history-time">{fmtDateTime(entry.changedAt)}</div>
                  {entry.note && (
                    <div className="trs-history-note">{entry.note}</div>
                  )}
                  <div className="trs-history-by">بواسطة: {entry.changedBy}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Panel footer ──────────────────────────── */}
        <div className="trs-panel-footer">
          {/* Primary action based on status */}
          {status === "draft" && (
            <Button variant="primary" size="sm" onClick={() => onAction("submit")}>
              تقديم للمعالجة
            </Button>
          )}
          {status === "pending" && (
            <Button variant="primary" size="sm" onClick={() => onAction("deposit")}>
              تسجيل إيداع
            </Button>
          )}
          {status === "deposited" && (
            <>
              <Button variant="primary" size="sm" onClick={() => onAction("clear")}>
                تأكيد التحصيل
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onAction("bounce")}>
                تسجيل ارتجاع
              </Button>
            </>
          )}
          {status === "bounced" && (
            <>
              <Button variant="primary" size="sm" onClick={() => onAction("redeposit")}>
                إعادة إيداع
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onAction("legal")}>
                إجراء قانوني
              </Button>
            </>
          )}
          {status === "under_review" && (
            <>
              <Button variant="primary" size="sm" onClick={() => onAction("review")}>
                مراجعة OCR
              </Button>
            </>
          )}
          {status === "partially_applied" && (
            <Button variant="primary" size="sm" onClick={() => onAction("clear")}>
              تأكيد التحصيل
            </Button>
          )}

          {/* Secondary actions */}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Printer size={13} />}
          >
            طباعة
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Copy size={13} />}
            onClick={onCopyRef}
          >
            نسخ المرجع
          </Button>
        </div>
      </aside>
    </>,
    document.body
  );
}
