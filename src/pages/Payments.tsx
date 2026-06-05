import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  BarChart2,
  Calendar,
  CalendarRange,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  Plus,
  Receipt,
  X,
} from "lucide-react";
import "./Payments.css";
import { Button } from "../components/ui/Button";
import { SearchBox } from "../components/ui/SearchBox";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { useData } from "../context/DataContext";
import { formatCurrencyValue } from "../utils/displayFormatters";
import {
  calculateInvoiceRemainingAmount,
  getCustomerById,
  getInvoiceById,
  isSuccessfulPaymentStatus,
  roundMoney,
} from "../data/relations";
import type { Customer, Invoice, Payment, PaymentMethod, PaymentStatus } from "../data/types";
import { useSettings } from "../context/SettingsContext";
import { TableActions } from "../components/ui/TableActions";

type DateRangeFilter = "all" | "today" | "week" | "month";
type AmountFilter = "all" | "under-500" | "500-2000" | "2000-plus";
type LinkedFilter = "all" | "linked" | "unlinked";
type SortKey = "amount" | "status" | "paymentId" | "invoiceNumber" | "date" | "customerName" | "method";
type SortDirection = "asc" | "desc";
type DetailTab = "overview" | "invoice" | "notes" | "receipt" | "history";
type QuickFilter = "completed" | "pending" | "failed" | "refunded" | "partial" | "today" | "week";

type ExtendedPayment = Payment & {
  paymentId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  date: string;
  notes: string;
  referenceNumber: string;
  receiptId: string;
  createdBy: string;
  updatedAt: string;
  invoiceTotal: number;
  amountPaidBefore: number;
  remainingAfterPayment: number;
  linkState: "Fully applied" | "Partially applied" | "Not applied" | "Unlinked";
  relativeDate: string;
};

type PaymentForm = {
  invoiceId: string;
  customerId: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
  referenceNumber: string;
  notes: string;
  createdBy: string;
};

type PaymentFormErrors = Partial<Record<keyof PaymentForm, string>>;

type FilterState = {
  status: string;
  method: string;
  dateRange: DateRangeFilter;
  amount: AmountFilter;
  customer: string;
  invoice: string;
  linked: LinkedFilter;
  createdBy: string;
};

type ToastState = { type: "success" | "error" | "warning" | "info"; message: string } | null;

const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Card", "Bank Transfer", "Wallet", "Cheque"];
const PAYMENT_STATUSES: PaymentStatus[] = ["Completed", "Pending", "Failed", "Refunded", "Partial", "Cancelled"];

const EMPTY_FORM: PaymentForm = {
  invoiceId: "",
  customerId: "",
  amount: "",
  method: "Bank Transfer",
  status: "Completed",
  date: new Date().toISOString().split("T")[0],
  referenceNumber: "",
  notes: "",
  createdBy: "Admin User",
};

function buildPaymentId(index: number) { return `PAY-${2001 + index}`; }

function normalizeMethod(method?: string): PaymentMethod {
  if (method === "Cash" || method === "Card" || method === "Bank Transfer" || method === "Wallet" || method === "Cheque") return method;
  return "Cash";
}

function normalizeStatus(status?: string): PaymentStatus {
  if (status === "Paid" || status === "Pending" || status === "Partial" || status === "Completed" || status === "Failed" || status === "Refunded" || status === "Cancelled") return status;
  return "Completed";
}

function formatMoney(value: number) {
  return formatCurrencyValue(roundMoney(value), "ILS");
}

