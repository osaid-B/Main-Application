import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  BarChart2,
  Banknote,
  Calendar,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Download,
  Eye,
  FileText,
  Filter,
  Landmark,
  Pencil,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trash2,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import "./Payments.css";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { useData } from "../context/DataContext";
import {
  calculateInvoiceRemainingAmount,
  getCustomerById,
  getInvoiceById,
  isSuccessfulPaymentStatus,
  roundMoney,
} from "../data/relations";
import type { Customer, Invoice, Payment, PaymentMethod, PaymentStatus } from "../data/types";
import { useSettings } from "../context/SettingsContext";

type DateRangeFilter = "all" | "today" | "week" | "month";
type AmountFilter = "all" | "under-500" | "500-2000" | "2000-plus";
type LinkedFilter = "all" | "linked" | "unlinked";
type SortKey = "amount" | "status" | "paymentId" | "invoiceNumber" | "date" | "customerName" | "method";
type SortDirection = "asc" | "desc";
type DrawerTab = "overview" | "invoice" | "notes" | "receipt" | "history";
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

type MenuState = { paymentId: string; top: number; left: number };
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

const DELETE_CONFIRMATION_CODE = "123";

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
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(roundMoney(value));
}

function formatDate(value: string) {
  if (!value) return "No date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
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
  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  return `In ${diffDays} days`;
}

function formatStatus(status: PaymentStatus) {
  if (status === "Paid") return "Completed";
  return status;
}

function formatMethod(method: PaymentMethod) {
  if (method === "Bank Transfer") return "Bank transfer";
  return method;
}

function getMethodIcon(method: PaymentMethod) {
  switch (method) {
    case "Card": return <CreditCard size={14} />;
    case "Bank Transfer": return <Landmark size={14} />;
    case "Wallet": return <Wallet size={14} />;
    case "Cheque": return <FileText size={14} />;
    default: return <Banknote size={14} />;
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
      customerName: customer?.name ?? payment.customerName ?? "Unknown Customer",
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
      title={mode === "create" ? "Record Payment" : "Edit Payment"}
      description="Record a payment and link it to an invoice for accurate tracking."
      className="payment-modal-card"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="button" onClick={onSubmit}>
            {mode === "create" ? "Save payment" : "Save changes"}
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
                  <h3>Payment Setup</h3>
                  <p>Capture the core payment details.</p>
                </div>
              </div>
              <div className="payment-form-grid">
                <div className="field-block">
                  <Select
                    label="Invoice *"
                    value={values.invoiceId}
                    onChange={(e) => {
                      const inv = invoices.find((entry) => entry.id === e.target.value);
                      onChange("invoiceId", e.target.value);
                      onChange("customerId", inv?.customerId ?? "");
                    }}
                    placeholder="Select invoice"
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
                    label="Customer *"
                    value={selectedCustomer?.name ?? ""}
                    readOnly
                    placeholder="Select customer"
                    error={errors.customerId}
                  />
                </div>

                <div className="field-block">
                  <div className="amount-input-wrap">
                    <span className="amount-prefix">$</span>
                    <Input
                      variant="number"
                      label="Amount *"
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
                      label="Method *"
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
                      label="Status *"
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
                      label="Payment Date *"
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
                  <h3>Reference &amp; Note</h3>
                  <p>Add reference details and any relevant notes.</p>
                </div>
              </div>
              <div className="payment-form-grid">
                <label className="field-block">
                  <span>Reference</span>
                  <input value={values.referenceNumber}
                    onChange={(e) => onChange("referenceNumber", e.target.value)}
                    placeholder="Receipt or transfer reference" />
                  {errors.referenceNumber && <small className="field-error">{errors.referenceNumber}</small>}
                </label>

                <label className="field-block">
                  <span>Created By</span>
                  <div className="select-icon-wrap">
                    <input value={values.createdBy}
                      onChange={(e) => onChange("createdBy", e.target.value)} placeholder="Captured by" />
                    <Receipt size={15} className="select-icon" />
                  </div>
                  {errors.createdBy && <small className="field-error">{errors.createdBy}</small>}
                </label>

                <label className="field-block field-span-full">
                  <span>Note</span>
                  <textarea rows={4} value={values.notes}
                    onChange={(e) => onChange("notes", e.target.value)}
                    placeholder="Optional operational note..." />
                </label>
              </div>
            </section>
          </div>

          {/* Right Panel */}
          <aside className="payment-editor-summary">
            <div className="summary-panel">
              <div className="summary-panel-header">
                <div className="summary-panel-icon blue"><BarChart2 size={18} /></div>
                <h4>Invoice Impact</h4>
              </div>
              <ul className="summary-list">
                <li><span>Invoice total</span><b>{formatMoney(Number(selectedInvoice?.total ?? selectedInvoice?.amount ?? 0))}</b></li>
                <li><span>Outstanding now</span><b>{formatMoney(remainingAmount)}</b></li>
                <li><span>This payment</span><b className="blue-val">{formatMoney(amountValue)}</b></li>
                <li><span>Balance after</span><b>{formatMoney(remainingAfter)}</b></li>
              </ul>
            </div>

            <div className="summary-panel">
              <div className="summary-panel-header">
                <div className="summary-panel-icon green"><CheckCircle2 size={18} /></div>
                <h4>Operational Checks</h4>
              </div>
              <ul className="summary-checks">
                <li><CheckCircle2 size={15} className="check-ok" />Only successful payments reduce invoice balances.</li>
                <li><CheckCircle2 size={15} className="check-ok" />Use refunded or failed statuses when the amount should not apply.</li>
                <li><CheckCircle2 size={15} className="check-ok" />Reference numbers help with reconciliation and receipt tracking.</li>
              </ul>
            </div>

            <div className="summary-panel">
              <div className="summary-panel-header">
                <div className="summary-panel-icon slate"><FileText size={18} /></div>
                <h4>Payment Summary</h4>
              </div>
              {selectedInvoice ? (
                <ul className="summary-list">
                  <li><span>Invoice</span><b>{selectedInvoice.id}</b></li>
                  <li><span>Customer</span><b>{selectedCustomer?.name ?? "—"}</b></li>
                  <li><span>Method</span><b>{formatMethod(values.method)}</b></li>
                  <li><span>Status</span><b>{formatStatus(values.status)}</b></li>
                </ul>
              ) : (
                <div className="summary-empty">
                  <strong>No invoice selected</strong>
                  <p>Select an invoice to see summary.</p>
                </div>
              )}
            </div>
          </aside>
        </div>

    </Modal>
  );
}

