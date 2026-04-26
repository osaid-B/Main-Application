import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  Banknote,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Download,
  Eye,
  FileText,
  Filter,
  Landmark,
  MoreHorizontal,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import "./Payments.css";
import OverflowContent from "../components/ui/OverflowContent";
import TableFooter from "../components/ui/TableFooter";
import { getCustomers, getInvoices, getPayments, savePayments } from "../data/storage";
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

type MenuState = {
  paymentId: string;
  top: number;
  left: number;
};

type ToastState = {
  type: "success" | "error" | "warning" | "info";
  message: string;
} | null;

const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "Card",
  "Bank Transfer",
  "Wallet",
  "Cheque",
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  "Completed",
  "Pending",
  "Failed",
  "Refunded",
  "Partial",
  "Cancelled",
];

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

function buildPaymentId(index: number) {
  return `PAY-${2001 + index}`;
}

function normalizeMethod(method?: string): PaymentMethod {
  if (
    method === "Cash" ||
    method === "Card" ||
    method === "Bank Transfer" ||
    method === "Wallet" ||
    method === "Cheque"
  ) {
    return method;
  }

  return "Cash";
}

function normalizeStatus(status?: string): PaymentStatus {
  if (
    status === "Paid" ||
    status === "Pending" ||
    status === "Partial" ||
    status === "Completed" ||
    status === "Failed" ||
    status === "Refunded" ||
    status === "Cancelled"
  ) {
    return status;
  }

  return "Completed";
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(roundMoney(value));
}

function formatDate(value: string) {
  if (!value) return "No date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
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
    case "Card":
      return <CreditCard size={14} />;
    case "Bank Transfer":
      return <Landmark size={14} />;
    case "Wallet":
      return <Wallet size={14} />;
    case "Cheque":
      return <FileText size={14} />;
    default:
      return <Banknote size={14} />;
  }
}