function formatDate(value: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const d = String(parsed.getDate()).padStart(2, "0");
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${parsed.getFullYear()}`;
}

function getRelativeDateLabel(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "اليوم";
  if (diffDays === -1) return "أمس";
  if (diffDays === 1) return "غداً";
  if (diffDays < 0) return `منذ ${Math.abs(diffDays)} أيام`;
  return `بعد ${diffDays} أيام`;
}

function formatLinkState(ls: ExtendedPayment["linkState"]): string {
  switch (ls) {
    case "Fully applied":     return "مطبّقة بالكامل";
    case "Partially applied": return "مطبّقة جزئياً";
    case "Not applied":       return "غير مطبّقة";
    case "Unlinked":          return "غير مرتبطة";
    default:                  return ls;
  }
}

function quickChipLabel(f: QuickFilter): string {
  switch (f) {
    case "completed": return "مكتملة";
    case "pending":   return "معلقة";
    case "failed":    return "فاشلة";
    case "refunded":  return "مُستردة";
    case "partial":   return "جزئية";
    case "today":     return "اليوم";
    case "week":      return "هذا الأسبوع";
    default:          return f;
  }
}

function formatStatus(status: PaymentStatus) {
  if (status === "Paid") return "Completed";
  return status;
}

function formatMethod(method: PaymentMethod) {
  switch (method) {
    case "Cash": return "نقداً";
    case "Card": return "بطاقة";
    case "Bank Transfer": return "تحويل بنكي";
    case "Wallet": return "محفظة إلكترونية";
    case "Cheque": return "شيك";
    default: return "أخرى";
  }
}

function getStatusTone(status: PaymentStatus) {
  switch (status) {
    case "Completed": case "Paid": return "status-success";
    case "Pending": case "Partial": return "status-warning";
    case "Failed": return "status-danger";
    case "Refunded": return "status-info";
    default: return "status-muted";
  }
}

function normalizePaymentList(payments: Payment[], invoices: Invoice[], customers: Customer[]) {
  return payments.map((payment, index) => {
    const normalizedStatus = normalizeStatus(payment.status);
    const normalizedMethod = normalizeMethod(payment.method);
    const invoice = getInvoiceById(invoices, payment.invoiceId);
    const customer = getCustomerById(customers, payment.customerId);
    const invoiceTotal = roundMoney(Number(invoice?.total ?? invoice?.amount ?? 0));

    const paidByOthers = roundMoney(
      payments
        .filter((entry) => entry.invoiceId === payment.invoiceId && entry.id !== payment.id && entry.paymentId !== payment.paymentId && isSuccessfulPaymentStatus(entry.status))
        .reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0)
    );

    const remainingAfterPayment = invoice
      ? roundMoney(Math.max(invoiceTotal - paidByOthers - (isSuccessfulPaymentStatus(normalizedStatus) ? Number(payment.amount ?? 0) : 0), 0))
      : 0;

    let linkState: ExtendedPayment["linkState"] = "Unlinked";
    if (invoice) {
      if (!isSuccessfulPaymentStatus(normalizedStatus)) linkState = "Not applied";
      else if (remainingAfterPayment <= 0) linkState = "Fully applied";
      else linkState = "Partially applied";
    }

    return {
      ...payment,
      paymentId: payment.paymentId ?? payment.id ?? buildPaymentId(index),
      invoiceNumber: invoice?.id ?? "Unlinked",
      customerName: customer?.name ?? payment.customerName ?? "عميل غير معروف",
      customerEmail: customer?.email ?? "No email",
      amount: roundMoney(Number(payment.amount ?? 0)),
      status: normalizedStatus,
      method: normalizedMethod,
      date: payment.date ?? new Date().toISOString().split("T")[0],
      notes: payment.notes ?? "",
      referenceNumber: payment.referenceNumber ?? payment.paymentId ?? payment.id ?? "No reference",
      receiptId: payment.receiptId ?? `RCPT-${index + 1012}`,
      createdBy: payment.createdBy ?? "Admin User",
      updatedAt: payment.updatedAt ?? payment.date ?? new Date().toISOString().split("T")[0],
      invoiceTotal,
      amountPaidBefore: paidByOthers,
      remainingAfterPayment,
      linkState,
      relativeDate: getRelativeDateLabel(payment.date ?? ""),
    };
  });
}

function validatePaymentForm(values: PaymentForm, invoices: Invoice[], payments: Payment[], editingPaymentId?: string) {
  const errors: PaymentFormErrors = {};
  if (!values.invoiceId.trim()) errors.invoiceId = "Invoice is required.";
  const invoice = invoices.find((entry) => entry.id === values.invoiceId);
  if (!invoice) { errors.invoiceId = "Select a valid invoice."; return errors; }
  if (!values.customerId.trim()) errors.customerId = "Customer is required.";
  if (!values.amount.trim()) errors.amount = "Amount is required.";
  else if (Number.isNaN(Number(values.amount))) errors.amount = "Amount must be numeric.";
  else if (Number(values.amount) <= 0) errors.amount = "Amount must be greater than zero.";
  if (!values.date.trim()) errors.date = "Payment date is required.";
  if (!values.referenceNumber.trim()) errors.referenceNumber = "Reference is required.";
  if (!values.createdBy.trim()) errors.createdBy = "Created by is required.";
  const remainingAmount = roundMoney(calculateInvoiceRemainingAmount(invoice, payments.filter((payment) => payment.id !== editingPaymentId && payment.paymentId !== editingPaymentId)));
  if (values.amount && !Number.isNaN(Number(values.amount)) && isSuccessfulPaymentStatus(values.status) && Number(values.amount) > remainingAmount) {
    errors.amount = `Remaining invoice balance is ${formatMoney(remainingAmount)}.`;
  }
  return errors;
}

/* ── PaymentDetailModal (centered portal) ─────────────── */
function PaymentDetailModal({ payment, activeTab, onChangeTab, onClose }: {
  payment: ExtendedPayment; activeTab: DetailTab;
  onChangeTab: (tab: DetailTab) => void; onClose: () => void;
}) {
  const { t, isArabic } = useSettings();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <>
      <div className="pay-detail-overlay" onClick={onClose} />
      <div className="pay-detail-modal" role="dialog" aria-modal="true" dir={isArabic ? "rtl" : "ltr"}>
        <div className="pay-detail-head">
          <div className="pay-detail-head-left">
            <span className="eyebrow">{t.payments.detail.overview}</span>
            <h2>{payment.paymentId}</h2>
            <p>{payment.customerName} · {formatMoney(payment.amount)}</p>
          </div>
          <button type="button" className="pay-detail-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="pay-detail-tabs">
          {(["overview", "invoice", "notes", "receipt", "history"] as DetailTab[]).map((tab) => (
            <button key={tab} type="button" className={`pay-detail-tab ${activeTab === tab ? "active" : ""}`} onClick={() => onChangeTab(tab)}>
              {tab === "overview" && t.payments.detail.overview}{tab === "invoice" && t.payments.detail.invoice}
              {tab === "notes" && t.payments.detail.notes}{tab === "receipt" && t.payments.detail.receipt}{tab === "history" && t.payments.detail.history}
            </button>
          ))}
        </div>
        <div className="pay-detail-body">
          {activeTab === "overview" && (
            <div className="pay-detail-grid">
              <div className="pay-detail-card">
                <h3>{t.payments.detail.paymentOverview}</h3>
                <dl className="pay-detail-list">
                  <div><dt>{t.payments.detail.status}</dt><dd><span className={`status-pill ${getStatusTone(payment.status)}`}>{formatStatus(payment.status)}</span></dd></div>
                  <div><dt>{t.payments.detail.method}</dt><dd>{formatMethod(payment.method)}</dd></div>
                  <div><dt>{t.payments.detail.paymentDate}</dt><dd>{formatDate(payment.date)}</dd></div>
                  <div><dt>{t.payments.detail.reference}</dt><dd>{payment.referenceNumber}</dd></div>
                  <div><dt>{t.payments.detail.receiptId}</dt><dd>{payment.receiptId}</dd></div>
                  <div><dt>{t.payments.detail.createdBy}</dt><dd>{payment.createdBy}</dd></div>
                </dl>
              </div>
              <div className="pay-detail-card">
                <h3>{t.payments.detail.financialImpact}</h3>
                <dl className="pay-detail-list">
                  <div><dt>{t.payments.detail.invoiceTotal}</dt><dd>{formatMoney(payment.invoiceTotal)}</dd></div>
                  <div><dt>{t.payments.detail.amountPaidBeforeLabel}</dt><dd>{formatMoney(payment.amountPaidBefore)}</dd></div>
                  <div><dt>{t.payments.detail.thisPayment}</dt><dd>{formatMoney(payment.amount)}</dd></div>
                  <div><dt>{t.payments.detail.remainingAfterLabel}</dt><dd>{formatMoney(payment.remainingAfterPayment)}</dd></div>
                  <div><dt>{t.payments.detail.linkState}</dt><dd>{payment.linkState}</dd></div>
                  <div><dt>{t.payments.detail.date}</dt><dd>{formatDate(payment.updatedAt)}</dd></div>
                </dl>
              </div>
            </div>
          )}
          {activeTab === "invoice" && (
            <div className="pay-detail-card">
              <h3>{t.payments.detail.invoiceLinkage}</h3>
              <dl className="pay-detail-list">
                <div><dt>{t.payments.detail.linkedInvoice}</dt><dd>{payment.invoiceNumber}</dd></div>
                <div><dt>{t.payments.detail.customer}</dt><dd>{payment.customerName}</dd></div>
                <div><dt>{t.payments.detail.customerEmail}</dt><dd>{payment.customerEmail}</dd></div>
                <div><dt>{t.payments.detail.appStatus}</dt><dd>{payment.linkState}</dd></div>
                <div><dt>{t.payments.detail.remainingBalance}</dt><dd>{formatMoney(payment.remainingAfterPayment)}</dd></div>
              </dl>
            </div>
          )}
          {activeTab === "notes" && (
            <div className="pay-detail-card"><h3>{t.payments.detail.notes}</h3><p className="pay-detail-text">{payment.notes || t.payments.detail.noNotes}</p></div>
          )}
          {activeTab === "receipt" && (
            <div className="pay-detail-card">
              <h3>{t.payments.detail.receiptAudit}</h3>
              <dl className="pay-detail-list">
                <div><dt>{t.payments.detail.receiptId}</dt><dd>{payment.receiptId}</dd></div>
                <div><dt>{t.payments.detail.refNumber}</dt><dd>{payment.referenceNumber}</dd></div>
                <div><dt>{t.payments.detail.printableReceipt}</dt><dd>{t.payments.detail.availableFromRow}</dd></div>
              </dl>
            </div>
          )}
          {activeTab === "history" && (
            <div className="pay-detail-card">
              <h3>{t.payments.detail.history}</h3>
              <ul className="pay-detail-history">
                <li><span>{t.payments.detail.paymentCaptured}</span><b>{formatDate(payment.date)}</b></li>
                <li><span>{t.payments.detail.statusLastUpdated}</span><b>{formatDate(payment.updatedAt)}</b></li>
                <li><span>{t.payments.detail.handledBy}</span><b>{payment.createdBy}</b></li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

/* ── PaymentViewModal (centered portal) ──────────────── */
function PaymentViewModal({
  payment, onClose, onEdit, onDelete,
}: {
  payment: ExtendedPayment;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    Completed: { bg: "#DCFCE7", color: "#16A34A", label: "مكتملة" },
    Paid:      { bg: "#DCFCE7", color: "#16A34A", label: "مكتملة" },
    Pending:   { bg: "#FEF3C7", color: "#D97706", label: "معلقة" },
    Partial:   { bg: "#FEF3C7", color: "#D97706", label: "جزئية" },
    Failed:    { bg: "#FEE2E2", color: "#DC2626", label: "فاشلة" },
    Refunded:  { bg: "#EDE9FE", color: "#7C3AED", label: "مُستردة" },
    Cancelled: { bg: "#F1F5F9", color: "#64748B", label: "ملغاة" },
  };
  const methodEmoji: Record<string, string> = {
    Cash: "💵", Card: "💳", "Bank Transfer": "🏦", Wallet: "👛", Cheque: "📄",
  };
  const sc = statusColors[payment.status] ?? { bg: "#F1F5F9", color: "#64748B", label: payment.status };
  const isUnlinked = payment.invoiceNumber === "Unlinked" || payment.linkState === "Unlinked";

  const rowStyle: React.CSSProperties = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 0", borderBottom: "1px solid #F8FAFC",
  };
  const keyStyle: React.CSSProperties = { fontSize: 13, color: "#64748B" };
  const valStyle: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "#0F172A" };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(15,23,42,0.48)", backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        style={{
          background: "#fff", borderRadius: 20, width: 560,
          maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto",
          boxShadow: "0 25px 60px rgba(0,0,0,0.15)",
          animation: "payViewIn 220ms cubic-bezier(0.16,1,0.3,1) forwards",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "22px 24px 16px", borderBottom: "1px solid #F1F5F9",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          flexShrink: 0, position: "sticky", top: 0, background: "#fff", zIndex: 1,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{
              background: "#EFF6FF", color: "#1D4ED8", borderRadius: 8,
              padding: "6px 14px", fontSize: 14, fontWeight: 700,
              fontFamily: "monospace", display: "inline-block",
            }}>
              {payment.paymentId}
            </span>
            <span style={{
              background: sc.bg, color: sc.color,
              borderRadius: 99, padding: "3px 12px",
              fontSize: 12, fontWeight: 600, display: "inline-block",
            }}>
              {sc.label}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "none",
              background: "transparent", cursor: "pointer", fontSize: 18,
              color: "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.color = "#DC2626"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
          {/* Hero amount */}
          <div style={{
            background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
            borderRadius: 14, padding: 20, textAlign: "center",
          }}>
            <p style={{ fontSize: 12, color: "#64748B", marginBottom: 6, margin: "0 0 6px" }}>المبلغ الإجمالي</p>
            <strong style={{ fontSize: 32, fontWeight: 800, color: "#1E40AF", fontVariantNumeric: "tabular-nums", display: "block" }}>
              ₪ {payment.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </strong>
            {payment.remainingAfterPayment > 0 && (
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "#DC2626" }}>
                الرصيد المتبقي: ₪ {payment.remainingAfterPayment.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          {/* Details rows */}
          <div>
            <div style={rowStyle}>
              <span style={keyStyle}>رقم الدفعة</span>
              <span style={{ ...valStyle, fontFamily: "monospace" }}>{payment.paymentId}</span>
            </div>
            <div style={rowStyle}>
              <span style={keyStyle}>رقم الإيصال</span>
              <span style={valStyle}>{payment.receiptId || "—"}</span>
            </div>
            <div style={rowStyle}>
              <span style={keyStyle}>الفاتورة</span>
              {isUnlinked ? (
                <span style={{ color: "#F59E0B", fontSize: 13, fontWeight: 500 }}>⚠ غير مرتبطة</span>
              ) : (
                <span style={{ ...valStyle, fontFamily: "monospace", color: "#2563EB" }}>{payment.invoiceNumber}</span>
              )}
            </div>
            <div style={rowStyle}>
              <span style={keyStyle}>العميل</span>
              <span style={valStyle}>{payment.customerName || "—"}</span>
            </div>
            <div style={rowStyle}>
              <span style={keyStyle}>طريقة الدفع</span>
              <span style={valStyle}>{methodEmoji[payment.method] ?? ""} {formatMethod(payment.method)}</span>
            </div>
            <div style={rowStyle}>
              <span style={keyStyle}>التاريخ</span>
              <span style={valStyle}>{formatDate(payment.date)}</span>
            </div>
            <div style={{ ...rowStyle, borderBottom: "none" }}>
              <span style={keyStyle}>المرجع</span>
              <span style={{ ...valStyle, fontFamily: "monospace" }}>{payment.referenceNumber}</span>
            </div>
          </div>

          {/* Notes */}
          {payment.notes && (
            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 14 }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>ملاحظات</p>
              <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{payment.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px", borderTop: "1px solid #F1F5F9",
          display: "flex", gap: 8, flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onEdit}
            style={{
              border: "1px solid #E2E8F0", color: "#374151", borderRadius: 10,
              padding: "9px 20px", fontSize: 14, background: "#fff",
              cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            <i className="ti ti-pencil" style={{ fontSize: 15 }} /> تعديل
          </button>
          <button
            type="button"
            onClick={onDelete}
            style={{
              border: "1px solid #FECACA", color: "#DC2626", borderRadius: 10,
              padding: "9px 20px", fontSize: 14, background: "#fff",
              cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            <i className="ti ti-trash" style={{ fontSize: 15 }} /> حذف
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none", color: "#64748B", borderRadius: 10,
              padding: "9px 20px", fontSize: 14, background: "transparent",
              cursor: "pointer", fontFamily: "inherit",
              transition: "color 150ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#374151"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#64748B"; }}
          >
            إغلاق
          </button>
        </div>
      </div>
      <style>{`
        @keyframes payViewIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}