/* ── Delete Dialog ────────────────────────────────────── */
function DeleteDialog({ payment, code, onCodeChange, onClose, onConfirm }: {
  payment: ExtendedPayment; code: string;
  onCodeChange: (v: string) => void; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-card delete-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="payment-modal-header">
          <div><h2>Delete payment</h2><p>This will remove the payment and may change the linked invoice balance.</p></div>
          <button type="button" className="icon-btn subtle" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="delete-confirm-body">
          <p>Enter <strong>{DELETE_CONFIRMATION_CODE}</strong> to delete <strong>{payment.paymentId}</strong>.</p>
          <input value={code} onChange={(e) => onCodeChange(e.target.value)} placeholder="Enter confirmation code" />
        </div>
        <div className="payment-modal-footer">
          <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="danger-btn" disabled={code !== DELETE_CONFIRMATION_CODE} onClick={onConfirm}>Delete payment</button>
        </div>
      </div>
    </div>
  );
}

/* ── Details Drawer ───────────────────────────────────── */
function PaymentDetailsDrawer({ payment, activeTab, onChangeTab, onClose }: {
  payment: ExtendedPayment; activeTab: DrawerTab;
  onChangeTab: (tab: DrawerTab) => void; onClose: () => void;
}) {
  return (
    <div className="payment-drawer-overlay" onClick={onClose}>
      <aside className="payment-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="payment-drawer-header">
          <div>
            <span className="eyebrow">Payment details</span>
            <h2>{payment.paymentId}</h2>
            <p>{payment.customerName} · {formatMoney(payment.amount)}</p>
          </div>
          <button type="button" className="icon-btn subtle" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="drawer-tab-strip">
          {(["overview", "invoice", "notes", "receipt", "history"] as DrawerTab[]).map((tab) => (
            <button key={tab} type="button" className={`drawer-tab-btn ${activeTab === tab ? "active" : ""}`} onClick={() => onChangeTab(tab)}>
              {tab === "overview" && "Overview"}{tab === "invoice" && "Invoice link"}
              {tab === "notes" && "Notes"}{tab === "receipt" && "Receipt"}{tab === "history" && "History"}
            </button>
          ))}
        </div>
        <div className="payment-drawer-content">
          {activeTab === "overview" && (
            <div className="drawer-grid">
              <div className="drawer-card">
                <h3>Payment overview</h3>
                <dl className="key-value-list">
                  <div><dt>Status</dt><dd><span className={`status-pill ${getStatusTone(payment.status)}`}>{formatStatus(payment.status)}</span></dd></div>
                  <div><dt>Method</dt><dd>{formatMethod(payment.method)}</dd></div>
                  <div><dt>Payment date</dt><dd>{formatDate(payment.date)}</dd></div>
                  <div><dt>Reference</dt><dd>{payment.referenceNumber}</dd></div>
                  <div><dt>Receipt ID</dt><dd>{payment.receiptId}</dd></div>
                  <div><dt>Created by</dt><dd>{payment.createdBy}</dd></div>
                </dl>
              </div>
              <div className="drawer-card">
                <h3>Financial impact</h3>
                <dl className="key-value-list">
                  <div><dt>Invoice total</dt><dd>{formatMoney(payment.invoiceTotal)}</dd></div>
                  <div><dt>Amount paid before</dt><dd>{formatMoney(payment.amountPaidBefore)}</dd></div>
                  <div><dt>This payment</dt><dd>{formatMoney(payment.amount)}</dd></div>
                  <div><dt>Remaining after</dt><dd>{formatMoney(payment.remainingAfterPayment)}</dd></div>
                  <div><dt>Link state</dt><dd>{payment.linkState}</dd></div>
                  <div><dt>Updated</dt><dd>{formatDate(payment.updatedAt)}</dd></div>
                </dl>
              </div>
            </div>
          )}
          {activeTab === "invoice" && (
            <div className="drawer-card">
              <h3>Invoice linkage</h3>
              <dl className="key-value-list">
                <div><dt>Linked invoice</dt><dd>{payment.invoiceNumber}</dd></div>
                <div><dt>Customer</dt><dd>{payment.customerName}</dd></div>
                <div><dt>Customer email</dt><dd>{payment.customerEmail}</dd></div>
                <div><dt>Application status</dt><dd>{payment.linkState}</dd></div>
                <div><dt>Remaining invoice balance</dt><dd>{formatMoney(payment.remainingAfterPayment)}</dd></div>
              </dl>
            </div>
          )}
          {activeTab === "notes" && (
            <div className="drawer-card"><h3>Notes</h3><p className="drawer-body-text">{payment.notes || "No notes recorded for this payment."}</p></div>
          )}
          {activeTab === "receipt" && (
            <div className="drawer-card">
              <h3>Receipt and audit references</h3>
              <dl className="key-value-list">
                <div><dt>Receipt ID</dt><dd>{payment.receiptId}</dd></div>
                <div><dt>Reference number</dt><dd>{payment.referenceNumber}</dd></div>
                <div><dt>Printable receipt</dt><dd>Available from row actions</dd></div>
              </dl>
            </div>
          )}
          {activeTab === "history" && (
            <div className="drawer-card">
              <h3>History</h3>
              <ul className="history-list">
                <li><span>Payment captured</span><b>{formatDate(payment.date)}</b></li>
                <li><span>Status last updated</span><b>{formatDate(payment.updatedAt)}</b></li>
                <li><span>Handled by</span><b>{payment.createdBy}</b></li>
              </ul>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────── */
export default function Payments() {
  const { isArabic } = useSettings();
  const {
    customers,
    invoices,
    payments: rawPayments,
    addPayment,
    updatePayment,
    deletePayment: deletePaymentCtx,
  } = useData();
  const menuRef = useRef<HTMLDivElement | null>(null);
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
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showEditor, setShowEditor] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [formState, setFormState] = useState<PaymentForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<PaymentFormErrors>({});
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [detailsPayment, setDetailsPayment] = useState<ExtendedPayment | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("overview");
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExtendedPayment | null>(null);
  const [deleteCode, setDeleteCode] = useState("");

  useEffect(() => {
    window.setTimeout(() => setLoading(false), 180);
  }, []);

  useEffect(() => { if (!toast) return; const t = window.setTimeout(() => setToast(null), 2600); return () => window.clearTimeout(t); }, [toast]);

  useEffect(() => {
    if (!menuState) return;
    const handleOutside = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuState(null); };
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuState(null); };
    const closeMenu = () => setMenuState(null);
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [menuState]);

  const activeFilterCount = useMemo(() => [filters.status, filters.method, filters.customer, filters.invoice, filters.createdBy, filters.linked !== "all" ? filters.linked : "", filters.dateRange !== "all" ? filters.dateRange : "", filters.amount !== "all" ? filters.amount : "", ...quickFilters].filter(Boolean).length, [filters, quickFilters]);

  const filteredPayments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const result = payments.filter((p) => {
      if (query) {
        const haystack = [p.paymentId, p.invoiceNumber, p.customerName, p.customerEmail, p.amount, p.method, p.status, p.referenceNumber, p.notes, p.receiptId].join(" ").toLowerCase();
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

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / rowsPerPage));
  const paginatedPayments = filteredPayments.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => { setPage(1); }, [searchTerm, filters, quickFilters, rowsPerPage]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

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

  const trendData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(); date.setDate(date.getDate() - (6 - i)); date.setHours(0, 0, 0, 0);
      const next = new Date(date); next.setDate(next.getDate() + 1);
      const dayTotal = payments.filter((p) => {
        const d = new Date(p.date);
        return d >= date && d < next && isSuccessfulPaymentStatus(p.status);
      }).reduce((s, p) => s + p.amount, 0);
      return { label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: dayTotal };
    });
  }, [payments]);

  const methodBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach((p) => { if (!isSuccessfulPaymentStatus(p.status)) return; map[p.method] = (map[p.method] || 0) + p.amount; });
    const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
    const colors: Record<string, string> = { Cash: "#2563eb", "Bank Transfer": "#16a34a", Cheque: "#7c3aed", Card: "#f59e0b", Wallet: "#f97316" };
    return Object.entries(map).map(([method, amount]) => ({ method, amount, pct: amount / total, color: colors[method] ?? "#94a3b8" }));
  }, [payments]);

  const aiInsights = useMemo(() => {
    const weekAmount = metrics.weekAmount;
    const prevWeekAmount = trendData.slice(0, 3).reduce((s, d) => s + d.value, 0);
    const trend = prevWeekAmount > 0 ? ((weekAmount - prevWeekAmount) / prevWeekAmount) * 100 : 0;
    return [
      {
        icon: trend >= 0 ? TrendingUp : TrendingDown,
        color: trend >= 0 ? "green" : "red",
        title: trend >= 0 ? "Collections improving" : "Collections declining",
        desc: `Your collection rate is ${trend >= 0 ? "up" : "down"} ${Math.abs(trend).toFixed(1)}% vs last 7 days.`,
      },
      {
        icon: AlertCircle,
        color: metrics.pendingCount > 0 ? "amber" : "green",
        title: metrics.pendingCount > 0 ? `${metrics.pendingCount} payments pending` : "No pending payments",
        desc: metrics.pendingCount > 0 ? `Total amount ${formatMoney(metrics.pendingAmount)} requires your attention.` : "All payments are processed.",
      },
      {
        icon: metrics.failedRefundedCount === 0 ? CheckCircle2 : XCircle,
        color: metrics.failedRefundedCount === 0 ? "green" : "red",
        title: metrics.failedRefundedCount === 0 ? "No failed payments" : `${metrics.failedRefundedCount} failed/refunded`,
        desc: metrics.failedRefundedCount === 0 ? "No failed payments in the last 7 days." : `${formatMoney(metrics.failedRefundedAmount)} affected.`,
      },
    ];
  }, [metrics, trendData]);

  const customerOptions = useMemo(() => customers.map((c) => ({ value: c.id, label: c.name })), [customers]);

  const openCreateModal = () => { setEditorMode("create"); setEditingPaymentId(null); setFormState(EMPTY_FORM); setFormErrors({}); setShowEditor(true); };
  const openEditModal = (p: ExtendedPayment) => { setEditorMode("edit"); setEditingPaymentId(p.paymentId); setFormState({ invoiceId: p.invoiceId, customerId: p.customerId, amount: String(p.amount), method: p.method, status: p.status, date: p.date, referenceNumber: p.referenceNumber, notes: p.notes, createdBy: p.createdBy }); setFormErrors({}); setShowEditor(true); setMenuState(null); };

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
    setToast({ type: "success", message: editorMode === "create" ? "Payment recorded successfully." : "Payment updated successfully." });
  };

  const handleDeletePayment = () => {
    if (!deleteTarget) return;
    deletePaymentCtx(deleteTarget.id ?? deleteTarget.paymentId);
    setDeleteTarget(null); setDeleteCode("");
    setSelectedRows((c) => c.filter((id) => id !== deleteTarget.paymentId));
    setToast({ type: "success", message: "Payment deleted successfully." });
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
  const toggleAllRows = (checked: boolean) => setSelectedRows(checked ? paginatedPayments.map((p) => p.paymentId) : []);
  const requestSort = (key: SortKey) => setSortConfig((c) => ({ key, direction: c.key === key ? (c.direction === "asc" ? "desc" : "asc") : (key === "date" || key === "amount" ? "desc" : "asc") }));
  const allVisibleSelected = paginatedPayments.length > 0 && paginatedPayments.every((p) => selectedRows.includes(p.paymentId));

  return (
    <>
      <div className="pay-page" dir={isArabic ? "rtl" : "ltr"}>

        {/* ── Page Header ── */}
        <div className="pay-page-header">
          <div className="pay-header-left">
            <div className="pay-header-icon"><BarChart2 size={22} /></div>
            <div>
              <h1>Payments Overview</h1>
              <p>Real-time overview of collections, payments and cash flow.</p>
            </div>
          </div>
          <div className="pay-header-actions">
            <button type="button" className="primary-btn" onClick={openCreateModal}><Plus size={16} />New payment</button>
            <button type="button" className="secondary-btn" onClick={() => setToast({ type: "success", message: "Filtered payments export prepared." })}><Download size={16} />Export</button>
          </div>
        </div>

        {/* ── KPI Row (4 cards) ── */}
        <div className="pay-kpi-row">
          {[
            { icon: CreditCard, color: "blue", label: "Total Payments", value: formatMoney(metrics.totalAmount), meta: "↑ 18.7%", metaClass: "up", sub: "vs last 7 days" },
            { icon: CalendarRange, color: "purple", label: "Pending Payments", value: formatMoney(metrics.pendingAmount), meta: "↑ 12.4%", metaClass: "up", sub: `${metrics.pendingCount} payments` },
            { icon: CheckCircle2, color: "green", label: "Completed Payments", value: formatMoney(metrics.completedAmount), meta: "↑ 25.4%", metaClass: "up", sub: `${metrics.completedCount} payments` },
            { icon: XCircle, color: "red", label: "Failed / Refunded", value: formatMoney(metrics.failedRefundedAmount), meta: "— 0%", metaClass: "", sub: `${metrics.failedRefundedCount} payments` },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="pay-kpi-card">
                <div className={`pay-kpi-icon ${kpi.color}`}><Icon size={18} /></div>
                <div className="pay-kpi-body">
                  <p>{kpi.label}</p>
                  <strong>{kpi.value}</strong>
                  <div className="pay-kpi-bottom">
                    {kpi.meta && <span className={`pay-kpi-trend ${kpi.metaClass}`}>{kpi.meta}</span>}
                    <small>{kpi.sub}</small>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Body: Table + Sidebar ── */}
        <div className="pay-body-layout">

        {/* ── Recent Operations ── */}
        <div className="pay-card pay-operations-card pay-operations-col">
          {/* Toolbar */}
          <div className="pay-ops-header">
            <div className="pay-ops-title-block">
              <h2>Recent Payment Operations</h2>
              <span className="pay-ops-count-badge">{filteredPayments.length} payment{filteredPayments.length === 1 ? "" : "s"}</span>
            </div>
            <div className="pay-ops-toolbar">
              <div className="search-input-wrap">
                <Search size={15} />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by reference, inv, customer..." />
              </div>
              <button type="button" className={`toolbar-btn ${showMoreFilters ? "active" : ""}`}
                onClick={() => setShowMoreFilters((c) => !c)}>
                <Filter size={14} /> Filters
                {activeFilterCount > 0 && <span className="count-pill">{activeFilterCount}</span>}
              </button>
            </div>
          </div>

          {showMoreFilters && (
            <div className="pay-filters-panel">
              <div className="primary-filters-row">
                <label className="filter-control"><span>Status</span>
                  <select className="app-select-control" value={filters.status} onChange={(e) => setFilters((c) => ({ ...c, status: e.target.value }))}>
                    <option value="">All statuses</option>
                    {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{formatStatus(s)}</option>)}
                  </select>
                </label>
                <label className="filter-control"><span>Method</span>
                  <select className="app-select-control" value={filters.method} onChange={(e) => setFilters((c) => ({ ...c, method: e.target.value }))}>
                    <option value="">All methods</option>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{formatMethod(m)}</option>)}
                  </select>
                </label>
                <label className="filter-control"><span>Date range</span>
                  <select className="app-select-control" value={filters.dateRange} onChange={(e) => setFilters((c) => ({ ...c, dateRange: e.target.value as DateRangeFilter }))}>
                    <option value="all">All dates</option>
                    <option value="today">Today</option>
                    <option value="week">This week</option>
                    <option value="month">This month</option>
                  </select>
                </label>
                <label className="filter-control"><span>Customer</span>
                  <select className="app-select-control" value={filters.customer} onChange={(e) => setFilters((c) => ({ ...c, customer: e.target.value }))}>
                    <option value="">All customers</option>
                    {customerOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </label>
              </div>
              <div className="quick-chip-row">
                {(["completed", "pending", "failed", "refunded", "partial", "today", "week"] as QuickFilter[]).map((f) => (
                  <button key={f} type="button" className={`quick-chip ${quickFilters.includes(f) ? "active" : ""}`} onClick={() => toggleQuickFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
                {activeFilterCount > 0 && <button type="button" className="clear-link-btn" onClick={clearFilters}>Clear filters</button>}
              </div>
            </div>
          )}

          {selectedRows.length > 0 && (
            <div className="bulk-actions-bar">
              <span>{selectedRows.length} selected</span>
              <div className="bulk-action-list">
                <button type="button" className="toolbar-btn subtle" onClick={() => handleBulkAction("export")}>Export</button>
                <button type="button" className="toolbar-btn subtle" onClick={() => handleBulkAction("refund")}>Mark refunded</button>
                <button type="button" className="toolbar-btn subtle" onClick={() => handleBulkAction("print")}>Print receipts</button>
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
              <div className="payments-table-wrap app-table-wrap">
                <table className="payments-table app-data-table">
                  <thead>
                    <tr>
                      <th className="checkbox-col">
                        <input type="checkbox" checked={allVisibleSelected} onChange={(e) => toggleAllRows(e.target.checked)} />
                      </th>
                      <th><button type="button" className="sortable-head" onClick={() => requestSort("paymentId")}>Payment ID <ArrowUpDown size={13} /></button></th>
                      <th><button type="button" className="sortable-head" onClick={() => requestSort("invoiceNumber")}>Invoice <ArrowUpDown size={13} /></button></th>
                      <th>Customer</th>
                      <th className="align-right"><button type="button" className="sortable-head align-right" onClick={() => requestSort("amount")}>Amount <ArrowUpDown size={13} /></button></th>
                      <th><button type="button" className="sortable-head" onClick={() => requestSort("method")}>Method <ArrowUpDown size={13} /></button></th>
                      <th><button type="button" className="sortable-head" onClick={() => requestSort("status")}>Status <ArrowUpDown size={13} /></button></th>
                      <th><button type="button" className="sortable-head" onClick={() => requestSort("date")}>Payment Date <ArrowUpDown size={13} /></button></th>
                      <th>Reference</th>
                      <th className="actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPayments.map((p) => (
                      <tr key={p.paymentId} onClick={() => { setDetailsPayment(p); setDrawerTab("overview"); }}>
                        <td onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedRows.includes(p.paymentId)}
                            onChange={(e) => setSelectedRows((c) => e.target.checked ? [...c, p.paymentId] : c.filter((id) => id !== p.paymentId))} />
                        </td>
                        <td>
                          <div className="primary-cell">
                            <strong>{p.paymentId}</strong>
                            <span>{p.receiptId}</span>
                          </div>
                        </td>
                        <td>
                          <div className="primary-cell app-cell-stack">
                            <button type="button" className="text-link-btn" onClick={(e) => { e.stopPropagation(); setDetailsPayment(p); setDrawerTab("invoice"); }}>{p.invoiceNumber}</button>
                            <small>{p.linkState}</small>
                          </div>
                        </td>
                        <td>{p.customerName}</td>
                        <td className="align-right">
                          <div className="amount-cell">
                            <strong>{formatMoney(p.amount)}</strong>
                            <span>Balance after {formatMoney(p.remainingAfterPayment)}</span>
                          </div>
                        </td>
                        <td><span className="method-badge">{getMethodIcon(p.method)}{formatMethod(p.method)}</span></td>
                        <td><span className={`status-pill ${getStatusTone(p.status)}`}>{formatStatus(p.status)}</span></td>
                        <td>
                          <div className="primary-cell">
                            <strong>{formatDate(p.date)}</strong>
                            <span>{p.relativeDate}</span>
                          </div>
                        </td>
                        <td>
                          <div className="primary-cell">
                            <strong>{p.referenceNumber}</strong>
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="row-actions">
                            <button type="button" className="pay-action-btn" title="View" onClick={() => { setDetailsPayment(p); setDrawerTab("overview"); }}><Eye size={14} /></button>
                            <button type="button" className="pay-action-btn" title="Edit" onClick={() => openEditModal(p)}><Pencil size={14} /></button>
                            <button type="button" className="pay-action-btn danger" title="Delete" onClick={() => { setDeleteTarget(p); setDeleteCode(""); }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pay-ops-footer">
                <span className="pay-footer-info">
                  Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filteredPayments.length)} of {filteredPayments.length} payments
                </span>
                <div className="pay-footer-center">
                  <button type="button" className="pay-pg-btn" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                    .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                      if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("…");
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "…" ? (
                        <span key={`e-${idx}`} className="pay-pg-ellipsis">…</span>
                      ) : (
                        <button key={item} type="button"
                          className={`pay-pg-btn${page === item ? " active" : ""}`}
                          onClick={() => setPage(item as number)}>
                          {item}
                        </button>
                      )
                    )}
                  <button type="button" className="pay-pg-btn" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</button>
                </div>
                <div className="pay-footer-rpp">
                  <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
                    {[10, 25, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
                  </select>
                </div>
              </div>
              <div className="pay-view-all-row">
                <button type="button" className="pay-view-all-btn" onClick={() => { setSearchTerm(""); clearFilters(); }}>
                  View all payments <ChevronRight size={14} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="pay-sidebar">
          {/* Payment Summary */}
          <div className="pay-sidebar-card">
            <h3 className="pay-sidebar-heading">Payment Summary</h3>
            <p className="pay-sidebar-subheading">Methods</p>
            <ul className="pay-sidebar-methods">
              {[
                { label: "Cash", color: "#2563eb" },
                { label: "Bank Transfer", color: "#16a34a" },
                { label: "Card", color: "#f59e0b" },
                { label: "Cheque", color: "#7c3aed" },
                { label: "Other", color: "#94a3b8" },
              ].map((m) => {
                const found = methodBreakdown.find((b) => b.method === m.label);
                const pct = found ? (found.pct * 100).toFixed(1) : "0";
                const amt = found ? formatMoney(found.amount) : formatMoney(0);
                return (
                  <li key={m.label} className="pay-method-row">
                    <span className="pay-method-dot" style={{ background: m.color }} />
                    <span className="pay-method-name">{m.label}</span>
                    <span className="pay-method-amount">{amt} ({pct}%)</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="pay-sidebar-card">
            <h3 className="pay-sidebar-heading">Quick Actions</h3>
            <ul className="pay-sidebar-actions">
              {[
                { icon: Plus, label: "Record Payment", action: openCreateModal },
                { icon: FileText, label: "Apply to Invoice", action: () => setToast({ type: "info", message: "Open an invoice to apply a payment." }) },
                { icon: RotateCcw, label: "Refund Payment", action: () => setToast({ type: "info", message: "Select a payment to refund." }) },
                { icon: ArrowUpDown, label: "Payment Matching", action: () => setToast({ type: "info", message: "Payment matching is coming soon." }) },
                { icon: Landmark, label: "Bank Reconciliation", action: () => setToast({ type: "info", message: "Bank reconciliation is coming soon." }) },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <button type="button" className="pay-sidebar-action-btn" onClick={item.action}>
                      <span className="pay-sidebar-action-icon"><Icon size={15} /></span>
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* AI Insights */}
          <div className="pay-sidebar-card">
            <h3 className="pay-sidebar-heading">
              <Sparkles size={14} className="insights-star" /> AI Insights
            </h3>
            <ul className="pay-sidebar-insights">
              {aiInsights.map((ins, i) => {
                const Icon = ins.icon;
                return (
                  <li key={i} className="pay-sidebar-insight-item">
                    <div className={`pay-insight-icon ${ins.color}`}><Icon size={15} /></div>
                    <div>
                      <strong>{ins.title}</strong>
                      <p>{ins.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        </div>{/* end pay-body-layout */}
      </div>

      {/* ── Modals ── */}
      {showEditor && (
        <PaymentEditor mode={editorMode} values={formState} errors={formErrors} invoices={invoices} customers={customers} payments={payments}
          onChange={(field, value) => { setFormState((c) => ({ ...c, [field]: value })); setFormErrors((c) => ({ ...c, [field]: undefined })); }}
          onClose={() => setShowEditor(false)} onSubmit={handleSavePayment} />
      )}
      {detailsPayment && (
        <PaymentDetailsDrawer payment={detailsPayment} activeTab={drawerTab} onChangeTab={setDrawerTab} onClose={() => setDetailsPayment(null)} />
      )}
      {deleteTarget && (
        <DeleteDialog payment={deleteTarget} code={deleteCode} onCodeChange={setDeleteCode}
          onClose={() => { setDeleteTarget(null); setDeleteCode(""); }} onConfirm={handleDeletePayment} />
      )}

      {menuState && createPortal(
        <div ref={menuRef} className="payment-action-menu" style={{ top: menuState.top, left: menuState.left, transform: menuState.top > window.innerHeight / 2 ? "translateY(-100%)" : "none" }}>
          {(() => {
            const p = payments.find((entry) => entry.paymentId === menuState.paymentId);
            if (!p) return null;
            return (
              <>
                <button type="button" onClick={() => { setDetailsPayment(p); setDrawerTab("overview"); setMenuState(null); }}><Eye size={15} />Open</button>
                <button type="button" onClick={() => openEditModal(p)}><Plus size={15} />Edit payment</button>
                <button type="button" onClick={() => { setToast({ type: "success", message: `Receipt ${p.receiptId} downloaded.` }); setMenuState(null); }}><Download size={15} />Download receipt</button>
                <button type="button" onClick={() => { setToast({ type: "success", message: `Receipt ${p.receiptId} sent to print.` }); setMenuState(null); }}><Printer size={15} />Print receipt</button>
                <button type="button" onClick={() => { setDetailsPayment(p); setDrawerTab("notes"); setMenuState(null); }}><FileText size={15} />Add note</button>
                <button type="button" onClick={() => {
                  updatePayment({ ...p, status: "Refunded" as PaymentStatus, updatedAt: new Date().toISOString().split("T")[0] });
                  setToast({ type: "success", message: "Payment marked as refunded." }); setMenuState(null);
                }}><RotateCcw size={15} />Mark as refunded</button>
                <button type="button" className="danger" onClick={() => { setDeleteTarget(p); setDeleteCode(""); setMenuState(null); }}><Trash2 size={15} />Delete</button>
              </>
            );
          })()}
        </div>,
        document.body
      )}

      {toast && <div className={`payment-toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