function getStatusTone(status: PaymentStatus) {
  switch (status) {
    case "Completed":
    case "Paid":
      return "status-success";
    case "Pending":
    case "Partial":
      return "status-warning";
    case "Failed":
      return "status-danger";
    case "Refunded":
      return "status-info";
    case "Cancelled":
      return "status-muted";
    default:
      return "status-muted";
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
        .filter(
          (entry) =>
            entry.invoiceId === payment.invoiceId &&
            entry.id !== payment.id &&
            entry.paymentId !== payment.paymentId &&
            isSuccessfulPaymentStatus(entry.status)
        )
        .reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0)
    );

    const remainingAfterPayment = invoice
      ? roundMoney(
          Math.max(
            invoiceTotal -
              paidByOthers -
              (isSuccessfulPaymentStatus(normalizedStatus) ? Number(payment.amount ?? 0) : 0),
            0
          )
        )
      : 0;

    let linkState: ExtendedPayment["linkState"] = "Unlinked";

    if (invoice) {
      if (!isSuccessfulPaymentStatus(normalizedStatus)) {
        linkState = "Not applied";
      } else if (remainingAfterPayment <= 0) {
        linkState = "Fully applied";
      } else {
        linkState = "Partially applied";
      }
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

function validatePaymentForm(
  values: PaymentForm,
  invoices: Invoice[],
  payments: Payment[],
  editingPaymentId?: string
) {
  const errors: PaymentFormErrors = {};

  if (!values.invoiceId.trim()) errors.invoiceId = "Invoice is required.";

  const invoice = invoices.find((entry) => entry.id === values.invoiceId);
  if (!invoice) {
    errors.invoiceId = "Select a valid invoice.";
    return errors;
  }

  if (!values.customerId.trim()) errors.customerId = "Customer is required.";
  if (!values.amount.trim()) {
    errors.amount = "Amount is required.";
  } else if (Number.isNaN(Number(values.amount))) {
    errors.amount = "Amount must be numeric.";
  } else if (Number(values.amount) <= 0) {
    errors.amount = "Amount must be greater than zero.";
  }

  if (!values.date.trim()) errors.date = "Payment date is required.";
  if (!values.referenceNumber.trim()) errors.referenceNumber = "Reference is required.";
  if (!values.createdBy.trim()) errors.createdBy = "Created by is required.";

  const remainingAmount = roundMoney(
    calculateInvoiceRemainingAmount(
      invoice,
      payments.filter(
        (payment) => payment.id !== editingPaymentId && payment.paymentId !== editingPaymentId
      )
    )
  );

  if (
    values.amount &&
    !Number.isNaN(Number(values.amount)) &&
    isSuccessfulPaymentStatus(values.status) &&
    Number(values.amount) > remainingAmount
  ) {
    errors.amount = `Remaining invoice balance is ${formatMoney(remainingAmount)}.`;
  }

  return errors;
}

function PaymentEditor({
  mode,
  values,
  errors,
  invoices,
  customers,
  payments,
  onChange,
  onClose,
  onSubmit,
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
  const selectedInvoice = invoices.find((invoice) => invoice.id === values.invoiceId);
  const selectedCustomer = customers.find((customer) => customer.id === values.customerId);
  const remainingAmount = selectedInvoice
    ? calculateInvoiceRemainingAmount(selectedInvoice, payments)
    : 0;
  const amountValue = Number(values.amount || 0);
  const remainingAfter = selectedInvoice
    ? roundMoney(Math.max(remainingAmount - (isSuccessfulPaymentStatus(values.status) ? amountValue : 0), 0))
    : 0;

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="payment-modal-header">
          <div>
            <h2>{mode === "create" ? "Record Payment" : "Edit Payment"}</h2>
            <p>Capture invoice-linked receipts with clearer financial impact before saving.</p>
          </div>
          <button type="button" className="icon-btn subtle" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="payment-modal-body">
          <div className="payment-form-sections">
            <section className="payment-form-section">
              <div className="section-heading">
                <h3>Payment setup</h3>
                <p>Choose the invoice, payment status, and collection method.</p>
              </div>
              <div className="payment-form-grid">
                <label className="field-block">
                  <span>Invoice</span>
                  <select
                    className="app-select-control"
                    value={values.invoiceId}
                    onChange={(event) => {
                      const invoice = invoices.find((entry) => entry.id === event.target.value);
                      onChange("invoiceId", event.target.value);
                      onChange("customerId", invoice?.customerId ?? "");
                    }}
                  >
                    <option value="">Select invoice</option>
                    {invoices.map((invoice) => {
                      const customer = customers.find((entry) => entry.id === invoice.customerId);
                      return (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.id} - {customer?.name ?? "Unknown customer"}
                        </option>
                      );
                    })}
                  </select>
                  {errors.invoiceId && <small className="field-error">{errors.invoiceId}</small>}
                </label>

                <label className="field-block">
                  <span>Customer</span>
                  <input value={selectedCustomer?.name ?? ""} readOnly placeholder="Customer name" />
                  {errors.customerId && <small className="field-error">{errors.customerId}</small>}
                </label>

                <label className="field-block">
                  <span>Amount</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={values.amount}
                    onChange={(event) => onChange("amount", event.target.value)}
                    placeholder="Enter amount"
                  />
                  {errors.amount && <small className="field-error">{errors.amount}</small>}
                </label>

                <label className="field-block">
                  <span>Method</span>
                  <select className="app-select-control" value={values.method} onChange={(event) => onChange("method", event.target.value)}>
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {formatMethod(method)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-block">
                  <span>Status</span>
                  <select className="app-select-control" value={values.status} onChange={(event) => onChange("status", event.target.value)}>
                    {PAYMENT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-block">
                  <span>Payment date</span>
                  <input type="date" value={values.date} onChange={(event) => onChange("date", event.target.value)} />
                  {errors.date && <small className="field-error">{errors.date}</small>}
                </label>
              </div>
            </section>

            <section className="payment-form-section">
              <div className="section-heading">
                <h3>Reference and note</h3>
                <p>Keep receipt references and collection context easy to audit.</p>
              </div>
              <div className="payment-form-grid">
                <label className="field-block">
                  <span>Reference</span>
                  <input
                    value={values.referenceNumber}
                    onChange={(event) => onChange("referenceNumber", event.target.value)}
                    placeholder="Receipt or transfer reference"
                  />
                  {errors.referenceNumber && (
                    <small className="field-error">{errors.referenceNumber}</small>
                  )}
                </label>

                <label className="field-block">
                  <span>Created by</span>
                  <input
                    value={values.createdBy}
                    onChange={(event) => onChange("createdBy", event.target.value)}
                    placeholder="Captured by"
                  />
                  {errors.createdBy && <small className="field-error">{errors.createdBy}</small>}
                </label>

                <label className="field-block field-span-full">
                  <span>Note</span>
                  <textarea
                    rows={3}
                    value={values.notes}
                    onChange={(event) => onChange("notes", event.target.value)}
                    placeholder="Optional operational note"
                  />
                </label>
              </div>
            </section>
          </div>

          <aside className="payment-editor-summary">
            <div className="summary-card">
              <span className="summary-label">Invoice impact</span>
              <strong>{selectedInvoice?.id ?? "No invoice selected"}</strong>
              <ul className="summary-list">
                <li><span>Invoice total</span><b>{formatMoney(Number(selectedInvoice?.total ?? selectedInvoice?.amount ?? 0))}</b></li>
                <li><span>Outstanding now</span><b>{formatMoney(remainingAmount)}</b></li>
                <li><span>This payment</span><b>{formatMoney(amountValue)}</b></li>
                <li><span>Balance after</span><b>{formatMoney(remainingAfter)}</b></li>
              </ul>
            </div>

            <div className="summary-card subtle-surface">
              <span className="summary-label">Operational checks</span>
              <div className="summary-hints">
                <p>Only successful payments reduce invoice balances.</p>
                <p>Use refunded or failed statuses when the amount should not apply.</p>
                <p>Reference numbers help with reconciliation and receipt tracking.</p>
              </div>
            </div>
          </aside>
        </div>

        <div className="payment-modal-footer">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-btn" onClick={onSubmit}>
            {mode === "create" ? "Save payment" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteDialog({
  payment,
  code,
  onCodeChange,
  onClose,
  onConfirm,
}: {
  payment: ExtendedPayment;
  code: string;
  onCodeChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-card delete-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="payment-modal-header">
          <div>
            <h2>Delete payment</h2>
            <p>This will remove the payment and may change the linked invoice balance.</p>
          </div>
          <button type="button" className="icon-btn subtle" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <div className="delete-confirm-body">
          <p>
            Enter <strong>{DELETE_CONFIRMATION_CODE}</strong> to delete <strong>{payment.paymentId}</strong>.
          </p>
          <input value={code} onChange={(event) => onCodeChange(event.target.value)} placeholder="Enter confirmation code" />
        </div>
        <div className="payment-modal-footer">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="danger-btn"
            disabled={code !== DELETE_CONFIRMATION_CODE}
            onClick={onConfirm}
          >
            Delete payment
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentDetailsDrawer({
  payment,
  activeTab,
  onChangeTab,
  onClose,
}: {
  payment: ExtendedPayment;
  activeTab: DrawerTab;
  onChangeTab: (tab: DrawerTab) => void;
  onClose: () => void;
}) {
  return (
    <div className="payment-drawer-overlay" onClick={onClose}>
      <aside className="payment-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="payment-drawer-header">
          <div>
            <span className="eyebrow">Payment details</span>
            <h2>{payment.paymentId}</h2>
            <p>{payment.customerName} · {formatMoney(payment.amount)}</p>
          </div>
          <button type="button" className="icon-btn subtle" onClick={onClose} aria-label="Close drawer">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-tab-strip">
          {(["overview", "invoice", "notes", "receipt", "history"] as DrawerTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`drawer-tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => onChangeTab(tab)}
            >
              {tab === "overview" && "Overview"}
              {tab === "invoice" && "Invoice link"}
              {tab === "notes" && "Notes"}
              {tab === "receipt" && "Receipt"}
              {tab === "history" && "History"}
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
            <div className="drawer-card">
              <h3>Notes</h3>
              <p className="drawer-body-text">{payment.notes || "No notes recorded for this payment."}</p>
            </div>
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

export default function Payments() {
  const { isArabic } = useSettings();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<ExtendedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    status: "",
    method: "",
    dateRange: "all",
    amount: "all",
    customer: "",
    invoice: "",
    linked: "all",
    createdBy: "",
  });
  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>([]);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "date",
    direction: "desc",
  });
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
    const syncData = () => {
      try {
        const latestCustomers = getCustomers();
        const latestInvoices = getInvoices();
        const latestPayments = getPayments();

        setCustomers(latestCustomers);
        setInvoices(latestInvoices);
        setPayments(normalizePaymentList(latestPayments, latestInvoices, latestCustomers));
        setError("");
      } catch {
        setError("Unable to load payment records right now.");
      } finally {
        window.setTimeout(() => setLoading(false), 180);
      }
    };

    syncData();
    window.addEventListener("focus", syncData);
    window.addEventListener("storage", syncData);

    return () => {
      window.removeEventListener("focus", syncData);
      window.removeEventListener("storage", syncData);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!menuState) return;

    const handleOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuState(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuState(null);
    };

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

  const activeFilterCount = useMemo(() => {
    return [
      filters.status,
      filters.method,
      filters.customer,
      filters.invoice,
      filters.createdBy,
      filters.linked !== "all" ? filters.linked : "",
      filters.dateRange !== "all" ? filters.dateRange : "",
      filters.amount !== "all" ? filters.amount : "",
      ...quickFilters,
    ].filter(Boolean).length;
  }, [filters, quickFilters]);

  const filteredPayments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const result = payments.filter((payment) => {
      if (query) {
        const haystack = [
          payment.paymentId,
          payment.invoiceNumber,
          payment.customerName,
          payment.customerEmail,
          payment.amount,
          payment.method,
          payment.status,
          payment.referenceNumber,
          payment.notes,
          payment.receiptId,
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      if (filters.status && payment.status !== filters.status) return false;
      if (filters.method && payment.method !== filters.method) return false;
      if (filters.customer && payment.customerId !== filters.customer) return false;
      if (filters.invoice && payment.invoiceId !== filters.invoice) return false;
      if (filters.createdBy && payment.createdBy !== filters.createdBy) return false;
      if (filters.linked === "linked" && payment.linkState === "Unlinked") return false;
      if (filters.linked === "unlinked" && payment.linkState !== "Unlinked") return false;

      if (filters.amount === "under-500" && payment.amount >= 500) return false;
      if (filters.amount === "500-2000" && (payment.amount < 500 || payment.amount > 2000)) return false;
      if (filters.amount === "2000-plus" && payment.amount < 2000) return false;

      if (filters.dateRange !== "all") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const date = new Date(payment.date);
        date.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today.getTime() - date.getTime()) / 86400000);
        if (filters.dateRange === "today" && diffDays !== 0) return false;
        if (filters.dateRange === "week" && (diffDays < 0 || diffDays > 6)) return false;
        if (filters.dateRange === "month" && (diffDays < 0 || diffDays > 30)) return false;
      }

      if (quickFilters.includes("completed") && payment.status !== "Completed" && payment.status !== "Paid") {
        return false;
      }
      if (quickFilters.includes("pending") && payment.status !== "Pending") return false;
      if (quickFilters.includes("failed") && payment.status !== "Failed") return false;
      if (quickFilters.includes("refunded") && payment.status !== "Refunded") return false;
      if (quickFilters.includes("partial") && payment.status !== "Partial") return false;
      if (quickFilters.includes("today") && getRelativeDateLabel(payment.date) !== "Today") return false;

      if (quickFilters.includes("week")) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const date = new Date(payment.date);
        date.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today.getTime() - date.getTime()) / 86400000);
        if (diffDays < 0 || diffDays > 6) return false;
      }

      return true;
    });

    return [...result].sort((left, right) => {
      const getValue = (payment: ExtendedPayment) => {
        switch (sortConfig.key) {
          case "amount":
            return payment.amount;
          case "status":
            return payment.status;
          case "paymentId":
            return payment.paymentId;
          case "invoiceNumber":
            return payment.invoiceNumber;
          case "customerName":
            return payment.customerName;
          case "method":
            return payment.method;
          case "date":
          default:
            return payment.date;
        }
      };

      const leftValue = getValue(left);
      const rightValue = getValue(right);

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return sortConfig.direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
      }

      return sortConfig.direction === "asc"
        ? String(leftValue).localeCompare(String(rightValue))
        : String(rightValue).localeCompare(String(leftValue));
    });
  }, [filters, payments, quickFilters, searchTerm, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / rowsPerPage));
  const paginatedPayments = filteredPayments.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters, quickFilters, rowsPerPage]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const summary = useMemo(() => {
    const completedToday = filteredPayments.filter(
      (payment) =>
        (payment.status === "Completed" || payment.status === "Paid") && payment.relativeDate === "Today"
    ).length;
    const pendingCount = filteredPayments.filter((payment) => payment.status === "Pending").length;
    const partialToday = filteredPayments.filter(
      (payment) => payment.status === "Partial" && payment.relativeDate === "Today"
    ).length;
    const unlinked = filteredPayments.filter((payment) => payment.linkState === "Unlinked").length;
    const refundedThisWeek = filteredPayments.filter((payment) => {
      if (payment.status !== "Refunded") return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const date = new Date(payment.date);
      date.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - date.getTime()) / 86400000);
      return diffDays >= 0 && diffDays <= 6;
    }).length;

    if (pendingCount > 0) return `${pendingCount} payment${pendingCount === 1 ? " is" : "s are"} pending verification`;
    if (unlinked > 0) return `${unlinked} payment${unlinked === 1 ? " is" : "s are"} not linked to any invoice`;
    if (partialToday > 0) return `${partialToday} partial payment${partialToday === 1 ? " was" : "s were"} recorded today`;
    if (refundedThisWeek > 0) return `${refundedThisWeek} refund${refundedThisWeek === 1 ? " was" : "s were"} processed this week`;
    if (completedToday > 0) return `${completedToday} payment${completedToday === 1 ? "" : "s"} completed today`;
    return "Payments are clear for the current view";
  }, [filteredPayments]);

  const metrics = useMemo(() => {
    const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const todayCollected = filteredPayments
      .filter((payment) => payment.relativeDate === "Today" && isSuccessfulPaymentStatus(payment.status))
      .reduce((sum, payment) => sum + payment.amount, 0);
    const pendingCount = filteredPayments.filter((payment) => payment.status === "Pending").length;
    const refundedCount = filteredPayments.filter((payment) => payment.status === "Refunded").length;
    const failedCount = filteredPayments.filter((payment) => payment.status === "Failed").length;
    const monthCollected = filteredPayments
      .filter((payment) => {
        const now = new Date();
        const date = new Date(payment.date);
        return (
          isSuccessfulPaymentStatus(payment.status) &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, payment) => sum + payment.amount, 0);

    return {
      totalPayments: filteredPayments.length,
      todayCollected,
      pendingCount,
      refundedCount,
      failedCount,
      monthCollected,
      totalAmount,
    };
  }, [filteredPayments]);

  const customerOptions = useMemo(
    () => customers.map((customer) => ({ value: customer.id, label: customer.name })),
    [customers]
  );

  const createdByOptions = useMemo(
    () => Array.from(new Set(payments.map((payment) => payment.createdBy))).filter(Boolean),
    [payments]
  );

  const openCreateModal = () => {
    setEditorMode("create");
    setEditingPaymentId(null);
    setFormState(EMPTY_FORM);
    setFormErrors({});
    setShowEditor(true);
  };

  const openEditModal = (payment: ExtendedPayment) => {
    setEditorMode("edit");
    setEditingPaymentId(payment.paymentId);
    setFormState({
      invoiceId: payment.invoiceId,
      customerId: payment.customerId,
      amount: String(payment.amount),
      method: payment.method,
      status: payment.status,
      date: payment.date,
      referenceNumber: payment.referenceNumber,
      notes: payment.notes,
      createdBy: payment.createdBy,
    });
    setFormErrors({});
    setShowEditor(true);
    setMenuState(null);
  };

  const handleSavePayment = () => {
    const currentPayments = payments as Payment[];
    const errors = validatePaymentForm(formState, invoices, currentPayments, editingPaymentId ?? undefined);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const paymentPayload: Payment = {
      id: editingPaymentId ?? buildPaymentId(payments.length),
      paymentId: editingPaymentId ?? buildPaymentId(payments.length),
      invoiceId: formState.invoiceId,
      customerId: formState.customerId,
      amount: roundMoney(Number(formState.amount)),
      method: formState.method,
      status: formState.status,
      date: formState.date,
      notes: formState.notes.trim(),
      referenceNumber: formState.referenceNumber.trim(),
      receiptId: `${formState.referenceNumber.trim() || "RCPT"}-${Date.now().toString().slice(-4)}`,
      createdBy: formState.createdBy.trim(),
      updatedAt: new Date().toISOString().split("T")[0],
    };

    const nextRawPayments =
      editorMode === "create"
        ? [paymentPayload, ...(payments as Payment[])]
        : (payments as Payment[]).map((payment) =>
            payment.paymentId === editingPaymentId ? { ...payment, ...paymentPayload } : payment
          );

    savePayments(nextRawPayments);
    setPayments(normalizePaymentList(nextRawPayments, invoices, customers));
    setShowEditor(false);
    setToast({
      type: "success",
      message: editorMode === "create" ? "Payment recorded successfully." : "Payment updated successfully.",
    });
  };

  const handleDeletePayment = () => {
    if (!deleteTarget) return;
    const nextRawPayments = (payments as Payment[]).filter(
      (payment) => payment.paymentId !== deleteTarget.paymentId
    );
    savePayments(nextRawPayments);
    setPayments(normalizePaymentList(nextRawPayments, invoices, customers));
    setDeleteTarget(null);
    setDeleteCode("");
    setSelectedRows((current) => current.filter((id) => id !== deleteTarget.paymentId));
    setToast({ type: "success", message: "Payment deleted successfully." });
  };

  const handleBulkAction = (action: "export" | "refund" | "note" | "delete" | "print") => {
    if (selectedRows.length === 0) return;

    if (action === "delete") {
      setToast({ type: "warning", message: "Bulk delete is ready after individual review." });
      return;
    }

    if (action === "refund") {
      const nextRawPayments = (payments as Payment[]).map((payment) =>
        selectedRows.includes(payment.paymentId ?? payment.id)
          ? {
              ...payment,
              status: "Refunded" as PaymentStatus,
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : payment
      );
      savePayments(nextRawPayments);
      setPayments(normalizePaymentList(nextRawPayments, invoices, customers));
      setToast({ type: "success", message: "Selected payments marked as refunded." });
      return;
    }

    if (action === "note") {
      setToast({ type: "info", message: "Use the details drawer to add notes to selected payments." });
      return;
    }

    setToast({
      type: "success",
      message: action === "print" ? "Receipt print queue prepared." : "Filtered export prepared.",
    });
  };

  const toggleQuickFilter = (value: QuickFilter) => {
    setQuickFilters((current) =>
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]
    );
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      method: "",
      dateRange: "all",
      amount: "all",
      customer: "",
      invoice: "",
      linked: "all",
      createdBy: "",
    });
    setQuickFilters([]);
    setSearchTerm("");
  };

  const toggleAllRows = (checked: boolean) => {
    setSelectedRows(checked ? paginatedPayments.map((payment) => payment.paymentId) : []);
  };

  const requestSort = (key: SortKey) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === "asc" ? "desc" : "asc" };
      }

      return { key, direction: key === "date" || key === "amount" ? "desc" : "asc" };
    });
  };

  const allVisibleSelected =
    paginatedPayments.length > 0 &&
    paginatedPayments.every((payment) => selectedRows.includes(payment.paymentId));

  return (
    <>
      <div className="payments-workspace" dir={isArabic ? "rtl" : "ltr"}>
        <section className="payments-hero card-surface">
          <div className="hero-copy">
            <span className="eyebrow">Payments workspace</span>
            <h1>Payments</h1>
            <p>Manage collections, trace invoice-linked payments, and act on exceptions from one finance workspace.</p>
          </div>

          <div className="hero-actions">
            <button type="button" className="primary-btn" onClick={openCreateModal}>
              <Plus size={16} />
              New payment
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setToast({ type: "success", message: "Filtered payments export prepared." })}
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </section>

        <section className="payments-kpi-grid">
          <article className="kpi-card card-surface">
            <span className="kpi-icon"><Receipt size={18} /></span>
            <div><p>Total payments</p><strong>{metrics.totalPayments}</strong><small>{formatMoney(metrics.totalAmount)} in view</small></div>
          </article>
          <article className="kpi-card card-surface">
            <span className="kpi-icon success"><CheckCircle2 size={18} /></span>
            <div><p>Collected today</p><strong>{formatMoney(metrics.todayCollected)}</strong><small>Applied to active invoices</small></div>
          </article>
          <article className="kpi-card card-surface">
            <span className="kpi-icon warning"><CalendarRange size={18} /></span>
            <div><p>Pending payments</p><strong>{metrics.pendingCount}</strong><small>Awaiting verification</small></div>
          </article>
          <article className="kpi-card card-surface">
            <span className="kpi-icon info"><RotateCcw size={18} /></span>
            <div><p>Refunded payments</p><strong>{metrics.refundedCount}</strong><small>Processed this view</small></div>
          </article>
          <article className="kpi-card card-surface">
            <span className="kpi-icon danger"><AlertCircle size={18} /></span>
            <div><p>Failed payments</p><strong>{metrics.failedCount}</strong><small>Need payment follow-up</small></div>
          </article>
          <article className="kpi-card card-surface">
            <span className="kpi-icon neutral"><Banknote size={18} /></span>
            <div><p>This month</p><strong>{formatMoney(metrics.monthCollected)}</strong><small>Collected this period</small></div>
          </article>
        </section>

        <section className={`payments-main card-surface ${showMoreFilters ? "filters-open" : ""}`}>
          <div className="payments-toolbar-row">
            <div className="search-input-wrap">
              <Search size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by payment ID, invoice number, customer, amount, method, or reference"
              />
            </div>

            <div className="toolbar-actions">
              <button
                type="button"
                className={`toolbar-btn ${showMoreFilters ? "active" : ""}`}
                onClick={() => setShowMoreFilters((current) => !current)}
                aria-expanded={showMoreFilters}
              >
                <Filter size={15} />
                Filters
              </button>
              <button
                type="button"
                className={`toolbar-btn subtle ${showMoreFilters ? "active" : ""}`}
                onClick={() => setShowMoreFilters((current) => !current)}
                aria-expanded={showMoreFilters}
              >
                <ChevronDown size={15} />
                More Filters
                {activeFilterCount > 0 && <span className="count-pill">{activeFilterCount}</span>}
              </button>
            </div>
          </div>

          <div className="primary-filters-row">
            <label className="filter-control">
              <span>Status</span>
              <select className="app-select-control" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                <option value="">All statuses</option>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>{formatStatus(status)}</option>
                ))}
              </select>
            </label>
            <label className="filter-control">
              <span>Method</span>
              <select className="app-select-control" value={filters.method} onChange={(event) => setFilters((current) => ({ ...current, method: event.target.value }))}>
                <option value="">All methods</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>{formatMethod(method)}</option>
                ))}
              </select>
            </label>
            <label className="filter-control">
              <span>Date range</span>
              <select className="app-select-control" value={filters.dateRange} onChange={(event) => setFilters((current) => ({ ...current, dateRange: event.target.value as DateRangeFilter }))}>
                <option value="all">All dates</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>
            </label>
            <label className="filter-control">
              <span>Amount</span>
              <select className="app-select-control" value={filters.amount} onChange={(event) => setFilters((current) => ({ ...current, amount: event.target.value as AmountFilter }))}>
                <option value="all">All amounts</option>
                <option value="under-500">Under $500</option>
                <option value="500-2000">$500 to $2,000</option>
                <option value="2000-plus">$2,000+</option>
              </select>
            </label>
          </div>

          {showMoreFilters && (
            <div className="advanced-filters-panel">
              <label className="filter-control">
                <span>Customer</span>
                <select className="app-select-control" value={filters.customer} onChange={(event) => setFilters((current) => ({ ...current, customer: event.target.value }))}>
                  <option value="">All customers</option>
                  {customerOptions.map((customer) => (
                    <option key={customer.value} value={customer.value}>{customer.label}</option>
                  ))}
                </select>
              </label>
              <label className="filter-control">
                <span>Invoice</span>
                <select className="app-select-control" value={filters.invoice} onChange={(event) => setFilters((current) => ({ ...current, invoice: event.target.value }))}>
                  <option value="">All invoices</option>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>{invoice.id}</option>
                  ))}
                </select>
              </label>
              <label className="filter-control">
                <span>Link state</span>
                <select className="app-select-control" value={filters.linked} onChange={(event) => setFilters((current) => ({ ...current, linked: event.target.value as LinkedFilter }))}>
                  <option value="all">All records</option>
                  <option value="linked">Linked only</option>
                  <option value="unlinked">Unlinked only</option>
                </select>
              </label>
              <label className="filter-control">
                <span>Created by</span>
                <select className="app-select-control" value={filters.createdBy} onChange={(event) => setFilters((current) => ({ ...current, createdBy: event.target.value }))}>
                  <option value="">Any user</option>
                  {createdByOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="quick-chip-row">
            <button type="button" className={`quick-chip ${quickFilters.includes("completed") ? "active" : ""}`} onClick={() => toggleQuickFilter("completed")}>Completed</button>
            <button type="button" className={`quick-chip ${quickFilters.includes("pending") ? "active" : ""}`} onClick={() => toggleQuickFilter("pending")}>Pending</button>
            <button type="button" className={`quick-chip ${quickFilters.includes("failed") ? "active" : ""}`} onClick={() => toggleQuickFilter("failed")}>Failed</button>
            <button type="button" className={`quick-chip ${quickFilters.includes("refunded") ? "active" : ""}`} onClick={() => toggleQuickFilter("refunded")}>Refunded</button>
            <button type="button" className={`quick-chip ${quickFilters.includes("partial") ? "active" : ""}`} onClick={() => toggleQuickFilter("partial")}>Partial</button>
            <button type="button" className={`quick-chip ${quickFilters.includes("today") ? "active" : ""}`} onClick={() => toggleQuickFilter("today")}>Today</button>
            <button type="button" className={`quick-chip ${quickFilters.includes("week") ? "active" : ""}`} onClick={() => toggleQuickFilter("week")}>This week</button>
            {activeFilterCount > 0 && (
              <button type="button" className="clear-link-btn" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          <div className="summary-strip">
            <span>{summary}</span>
            <button
              type="button"
              className="summary-link-btn"
              onClick={() => setQuickFilters((current) => (current.includes("pending") ? current : [...current, "pending"]))}
            >
              Review now
            </button>
          </div>

          {selectedRows.length > 0 && (
            <div className="bulk-actions-bar">
              <span>{selectedRows.length} selected</span>
              <div className="bulk-action-list">
                <button type="button" className="toolbar-btn subtle" onClick={() => handleBulkAction("export")}>Export selected</button>
                <button type="button" className="toolbar-btn subtle" onClick={() => handleBulkAction("refund")}>Mark as refunded</button>
                <button type="button" className="toolbar-btn subtle" onClick={() => handleBulkAction("note")}>Add note</button>
                <button type="button" className="toolbar-btn subtle" onClick={() => handleBulkAction("print")}>Print receipts</button>
                <button type="button" className="toolbar-btn danger-lite" onClick={() => handleBulkAction("delete")}>Delete selected</button>
              </div>
            </div>
          )}

          <div className="payments-table-card">
            <div className="table-card-header">
              <div>
                <h2>Payment operations</h2>
                <p>Showing {filteredPayments.length} payment{filteredPayments.length === 1 ? "" : "s"} in the current view</p>
              </div>
            </div>

            {loading ? (
              <div className="table-loading-state">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="skeleton-row" />
                ))}
              </div>
            ) : error ? (
              <div className="state-card error-state">
                <AlertCircle size={18} />
                <div>
                  <strong>Unable to load payments</strong>
                  <p>{error}</p>
                </div>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="state-card empty-state">
                <Receipt size={18} />
                <div>
                  <strong>No matching payments found</strong>
                  <p>Adjust your filters or record a new payment.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="payments-table-wrap app-table-wrap">
                  <table className="payments-table app-data-table">
                    <thead>
                      <tr>
                        <th className="checkbox-col">
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={(event) => toggleAllRows(event.target.checked)}
                            aria-label="Select all visible payments"
                          />
                        </th>
                        <th>
                          <button type="button" className="sortable-head" onClick={() => requestSort("paymentId")}>
                            Payment ID <ArrowUpDown size={13} />
                          </button>
                        </th>
                        <th>
                          <button type="button" className="sortable-head" onClick={() => requestSort("invoiceNumber")}>
                            Invoice <ArrowUpDown size={13} />
                          </button>
                        </th>
                        <th className="align-right">
                          <button type="button" className="sortable-head align-right" onClick={() => requestSort("amount")}>
                            Amount <ArrowUpDown size={13} />
                          </button>
                        </th>
                        <th>
                          <button type="button" className="sortable-head" onClick={() => requestSort("method")}>
                            Method <ArrowUpDown size={13} />
                          </button>
                        </th>
                        <th>
                          <button type="button" className="sortable-head" onClick={() => requestSort("status")}>
                            Status <ArrowUpDown size={13} />
                          </button>
                        </th>
                        <th>
                          <button type="button" className="sortable-head" onClick={() => requestSort("date")}>
                            Payment Date <ArrowUpDown size={13} />
                          </button>
                        </th>
                        <th>Reference</th>
                        <th className="actions-col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPayments.map((payment) => (
                        <tr key={payment.paymentId} onClick={() => {
                          setDetailsPayment(payment);
                          setDrawerTab("overview");
                        }}>
                          <td onClick={(event) => event.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(payment.paymentId)}
                              onChange={(event) =>
                                setSelectedRows((current) =>
                                  event.target.checked
                                    ? [...current, payment.paymentId]
                                    : current.filter((id) => id !== payment.paymentId)
                                )
                              }
                              aria-label={`Select ${payment.paymentId}`}
                            />
                          </td>
                          <td>
                            <div className="primary-cell">
                              <strong>{payment.paymentId}</strong>
                              <span>{payment.receiptId}</span>
                            </div>
                          </td>
                          <td>
                            <div className="primary-cell app-cell-stack">
                              <button
                                type="button"
                                className="text-link-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setDetailsPayment(payment);
                                  setDrawerTab("invoice");
                                }}
                              >
                                {payment.invoiceNumber}
                              </button>
                              <span>{payment.customerName}</span>
                              <small>{payment.linkState}</small>
                            </div>
                          </td>
                          <td className="align-right">
                            <div className="amount-cell">
                              <strong>{formatMoney(payment.amount)}</strong>
                              <span>Balance after {formatMoney(payment.remainingAfterPayment)}</span>
                            </div>
                          </td>
                          <td>
                            <span className="method-badge">
                              {getMethodIcon(payment.method)}
                              {formatMethod(payment.method)}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${getStatusTone(payment.status)}`}>{formatStatus(payment.status)}</span>
                          </td>
                          <td>
                            <div className="primary-cell">
                              <strong>{formatDate(payment.date)}</strong>
                              <span>{payment.relativeDate}</span>
                            </div>
                          </td>
                          <td>
                            <OverflowContent
                              className="note-preview"
                              title={`Payment ${payment.paymentId}`}
                              subtitle={payment.referenceNumber}
                              preview={payment.notes || payment.referenceNumber}
                              content={payment.notes || "No note recorded for this payment."}
                              meta={[
                                { label: "Reference", value: payment.referenceNumber },
                                { label: "Receipt", value: payment.receiptId },
                              ]}
                            />
                          </td>
                          <td onClick={(event) => event.stopPropagation()}>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="details-btn"
                                onClick={() => {
                                  setDetailsPayment(payment);
                                  setDrawerTab("overview");
                                }}
                              >
                                <Eye size={14} />
                                Open
                              </button>
                              <button
                                type="button"
                                className="icon-btn quiet"
                                aria-label="More actions"
                                onClick={(event) => {
                                  const rect = event.currentTarget.getBoundingClientRect();
                                  const menuWidth = 210;
                                  const menuHeight = 300;
                                  const left = Math.max(12, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 12));
                                  const shouldFlip = rect.bottom + menuHeight > window.innerHeight - 12;
                                  setMenuState({
                                    paymentId: payment.paymentId,
                                    top: shouldFlip ? rect.top - 12 : rect.bottom + 10,
                                    left,
                                  });
                                }}
                              >
                                <MoreHorizontal size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <TableFooter
                  className="payments-table-footer"
                  total={filteredPayments.length}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(value) => {
                    setRowsPerPage(value);
                    setPage(1);
                  }}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </section>
      </div>

      {showEditor && (
        <PaymentEditor
          mode={editorMode}
          values={formState}
          errors={formErrors}
          invoices={invoices}
          customers={customers}
          payments={payments}
          onChange={(field, value) => {
            setFormState((current) => ({ ...current, [field]: value }));
            setFormErrors((current) => ({ ...current, [field]: undefined }));
          }}
          onClose={() => setShowEditor(false)}
          onSubmit={handleSavePayment}
        />
      )}

      {detailsPayment && (
        <PaymentDetailsDrawer
          payment={detailsPayment}
          activeTab={drawerTab}
          onChangeTab={setDrawerTab}
          onClose={() => setDetailsPayment(null)}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          payment={deleteTarget}
          code={deleteCode}
          onCodeChange={setDeleteCode}
          onClose={() => {
            setDeleteTarget(null);
            setDeleteCode("");
          }}
          onConfirm={handleDeletePayment}
        />
      )}

      {menuState &&
        createPortal(
          <div
            ref={menuRef}
            className="payment-action-menu"
            style={{
              top: menuState.top,
              left: menuState.left,
              transform: menuState.top > window.innerHeight / 2 ? "translateY(-100%)" : "none",
            }}
          >
            {(() => {
              const payment = payments.find((entry) => entry.paymentId === menuState.paymentId);
              if (!payment) return null;

              return (
                <>
                  <button type="button" onClick={() => {
                    setDetailsPayment(payment);
                    setDrawerTab("overview");
                    setMenuState(null);
                  }}>
                    <Eye size={15} />
                    Open
                  </button>
                  <button type="button" onClick={() => openEditModal(payment)}>
                    <Plus size={15} />
                    Edit payment
                  </button>
                  <button type="button" onClick={() => {
                    setToast({ type: "success", message: `Receipt ${payment.receiptId} downloaded.` });
                    setMenuState(null);
                  }}>
                    <Download size={15} />
                    Download receipt
                  </button>
                  <button type="button" onClick={() => {
                    setToast({ type: "success", message: `Receipt ${payment.receiptId} sent to print.` });
                    setMenuState(null);
                  }}>
                    <Printer size={15} />
                    Print receipt
                  </button>
                  <button type="button" onClick={() => {
                    setDetailsPayment(payment);
                    setDrawerTab("notes");
                    setMenuState(null);
                  }}>
                    <FileText size={15} />
                    Add note
                  </button>
                  <button type="button" onClick={() => {
                    setDetailsPayment(payment);
                    setDrawerTab("invoice");
                    setMenuState(null);
                  }}>
                    <Receipt size={15} />
                    Link to invoice
                  </button>
                  <button type="button" onClick={() => {
                    const nextRawPayments = (payments as Payment[]).map((entry) =>
                      entry.paymentId === payment.paymentId
                        ? {
                            ...entry,
                            status: "Refunded" as PaymentStatus,
                            updatedAt: new Date().toISOString().split("T")[0],
                          }
                        : entry
                    );
                    savePayments(nextRawPayments);
                    setPayments(normalizePaymentList(nextRawPayments, invoices, customers));
                    setToast({ type: "success", message: "Payment marked as refunded." });
                    setMenuState(null);
                  }}>
                    <RotateCcw size={15} />
                    Mark as refunded
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      setDeleteTarget(payment);
                      setDeleteCode("");
                      setMenuState(null);
                    }}
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
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