/* ── PaymentEditor Modal ──────────────────────────────── */
function PaymentEditor({
  mode, values, errors, invoices, customers, payments, onChange, onClose, onSubmit,
}: {
  mode: "create" | "edit";
  values: PaymentForm;
  errors: PaymentFormErrors;
  invoices: Invoice[];
  customers: Customer[];
  payments: Payment[];
  onChange: (field: keyof PaymentForm, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { t } = useSettings();
  const selectedInvoice = invoices.find((inv) => inv.id === values.invoiceId);
  const selectedCustomer = customers.find((c) => c.id === values.customerId);
  const remainingAmount = selectedInvoice ? calculateInvoiceRemainingAmount(selectedInvoice, payments) : 0;
  const amountValue = Number(values.amount || 0);
  const remainingAfter = selectedInvoice
    ? roundMoney(Math.max(remainingAmount - (isSuccessfulPaymentStatus(values.status) ? amountValue : 0), 0))
    : 0;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      variant="dialog"
      size="lg"
      title={mode === "create" ? t.payments.form.createTitle : t.payments.form.editTitle}
      description={t.payments.pageSubtitle}
      className="payment-modal-card"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>{t.common.cancel}</Button>
          <Button variant="primary" type="button" onClick={onSubmit}>
            {mode === "create" ? t.common.save : t.common.saveChanges}
          </Button>
        </>
      }
    >
        <div className="payment-modal-body">
          <div className="payment-form-sections">

            {/* Section 1 */}
            <section className="payment-form-section">
              <div className="section-heading">
                <span className="step-badge">1</span>
                <div>
                  <h3>{t.payments.form.paymentSetup}</h3>
                  <p>{t.payments.form.paymentSetupSub}</p>
                </div>
              </div>
              <div className="payment-form-grid">
                <div className="field-block">
                  <Select
                    label={`${t.payments.form.invoice} *`}
                    value={values.invoiceId}
                    onChange={(e) => {
                      const inv = invoices.find((entry) => entry.id === e.target.value);
                      onChange("invoiceId", e.target.value);
                      onChange("customerId", inv?.customerId ?? "");
                    }}
                    placeholder={t.payments.form.selectInvoice}
                    error={errors.invoiceId}
                    options={invoices.map((inv) => {
                      const cust = customers.find((c) => c.id === inv.customerId);
                      return { value: inv.id, label: `${inv.id} - ${cust?.name ?? "Unknown"}` };
                    })}
                  />
                </div>

                <div className="field-block">
                  <Input
                    variant="text"
                    label={`${t.payments.form.customer} *`}
                    value={selectedCustomer?.name ?? ""}
                    readOnly
                    placeholder={t.payments.form.selectCustomer}
                    error={errors.customerId}
                  />
                </div>

                <div className="field-block">
                  <div className="amount-input-wrap">
                    <span className="amount-prefix">₪</span>
                    <Input
                      variant="number"
                      label={`${t.payments.form.amount} *`}
                      min="0.01"
                      step="0.01"
                      value={values.amount}
                      onChange={(e) => onChange("amount", e.target.value)}
                      placeholder="0.00"
                      error={errors.amount}
                    />
                  </div>
                </div>

                <div className="field-block">
                  <div className="select-icon-wrap">
                    <Select
                      label={`${t.payments.form.method} *`}
                      value={values.method}
                      onChange={(e) => onChange("method", e.target.value)}
                      options={PAYMENT_METHODS.map((m) => ({ value: m, label: formatMethod(m) }))}
                    />
                    <CalendarRange size={15} className="select-icon" />
                  </div>
                </div>

                <div className="field-block">
                  <div className="status-select-wrap">
                    {values.status === "Completed" && <span className="status-dot green" />}
                    {values.status === "Pending" && <span className="status-dot amber" />}
                    {(values.status === "Failed" || values.status === "Cancelled") && <span className="status-dot red" />}
                    <Select
                      label={`${t.payments.form.status} *`}
                      value={values.status}
                      onChange={(e) => onChange("status", e.target.value)}
                      options={PAYMENT_STATUSES.map((s) => ({ value: s, label: formatStatus(s) }))}
                    />
                  </div>
                </div>

                <div className="field-block">
                  <div className="date-input-wrap">
                    <Input
                      variant="date"
                      label={`${t.payments.form.date} *`}
                      value={values.date}
                      onChange={(e) => onChange("date", e.target.value)}
                      error={errors.date}
                    />
                    <Calendar size={15} className="select-icon" />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="payment-form-section">
              <div className="section-heading">
                <span className="step-badge">2</span>
                <div>
                  <h3>{t.payments.form.refNote}</h3>
                  <p>{t.payments.form.refNoteSub}</p>
                </div>
              </div>
              <div className="payment-form-grid">
                <label className="field-block">
                  <span>{t.payments.form.reference}</span>
                  <input value={values.referenceNumber}
                    onChange={(e) => onChange("referenceNumber", e.target.value)}
                    placeholder={t.payments.form.reference} />
                  {errors.referenceNumber && <small className="field-error">{errors.referenceNumber}</small>}
                </label>

                <label className="field-block">
                  <span>{t.payments.form.createdBy}</span>
                  <div className="select-icon-wrap">
                    <input value={values.createdBy}
                      onChange={(e) => onChange("createdBy", e.target.value)} placeholder={t.payments.form.createdBy} />
                    <Receipt size={15} className="select-icon" />
                  </div>
                  {errors.createdBy && <small className="field-error">{errors.createdBy}</small>}
                </label>

                <label className="field-block field-span-full">
                  <span>{t.payments.form.notes}</span>
                  <textarea rows={4} value={values.notes}
                    onChange={(e) => onChange("notes", e.target.value)}
                    placeholder={t.payments.form.notesPlaceholder} />
                </label>
              </div>
            </section>
          </div>

          {/* Right Panel */}
          <aside className="payment-editor-summary">
            <div className="summary-panel">
              <div className="summary-panel-header">
                <div className="summary-panel-icon blue"><BarChart2 size={18} /></div>
                <h4>{t.payments.form.invoiceImpact}</h4>
              </div>
              <ul className="summary-list">
                <li><span>{t.payments.form.invoiceTotal}</span><b>{formatMoney(Number(selectedInvoice?.total ?? selectedInvoice?.amount ?? 0))}</b></li>
                <li><span>{t.payments.form.outstandingNow}</span><b>{formatMoney(remainingAmount)}</b></li>
                <li><span>{t.payments.form.thisPayment}</span><b className="blue-val">{formatMoney(amountValue)}</b></li>
                <li><span>{t.payments.form.balanceAfter}</span><b>{formatMoney(remainingAfter)}</b></li>
              </ul>
            </div>

            <div className="summary-panel">
              <div className="summary-panel-header">
                <div className="summary-panel-icon green"><CheckCircle2 size={18} /></div>
                <h4>{t.payments.form.operationalChecks}</h4>
              </div>
              <ul className="summary-checks">
                <li><CheckCircle2 size={15} className="check-ok" />{t.payments.form.check1}</li>
                <li><CheckCircle2 size={15} className="check-ok" />{t.payments.form.check2}</li>
                <li><CheckCircle2 size={15} className="check-ok" />{t.payments.form.check3}</li>
              </ul>
            </div>

            <div className="summary-panel">
              <div className="summary-panel-header">
                <div className="summary-panel-icon slate"><FileText size={18} /></div>
                <h4>{t.payments.form.paymentSummary}</h4>
              </div>
              {selectedInvoice ? (
                <ul className="summary-list">
                  <li><span>{t.payments.form.invoice}</span><b>{selectedInvoice.id}</b></li>
                  <li><span>{t.payments.form.customer}</span><b>{selectedCustomer?.name ?? "—"}</b></li>
                  <li><span>{t.payments.form.method}</span><b>{formatMethod(values.method)}</b></li>
                  <li><span>{t.payments.form.status}</span><b>{formatStatus(values.status)}</b></li>
                </ul>
              ) : (
                <div className="summary-empty">
                  <strong>{t.payments.form.noInvoiceSelected}</strong>
                  <p>{t.payments.form.noInvoiceDesc}</p>
                </div>
              )}
            </div>
          </aside>
        </div>

    </Modal>
  );
}

/* ── Main Component ───────────────────────────────────── */
export default function Payments() {
  const { t, isArabic } = useSettings();
  const {
    customers,
    invoices,
    payments: rawPayments,
    addPayment,
    updatePayment,
    deletePayment: deletePaymentCtx,
  } = useData();
  const payments = useMemo(
    () => normalizePaymentList(rawPayments, invoices, customers),
    [rawPayments, invoices, customers]
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({ status: "", method: "", dateRange: "all", amount: "all", customer: "", invoice: "", linked: "all", createdBy: "" });
  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>([]);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: "date", direction: "desc" });
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  const [showEditor, setShowEditor] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [formState, setFormState] = useState<PaymentForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<PaymentFormErrors>({});
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [detailsPayment, setDetailsPayment] = useState<ExtendedPayment | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [toast, setToast] = useState<ToastState>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExtendedPayment | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [viewModal, setViewModal] = useState<{ isOpen: boolean; payment: ExtendedPayment | null }>({ isOpen: false, payment: null });

  const openViewModal  = (p: ExtendedPayment) => setViewModal({ isOpen: true,  payment: p });
  const closeViewModal = ()                    => setViewModal({ isOpen: false, payment: null });

  useEffect(() => {
    window.setTimeout(() => setLoading(false), 180);
  }, []);

  useEffect(() => { if (!toast) return; const t = window.setTimeout(() => setToast(null), 2600); return () => window.clearTimeout(t); }, [toast]);

  const activeFilterCount = useMemo(() => [filters.status, filters.method, filters.customer, filters.invoice, filters.createdBy, filters.linked !== "all" ? filters.linked : "", filters.dateRange !== "all" ? filters.dateRange : "", filters.amount !== "all" ? filters.amount : "", ...quickFilters].filter(Boolean).length, [filters, quickFilters]);

  const filteredPayments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const result = payments.filter((p) => {
      if (query) {
        const haystack = [p.paymentId, p.invoiceNumber, p.customerName, p.customerEmail, p.amount, p.method, p.status, p.referenceNumber, p.notes, p.receiptId, formatDate(p.date), p.createdBy].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (filters.status && p.status !== filters.status) return false;
      if (filters.method && p.method !== filters.method) return false;
      if (filters.customer && p.customerId !== filters.customer) return false;
      if (filters.invoice && p.invoiceId !== filters.invoice) return false;
      if (filters.createdBy && p.createdBy !== filters.createdBy) return false;
      if (filters.linked === "linked" && p.linkState === "Unlinked") return false;
      if (filters.linked === "unlinked" && p.linkState !== "Unlinked") return false;
      if (filters.amount === "under-500" && p.amount >= 500) return false;
      if (filters.amount === "500-2000" && (p.amount < 500 || p.amount > 2000)) return false;
      if (filters.amount === "2000-plus" && p.amount < 2000) return false;
      if (filters.dateRange !== "all") {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const date = new Date(p.date); date.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today.getTime() - date.getTime()) / 86400000);
        if (filters.dateRange === "today" && diffDays !== 0) return false;
        if (filters.dateRange === "week" && (diffDays < 0 || diffDays > 6)) return false;
        if (filters.dateRange === "month" && (diffDays < 0 || diffDays > 30)) return false;
      }
      if (quickFilters.includes("completed") && p.status !== "Completed" && p.status !== "Paid") return false;
      if (quickFilters.includes("pending") && p.status !== "Pending") return false;
      if (quickFilters.includes("failed") && p.status !== "Failed") return false;
      if (quickFilters.includes("refunded") && p.status !== "Refunded") return false;
      if (quickFilters.includes("partial") && p.status !== "Partial") return false;
      if (quickFilters.includes("today") && getRelativeDateLabel(p.date) !== "Today") return false;
      if (quickFilters.includes("week")) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const date = new Date(p.date); date.setHours(0, 0, 0, 0);
        if (Math.floor((today.getTime() - date.getTime()) / 86400000) > 6) return false;
      }
      return true;
    });
    return [...result].sort((l, r) => {
      const get = (p: ExtendedPayment) => {
        switch (sortConfig.key) {
          case "amount": return p.amount;
          case "status": return p.status;
          case "paymentId": return p.paymentId;
          case "invoiceNumber": return p.invoiceNumber;
          case "customerName": return p.customerName;
          case "method": return p.method;
          default: return p.date;
        }
      };
      const lv = get(l), rv = get(r);
      if (typeof lv === "number" && typeof rv === "number") return sortConfig.direction === "asc" ? lv - rv : rv - lv;
      return sortConfig.direction === "asc" ? String(lv).localeCompare(String(rv)) : String(rv).localeCompare(String(lv));
    });
  }, [filters, payments, quickFilters, searchTerm, sortConfig]);

  const displayedPayments = filteredPayments;

  const metrics = useMemo(() => {
    const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
    const pending = payments.filter((p) => p.status === "Pending");
    const completed = payments.filter((p) => p.status === "Completed" || p.status === "Paid");
    const failedRefunded = payments.filter((p) => p.status === "Failed" || p.status === "Refunded");
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = payments.filter((p) => new Date(p.date) >= weekStart && isSuccessfulPaymentStatus(p.status));
    const thisMonth = payments.filter((p) => new Date(p.date) >= monthStart && isSuccessfulPaymentStatus(p.status));
    return {
      total: payments.length,
      totalAmount,
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, p) => s + p.amount, 0),
      completedCount: completed.length,
      completedAmount: completed.reduce((s, p) => s + p.amount, 0),
      failedRefundedCount: failedRefunded.length,
      failedRefundedAmount: failedRefunded.reduce((s, p) => s + p.amount, 0),
      weekAmount: thisWeek.reduce((s, p) => s + p.amount, 0),
      weekCount: thisWeek.length,
      monthAmount: thisMonth.reduce((s, p) => s + p.amount, 0),
      monthCount: thisMonth.length,
    };
  }, [payments]);

  const customerOptions = useMemo(() => customers.map((c) => ({ value: c.id, label: c.name })), [customers]);

  const openCreateModal = () => { setEditorMode("create"); setEditingPaymentId(null); setFormState(EMPTY_FORM); setFormErrors({}); setShowEditor(true); };
  const openEditModal = (p: ExtendedPayment) => { setEditorMode("edit"); setEditingPaymentId(p.paymentId); setFormState({ invoiceId: p.invoiceId, customerId: p.customerId, amount: String(p.amount), method: p.method, status: p.status, date: p.date, referenceNumber: p.referenceNumber, notes: p.notes, createdBy: p.createdBy }); setFormErrors({}); setShowEditor(true); };

  const handleSavePayment = () => {
    const errs = validatePaymentForm(formState, invoices, payments as Payment[], editingPaymentId ?? undefined);
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const payload: Payment = { id: editingPaymentId ?? buildPaymentId(payments.length), paymentId: editingPaymentId ?? buildPaymentId(payments.length), invoiceId: formState.invoiceId, customerId: formState.customerId, amount: roundMoney(Number(formState.amount)), method: formState.method, status: formState.status, date: formState.date, notes: formState.notes.trim(), referenceNumber: formState.referenceNumber.trim(), receiptId: `${formState.referenceNumber.trim() || "RCPT"}-${Date.now().toString().slice(-4)}`, createdBy: formState.createdBy.trim(), updatedAt: new Date().toISOString().split("T")[0] };
    if (editorMode === "create") {
      addPayment(payload);
    } else {
      updatePayment(payload);
    }
    setShowEditor(false);
    setToast({ type: "success", message: editorMode === "create" ? t.payments.toast.created : t.payments.toast.updated });
  };

  const openDeleteConfirm = (p: ExtendedPayment) => {
    setDeleteTarget(p);
    setPinValue("");
    setPinError("");
    setDeleting(false);
  };

  const handleConfirmDelete = () => {
    if (pinValue !== "123") { setPinError("PIN must be 123"); return; }
    if (!deleteTarget) return;
    setDeleting(true);
    deletePaymentCtx(deleteTarget.id ?? deleteTarget.paymentId);
    setSelectedRows((c) => c.filter((id) => id !== deleteTarget.paymentId));
    setToast({ type: "success", message: t.payments.toast.deleted });
    setDeleteTarget(null);
    setPinValue("");
    setPinError("");
    setDeleting(false);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
    setPinValue("");
    setPinError("");
    setDeleting(false);
  };

  const handleBulkAction = (action: "export" | "refund" | "note" | "delete" | "print") => {
    if (selectedRows.length === 0) return;
    if (action === "delete") { setToast({ type: "warning", message: "Bulk delete is ready after individual review." }); return; }
    if (action === "refund") {
      rawPayments
        .filter((p) => selectedRows.includes(p.paymentId ?? p.id))
        .forEach((p) => updatePayment({ ...p, status: "Refunded" as PaymentStatus, updatedAt: new Date().toISOString().split("T")[0] }));
      setToast({ type: "success", message: "Selected payments marked as refunded." }); return;
    }
    if (action === "note") { setToast({ type: "info", message: "Use the details drawer to add notes." }); return; }
    setToast({ type: "success", message: action === "print" ? "Receipt print queue prepared." : "Filtered export prepared." });
  };

  const toggleQuickFilter = (v: QuickFilter) => setQuickFilters((c) => c.includes(v) ? c.filter((f) => f !== v) : [...c, v]);
  const clearFilters = () => { setFilters({ status: "", method: "", dateRange: "all", amount: "all", customer: "", invoice: "", linked: "all", createdBy: "" }); setQuickFilters([]); setSearchTerm(""); };
  const requestSort = (key: SortKey) => setSortConfig((c) => ({ key, direction: c.key === key ? (c.direction === "asc" ? "desc" : "asc") : (key === "date" || key === "amount" ? "desc" : "asc") }));

  return (
    <>
      <div className="pay-page" dir={isArabic ? "rtl" : "ltr"}>

        {/* ── Page Header ── */}
        <div className="pay-page-header">
          <div className="pay-header-left">
            <div className="pay-header-icon"><BarChart2 size={22} /></div>
            <div>
              <p>{t.payments.pageSubtitle}</p>
            </div>
          </div>
          <div className="pay-header-actions">
            <button type="button" className="primary-btn" onClick={openCreateModal}><Plus size={16} />{t.payments.newPayment}</button>
            <button type="button" className="secondary-btn" onClick={() => setToast({ type: "success", message: "Filtered payments export prepared." })}><Download size={16} />{t.payments.export}</button>
          </div>
        </div>

        {/* ── KPI Row (4 cards) ── */}
        <div className="pay-kpi-row">
          {[
            { emoji: "💳", label: "إجمالي الدفعات",   value: formatMoney(metrics.totalAmount),           count: metrics.total },
            { emoji: "✅", label: "مكتملة",             value: formatMoney(metrics.completedAmount),       count: metrics.completedCount },
            { emoji: "⏳", label: "معلقة",              value: formatMoney(metrics.pendingAmount),         count: metrics.pendingCount },
            { emoji: "↩️", label: "فاشلة / مُستردة",   value: formatMoney(metrics.failedRefundedAmount),  count: metrics.failedRefundedCount },
          ].map((kpi) => (
            <div key={kpi.label} className="pay-kpi-card">
              <div className="pay-kpi-icon">{kpi.emoji}</div>
              <div className="pay-kpi-body">
                <p>{kpi.label}</p>
                <strong>{kpi.value}</strong>
                <div className="pay-kpi-bottom">
                  <small>{kpi.count} دفعة</small>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Body: Table + Sidebar ── */}
        <div className="pay-body-layout">

        {/* ── Recent Operations ── */}
        <div className="pay-card pay-operations-card pay-operations-col">
          {/* Toolbar */}
          <div className="pay-ops-header">
            <div className="pay-ops-title-block">
              <h2>عمليات الدفع الأخيرة</h2>
              <span className="pay-ops-count-badge">{filteredPayments.length} دفعة</span>
            </div>
            <div className="pay-ops-toolbar">
              <div className="search-input-wrap">
                <SearchBox
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث برقم الدفعة أو الفاتورة أو اسم العميل..."
                  fullWidth
                />
              </div>
              <button type="button" className={`toolbar-btn ${showMoreFilters ? "active" : ""}`}
                onClick={() => setShowMoreFilters((c) => !c)}>
                <Filter size={14} /> {t.payments.filterBtn}
                {activeFilterCount > 0 && <span className="count-pill">{activeFilterCount}</span>}
              </button>
            </div>
          </div>

          {showMoreFilters && (
            <div className="pay-filters-panel">
              <div className="primary-filters-row">
                <label className="filter-control"><span>{t.payments.filter.status}</span>
                  <select className="app-select-control" value={filters.status} onChange={(e) => setFilters((c) => ({ ...c, status: e.target.value }))}>
                    <option value="">{t.payments.filter.allStatuses}</option>
                    {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
                  </select>
                </label>
                <label className="filter-control"><span>{t.payments.filter.method}</span>
                  <select className="app-select-control" value={filters.method} onChange={(e) => setFilters((c) => ({ ...c, method: e.target.value }))}>
                    <option value="">{t.payments.filter.allMethods}</option>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{formatMethod(m)}</option>)}
                  </select>
                </label>
                <label className="filter-control"><span>{t.payments.filter.dateRange}</span>
                  <select className="app-select-control" value={filters.dateRange} onChange={(e) => setFilters((c) => ({ ...c, dateRange: e.target.value as DateRangeFilter }))}>
                    <option value="all">{t.payments.filter.allDates}</option>
                    <option value="today">{t.payments.filter.today}</option>
                    <option value="week">{t.payments.filter.thisWeek}</option>
                    <option value="month">{t.payments.filter.thisMonth}</option>
                  </select>
                </label>
                <label className="filter-control"><span>{t.payments.filter.customer}</span>
                  <select className="app-select-control" value={filters.customer} onChange={(e) => setFilters((c) => ({ ...c, customer: e.target.value }))}>
                    <option value="">{t.payments.filter.customer}</option>
                    {customerOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </label>
              </div>
              <div className="quick-chip-row">
                {(["completed", "pending", "failed", "refunded", "partial", "today", "week"] as QuickFilter[]).map((f) => (
                  <button key={f} type="button" className={`quick-chip ${quickFilters.includes(f) ? "active" : ""}`} onClick={() => toggleQuickFilter(f)}>
                    {quickChipLabel(f)}
                  </button>
                ))}
                {activeFilterCount > 0 && <button type="button" className="clear-link-btn" onClick={clearFilters}>{t.common.reset}</button>}
              </div>
            </div>
          )}

          {selectedRows.length > 0 && (
            <div className="bulk-actions-bar">
              <span>{selectedRows.length} selected</span>
              <div className="bulk-action-list">
                <button type="button" className="toolbar-btn subtle" onClick={() => handleBulkAction("export")}>Export</button>
                <button type="button" className="toolbar-btn subtle" onClick={() => handleBulkAction("refund")}>Mark refunded</button>
                <button type="button" className="toolbar-btn danger-lite" onClick={() => handleBulkAction("delete")}>Delete</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="table-loading-state">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton-row" />)}</div>
          ) : filteredPayments.length === 0 ? (
            <div className="state-card empty-state"><Receipt size={18} /><div><strong>No matching payments found</strong><p>Adjust your filters or record a new payment.</p></div></div>
          ) : (
            <>
              <div className="payments-table-wrap app-table-wrap atlas-table-wrapper">
                <table className="payments-table app-data-table atlas-table">
                  <colgroup>
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "2%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="col-code px-3 py-3 whitespace-nowrap truncate"><button type="button" className="sortable-head" onClick={() => requestSort("paymentId")}>{t.payments.cols.paymentId} <ArrowUpDown size={13} /></button></th>
                      <th className="col-code px-3 py-3 whitespace-nowrap truncate"><button type="button" className="sortable-head" onClick={() => requestSort("invoiceNumber")}>{t.payments.cols.invoice} <ArrowUpDown size={13} /></button></th>
                      <th className="col-entity px-3 py-3 whitespace-nowrap truncate">{t.payments.cols.customer}</th>
                      <th className="col-num px-3 py-3 whitespace-nowrap truncate"><button type="button" className="sortable-head align-right" onClick={() => requestSort("amount")}>{t.payments.cols.amount} <ArrowUpDown size={13} /></button></th>
                      <th className="col-badge px-3 py-3 whitespace-nowrap truncate"><button type="button" className="sortable-head" onClick={() => requestSort("method")}>{t.payments.cols.method} <ArrowUpDown size={13} /></button></th>
                      <th className="col-badge px-3 py-3 whitespace-nowrap truncate"><button type="button" className="sortable-head" onClick={() => requestSort("status")}>{t.payments.cols.status} <ArrowUpDown size={13} /></button></th>
                      <th className="col-date px-3 py-3 whitespace-nowrap truncate"><button type="button" className="sortable-head" onClick={() => requestSort("date")}>{t.payments.cols.date} <ArrowUpDown size={13} /></button></th>
                      <th className="col-code px-3 py-3 whitespace-nowrap truncate">{t.payments.cols.reference}</th>
                      <th className="col-actions px-3 py-3 whitespace-nowrap truncate">{t.payments.cols.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedPayments.map((p) => {
                      const methodEmoji: Record<string, string> = { Cash: "💵", Card: "💳", "Bank Transfer": "🏦", Wallet: "👛", Cheque: "📄" };
                      const isUnlinked = p.invoiceNumber === "Unlinked" || p.linkState === "Unlinked";
                      return (
                        <tr
                          key={p.paymentId}
                          onClick={() => openViewModal(p)}
                          className="cursor-pointer odd:bg-white even:bg-slate-50/30"
                        >
                          <td className="col-code px-3 py-3 whitespace-nowrap truncate">
                            <div className="primary-cell">
                              <strong>{p.paymentId}</strong>
                              <span>{p.receiptId}</span>
                            </div>
                          </td>
                          <td className="col-code px-3 py-3 whitespace-nowrap truncate">
                            <div className="primary-cell app-cell-stack">
                              {isUnlinked ? (
                                <span style={{ color: "#F59E0B", fontSize: 12, fontWeight: 500 }}>⚠ غير مرتبطة</span>
                              ) : (
                                <>
                                  <button type="button" className="text-link-btn" onClick={(e) => { e.stopPropagation(); openViewModal(p); }}>
                                    {p.invoiceNumber}
                                  </button>
                                  <small>{formatLinkState(p.linkState)}</small>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="col-entity px-3 py-3 whitespace-nowrap truncate">{p.customerName}</td>
                          <td className="col-num px-3 py-3 whitespace-nowrap truncate">
                            <div className="amount-cell">
                              <strong style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatMoney(p.amount)}</strong>
                              <span style={{ fontSize: 11, color: "#94A3B8" }}>الرصيد بعد: {formatMoney(p.remainingAfterPayment)}</span>
                            </div>
                          </td>
                          <td className="col-badge px-3 py-3 whitespace-nowrap truncate">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F8FAFC", borderRadius: 8, padding: "3px 10px", fontSize: 12 }}>
                              {methodEmoji[p.method] ?? ""} {formatMethod(p.method)}
                            </span>
                          </td>
                          <td className="col-badge px-3 py-3 whitespace-nowrap truncate"><span className={`status-pill ${getStatusTone(p.status)}`}>{formatStatus(p.status)}</span></td>
                          <td className="col-date px-3 py-3 whitespace-nowrap truncate">
                            <div className="primary-cell">
                              <strong>{formatDate(p.date)}</strong>
                              <span>{p.relativeDate}</span>
                            </div>
                          </td>
                          <td className="col-code px-3 py-3 whitespace-nowrap truncate">
                            <div className="primary-cell">
                              <strong>{p.referenceNumber}</strong>
                            </div>
                          </td>
                          <td className="col-actions px-3 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <TableActions
                              onView={() => openViewModal(p)}
                              onEdit={() => openEditModal(p)}
                              onDelete={() => openDeleteConfirm(p)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

               <div className="pay-ops-footer">
                <span className="pay-footer-info">عرض الكل — {filteredPayments.length} دفعة</span>
              </div>
            </>
          )}
        </div>


        </div>{/* end pay-body-layout */}
      </div>

      {/* ── Modals ── */}
      {showEditor && (
        <PaymentEditor mode={editorMode} values={formState} errors={formErrors} invoices={invoices} customers={customers} payments={payments}
          onChange={(field, value) => { setFormState((c) => ({ ...c, [field]: value })); setFormErrors((c) => ({ ...c, [field]: undefined })); }}
          onClose={() => setShowEditor(false)} onSubmit={handleSavePayment} />
      )}
      {detailsPayment && (
        <PaymentDetailModal payment={detailsPayment} activeTab={detailTab} onChangeTab={setDetailTab} onClose={() => setDetailsPayment(null)} />
      )}
      {viewModal.isOpen && viewModal.payment && (
        <PaymentViewModal
          payment={viewModal.payment}
          onClose={closeViewModal}
          onEdit={() => { closeViewModal(); openEditModal(viewModal.payment!); }}
          onDelete={() => { closeViewModal(); openDeleteConfirm(viewModal.payment!); }}
        />
      )}

      {deleteTarget && createPortal(
        <>
          <div className="pay-delete-overlay" onClick={cancelDelete} />
          <div className="pay-delete-modal" role="dialog" aria-modal="true" dir={isArabic ? "rtl" : "ltr"}>
            <div className="pay-delete-head">
              <h3>{t.common.confirmDelete}</h3>
              <button type="button" className="pay-delete-close" onClick={cancelDelete}><X size={16} /></button>
            </div>
            <div className="pay-delete-body">
              <p>{isArabic ? "هل أنت متأكد من حذف" : "Are you sure you want to delete"} <strong>{deleteTarget.paymentId}</strong></p>
              <div className="pay-pin-field">
                <label>{isArabic ? "أدخل الرقم السري 123 لتأكيد الحذف" : "Enter PIN 123 to confirm deletion"}</label>
                <input type="password" value={pinValue} onChange={(e) => { setPinValue(e.target.value); setPinError(""); }} placeholder="123" maxLength={10} autoFocus />
                {pinError && <small className="field-error">{pinError}</small>}
              </div>
            </div>
            <div className="pay-delete-footer">
              <button type="button" className="pay-btn-secondary" onClick={cancelDelete}>{t.common.cancel}</button>
              <button type="button" className="pay-btn-danger" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? (isArabic ? "جاري الحذف..." : "Deleting...") : t.common.delete}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {toast && <div className={`payment-toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
