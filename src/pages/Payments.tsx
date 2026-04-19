import { useEffect, useMemo, useState } from "react";
import "./Payments.css";
import {
  getCustomers,
  getInvoices,
  getPayments,
  savePayments,
} from "../data/storage";
import {
  calculateInvoiceRemainingAmount,
  getCustomerById,
  getInvoiceById,
} from "../data/relations";
import type { Customer, Invoice, Payment, PaymentMethod } from "../data/types";
import { useSettings } from "../context/SettingsContext";

type LocalPaymentStatus = "Completed";

type SortKey =
  | "paymentId"
  | "invoiceNumber"
  | "customerName"
  | "amount"
  | "method"
  | "status"
  | "date";

type SortDirection = "asc" | "desc";

type ExtendedPayment = Payment & {
  paymentId: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: LocalPaymentStatus;
  method: PaymentMethod;
  date: string;
  notes?: string;
};

type PaymentForm = {
  invoiceId: string;
  customerId: string;
  amount: string;
  method: PaymentMethod;
  date: string;
  notes: string;
};

type PaymentFormErrors = {
  invoiceId?: string;
  customerId?: string;
  amount?: string;
  method?: string;
  date?: string;
};

type ToastState = {
  message: string;
  type: "success" | "error" | "warning" | "info";
} | null;

type ConfirmDialogState =
  | {
      type: "update";
      paymentId: string;
    }
  | {
      type: "delete";
      paymentId: string;
    }
  | null;

const EMPTY_FORM: PaymentForm = {
  invoiceId: "",
  customerId: "",
  amount: "",
  method: "Cash",
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

function buildPaymentId(index: number) {
  return `PAY-${1000 + index + 1}`;
}

function roundMoney(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function normalizePayment(
  payment: Payment,
  invoices: Invoice[],
  customers: Customer[],
  index: number,
  unknownCustomer: string
): ExtendedPayment {
  const invoice = getInvoiceById(invoices, payment.invoiceId);
  const customer = getCustomerById(customers, payment.customerId);

  return {
    ...payment,
    paymentId: payment.paymentId ?? payment.id ?? buildPaymentId(index),
    invoiceNumber: invoice?.id ?? payment.invoiceId,
    customerName: customer?.name ?? unknownCustomer,
    amount: roundMoney(Number(payment.amount ?? 0)),
    status: "Completed",
    method:
      payment.method === "Card" || payment.method === "Bank Transfer"
        ? payment.method
        : "Cash",
    date: payment.date ?? new Date().toISOString().split("T")[0],
    notes: payment.notes ?? "",
  };
}

function normalizePaymentList(
  payments: Payment[],
  invoices: Invoice[],
  customers: Customer[],
  unknownCustomer: string
) {
  return payments.map((payment, index) =>
    normalizePayment(payment, invoices, customers, index, unknownCustomer)
  );
}

function calculateRemainingForEditing(
  invoice: Invoice,
  payments: Payment[],
  editingPaymentId?: string
) {
  const filteredPayments = payments.filter(
    (payment) =>
      payment.id !== editingPaymentId && payment.paymentId !== editingPaymentId
  );

  return roundMoney(calculateInvoiceRemainingAmount(invoice, filteredPayments));
}

function translatePaymentStatus(status: string, t: any) {
  switch (status) {
    case "Paid":
      return t.status.paid;
    case "Completed":
      return t.status.completed;
    default:
      return status;
  }
}

function translatePaymentMethod(method: string, t: any) {
  switch (method) {
    case "Cash":
      return t.payments.cash;
    case "Card":
      return t.payments.card;
    case "Bank Transfer":
      return t.payments.bankTransfer;
    default:
      return method;
  }
}

function validatePaymentForm(
  values: PaymentForm,
  invoices: Invoice[],
  payments: Payment[],
  editingPaymentId: string | undefined,
  t: any
): PaymentFormErrors {
  const errors: PaymentFormErrors = {};

  if (!values.invoiceId.trim()) {
    errors.invoiceId = t.payments.invoiceRequired;
  }

  const selectedInvoice = invoices.find(
    (invoice) => invoice.id === values.invoiceId
  );

  if (!selectedInvoice) {
    errors.invoiceId = t.payments.invoiceInvalid;
    return errors;
  }

  if (!values.customerId.trim()) {
    errors.customerId = t.payments.customerRequired;
  }

  if (values.amount === "") {
    errors.amount = t.payments.amountRequired;
  } else if (Number.isNaN(Number(values.amount))) {
    errors.amount = t.payments.amountNumber;
  } else if (Number(values.amount) <= 0) {
    errors.amount = t.payments.amountPositive;
  }

  if (!values.date.trim()) {
    errors.date = t.payments.dateRequired;
  }

  if (!values.method) {
    errors.method = t.payments.methodRequired;
  }

  if (values.amount !== "" && !Number.isNaN(Number(values.amount))) {
    const remainingAmount = calculateRemainingForEditing(
      selectedInvoice,
      payments,
      editingPaymentId
    );

    if (remainingAmount <= 0) {
      errors.amount = "This invoice is already fully paid.";
    } else if (Number(values.amount) > remainingAmount) {
      errors.amount = `Remaining invoice balance: ${remainingAmount}`;
    }
  }

  return errors;
}

function PaymentFormModal({
  title,
  description,
  values,
  errors,
  invoices,
  customers,
  payments,
  editingPaymentId,
  onChange,
  onClose,
  onSubmit,
  submitLabel,
  t,
  isArabic,
}: {
  title: string;
  description: string;
  values: PaymentForm;
  errors: PaymentFormErrors;
  invoices: Invoice[];
  customers: Customer[];
  payments: Payment[];
  editingPaymentId?: string;
  onChange: (field: keyof PaymentForm, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  t: any;
  isArabic: boolean;
}) {
  const selectedInvoice = invoices.find(
    (invoice) => invoice.id === values.invoiceId
  );

  const selectedCustomer = customers.find(
    (customer) => customer.id === values.customerId
  );

  const remainingAmount = selectedInvoice
    ? calculateRemainingForEditing(selectedInvoice, payments, editingPaymentId)
    : 0;

  const isInvoiceFullyPaid = !!selectedInvoice && remainingAmount <= 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isInvoiceFullyPaid) onSubmit();
          }}
        >
          <div className="modal-grid">
            <div>
              <label className="modal-label">{t.common.invoice}</label>
              <select
                className="modal-input"
                value={values.invoiceId}
                onChange={(e) => {
                  const invoice = invoices.find((inv) => inv.id === e.target.value);
                  onChange("invoiceId", e.target.value);
                  onChange("customerId", invoice?.customerId ?? "");
                  onChange("amount", "");
                }}
              >
                <option value="">{t.payments.selectInvoice}</option>
                {invoices.map((invoice) => {
                  const customer = customers.find(
                    (cust) => cust.id === invoice.customerId
                  );

                  return (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.id} - {customer?.name ?? t.payments.unknownCustomer}
                    </option>
                  );
                })}
              </select>
              {errors.invoiceId && <p className="field-error">{errors.invoiceId}</p>}
            </div>

            <div>
              <label className="modal-label">{t.common.customer}</label>
              <input
                className="modal-input"
                type="text"
                value={selectedCustomer?.name ?? ""}
                placeholder={t.payments.customerName}
                readOnly
              />
              {errors.customerId && (
                <p className="field-error">{errors.customerId}</p>
              )}
            </div>

            <div>
              <label className="modal-label">{t.common.amount}</label>
              <input
                className="modal-input"
                type="number"
                min="0.01"
                step="0.01"
                max={remainingAmount > 0 ? remainingAmount : undefined}
                value={values.amount}
                onChange={(e) => onChange("amount", e.target.value)}
                placeholder={t.payments.enterAmount}
                disabled={isInvoiceFullyPaid}
              />

              {selectedInvoice ? (
                <p
                  style={{
                    marginTop: "6px",
                    fontSize: "12px",
                    color: remainingAmount <= 0 ? "#dc2626" : "#64748b",
                    fontWeight: 600,
                  }}
                >
                  Remaining invoice balance: ${remainingAmount}
                </p>
              ) : null}

              {isInvoiceFullyPaid && (
                <p className="field-error">
                  This invoice is already fully paid. Choose another invoice.
                </p>
              )}

              {errors.amount && <p className="field-error">{errors.amount}</p>}
            </div>

            <div>
              <label className="modal-label">{t.common.method}</label>
              <select
                className="modal-input"
                value={values.method}
                onChange={(e) =>
                  onChange("method", e.target.value as PaymentMethod)
                }
              >
                <option value="Cash">{t.payments.cash}</option>
                <option value="Card">{t.payments.card}</option>
                <option value="Bank Transfer">{t.payments.bankTransfer}</option>
              </select>
              {errors.method && <p className="field-error">{errors.method}</p>}
            </div>

            <div>
              <label className="modal-label">Payment Status</label>
              <input
                className="modal-input"
                type="text"
                value="Completed"
                readOnly
              />
            </div>

            <div>
              <label className="modal-label">{t.common.date}</label>
              <input
                className="modal-input"
                type="date"
                value={values.date}
                onChange={(e) => onChange("date", e.target.value)}
              />
              {errors.date && <p className="field-error">{errors.date}</p>}
            </div>

            <div className="modal-grid-full">
              <label className="modal-label">{t.common.notes}</label>
              <textarea
                className="modal-textarea"
                value={values.notes}
                onChange={(e) => onChange("notes", e.target.value)}
                placeholder={t.payments.enterNotes}
                rows={3}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-secondary-btn"
              onClick={onClose}
            >
              {t.common.cancel}
            </button>

            <button
              type="submit"
              className="modal-primary-btn"
              disabled={isInvoiceFullyPaid}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmClassName,
  onConfirm,
  onClose,
  t,
  isArabic,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClassName?: string;
  onConfirm: () => void;
  onClose: () => void;
  t: any;
  isArabic: boolean;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card confirm-dialog-card"
        onClick={(e) => e.stopPropagation()}
        dir={isArabic ? "rtl" : "ltr"}
      >
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            <p>{t.payments.confirmationRequired}</p>
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="confirm-dialog-text">{description}</p>

        <div className="modal-actions" style={{ marginTop: "20px" }}>
          <button
            type="button"
            className="modal-secondary-btn"
            onClick={onClose}
          >
            {t.common.cancel}
          </button>

          <button
            type="button"
            className={confirmClassName || "modal-primary-btn"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Payments() {
  const { t, isArabic } = useSettings();

  const [customers] = useState<Customer[]>(() => getCustomers());
  const [invoices, setInvoices] = useState<Invoice[]>(() => getInvoices());
  const [payments, setPayments] = useState<ExtendedPayment[]>(() =>
    normalizePaymentList(
      getPayments(),
      getInvoices(),
      getCustomers(),
      t.payments.unknownCustomer
    )
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: "date",
    direction: "desc",
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<PaymentForm>(EMPTY_FORM);
  const [addErrors, setAddErrors] = useState<PaymentFormErrors>({});

  const [editingPayment, setEditingPayment] = useState<ExtendedPayment | null>(null);
  const [editForm, setEditForm] = useState<PaymentForm>(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState<PaymentFormErrors>({});

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    const syncData = () => {
      const latestInvoices = getInvoices();
      const latestCustomers = getCustomers();
      const latestPayments = getPayments();

      setInvoices(latestInvoices);
      setPayments(
        normalizePaymentList(
          latestPayments,
          latestInvoices,
          latestCustomers,
          t.payments.unknownCustomer
        )
      );
    };

    syncData();
    window.addEventListener("focus", syncData);
    window.addEventListener("storage", syncData);

    return () => {
      window.removeEventListener("focus", syncData);
      window.removeEventListener("storage", syncData);
    };
  }, [t.payments.unknownCustomer]);

  useEffect(() => {
    savePayments(payments);
  }, [payments]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const requestSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: key === "date" ? "desc" : "asc",
      };
    });
  };

  const getSortIndicator = (key: SortKey) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const filteredPayments = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();

    const filtered = payments.filter((payment) =>
      [
        payment.paymentId,
        payment.invoiceNumber,
        payment.customerName,
        payment.amount,
        payment.status,
        payment.method,
        payment.date,
        payment.notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );

    return [...filtered].sort((a, b) => {
      const getValue = (payment: ExtendedPayment) => {
        switch (sortConfig.key) {
          case "paymentId":
            return payment.paymentId;
          case "invoiceNumber":
            return payment.invoiceNumber;
          case "customerName":
            return payment.customerName;
          case "amount":
            return payment.amount;
          case "method":
            return payment.method;
          case "status":
            return payment.status;
          case "date":
            return payment.date;
          default:
            return "";
        }
      };

      const aValue = getValue(a);
      const bValue = getValue(b);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      return sortConfig.direction === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [payments, searchTerm, sortConfig]);

  const setAddField = (field: keyof PaymentForm, value: string) => {
    setAddForm((prev) => ({ ...prev, [field]: value }));
    setAddErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const setEditField = (field: keyof PaymentForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    setEditErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddForm(EMPTY_FORM);
    setAddErrors({});
  };

  const closeEditModal = () => {
    setEditingPayment(null);
    setEditForm(EMPTY_FORM);
    setEditErrors({});
  };

  const openEditModal = (payment: ExtendedPayment) => {
    setEditingPayment(payment);
    setEditForm({
      invoiceId: payment.invoiceId,
      customerId: payment.customerId,
      amount: String(payment.amount),
      method: payment.method ?? "Cash",
      date: payment.date,
      notes: payment.notes ?? "",
    });
    setEditErrors({});
  };

  const handleRequestAddPayment = () => {
    const errors = validatePaymentForm(addForm, invoices, payments, undefined, t);
    setAddErrors(errors);

    if (Object.keys(errors).length > 0) return;

    const newPaymentId = buildPaymentId(payments.length);

    const newPayment: ExtendedPayment = normalizePayment(
      {
        id: newPaymentId,
        paymentId: newPaymentId,
        invoiceId: addForm.invoiceId.trim(),
        customerId: addForm.customerId.trim(),
        amount: roundMoney(Number(addForm.amount)),
        status: "Completed",
        method: addForm.method,
        date: addForm.date,
        notes: addForm.notes.trim(),
      },
      invoices,
      customers,
      payments.length,
      t.payments.unknownCustomer
    );

    setPayments((prev) => [newPayment, ...prev]);
    closeAddModal();
    setToast({ type: "success", message: t.payments.addSuccess });
  };

  const handleRequestEditPayment = () => {
    if (!editingPayment) return;

    const errors = validatePaymentForm(
      editForm,
      invoices,
      payments,
      editingPayment.paymentId,
      t
    );
    setEditErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setConfirmDialog({
      type: "update",
      paymentId: editingPayment.paymentId,
    });
  };

  const handleConfirmUpdate = () => {
    if (!editingPayment || confirmDialog?.type !== "update") return;

    setPayments((prev) =>
      prev.map((payment, index) =>
        payment.paymentId === editingPayment.paymentId
          ? normalizePayment(
              {
                ...payment,
                id: payment.paymentId,
                paymentId: payment.paymentId,
                invoiceId: editForm.invoiceId.trim(),
                customerId: editForm.customerId.trim(),
                amount: roundMoney(Number(editForm.amount)),
                status: "Completed",
                method: editForm.method,
                date: editForm.date,
                notes: editForm.notes.trim(),
              },
              invoices,
              customers,
              index,
              t.payments.unknownCustomer
            )
          : payment
      )
    );

    closeEditModal();
    setConfirmDialog(null);
    setToast({ type: "success", message: t.payments.updateSuccess });
  };

  const handleRequestDeletePayment = (paymentId: string) => {
    setConfirmDialog({
      type: "delete",
      paymentId,
    });
  };

  const handleConfirmDelete = () => {
    if (confirmDialog?.type !== "delete") return;

    setPayments((prev) =>
      prev.filter((payment) => payment.paymentId !== confirmDialog.paymentId)
    );

    setConfirmDialog(null);
    setToast({ type: "success", message: t.payments.deleteSuccess });
  };

  return (
    <>
      <div className="payments-page" dir={isArabic ? "rtl" : "ltr"}>
        <div className="payments-header">
          <div>
            <p className="dashboard-badge">{t.payments.badge}</p>
            <h1 className="dashboard-title">{t.payments.pageTitle}</h1>
            <p className="dashboard-subtitle">{t.payments.subtitle}</p>
          </div>

          <button
            type="button"
            className="quick-action-btn"
            onClick={() => setShowAddModal(true)}
          >
            + {t.payments.addPayment}
          </button>
        </div>

        <div className="dashboard-card">
          <div className="payments-toolbar">
            <div className="dashboard-search-box">
              <label className="dashboard-search-label">
                {t.payments.searchLabel}
              </label>
              <input
                type="text"
                className="dashboard-search-input"
                placeholder={t.payments.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="dashboard-search-meta">
                {searchTerm.trim()
                  ? `${filteredPayments.length} ${t.payments.results}`
                  : t.payments.searchAll}
              </span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort("paymentId")} style={{ cursor: "pointer" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      {t.payments.paymentId}
                      <span>{getSortIndicator("paymentId")}</span>
                    </span>
                  </th>
                  <th onClick={() => requestSort("invoiceNumber")} style={{ cursor: "pointer" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      {t.payments.invoiceNumber}
                      <span>{getSortIndicator("invoiceNumber")}</span>
                    </span>
                  </th>
                  <th onClick={() => requestSort("customerName")} style={{ cursor: "pointer" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      {t.common.customer}
                      <span>{getSortIndicator("customerName")}</span>
                    </span>
                  </th>
                  <th onClick={() => requestSort("amount")} style={{ cursor: "pointer" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      {t.common.amount}
                      <span>{getSortIndicator("amount")}</span>
                    </span>
                  </th>
                  <th onClick={() => requestSort("method")} style={{ cursor: "pointer" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      {t.common.method}
                      <span>{getSortIndicator("method")}</span>
                    </span>
                  </th>
                  <th onClick={() => requestSort("status")} style={{ cursor: "pointer" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      {t.common.status}
                      <span>{getSortIndicator("status")}</span>
                    </span>
                  </th>
                  <th onClick={() => requestSort("date")} style={{ cursor: "pointer" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      {t.common.date}
                      <span>{getSortIndicator("date")}</span>
                    </span>
                  </th>
                  <th>{t.common.notes}</th>
                  <th>{t.common.actions}</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <tr key={payment.paymentId}>
                      <td>{payment.paymentId}</td>
                      <td>{payment.invoiceNumber}</td>
                      <td>{payment.customerName}</td>
                      <td>${payment.amount}</td>
                      <td>{translatePaymentMethod(payment.method, t)}</td>
                      <td>
                        <span className="status-badge status-completed">
                          {translatePaymentStatus(payment.status, t)}
                        </span>
                      </td>
                      <td>{payment.date}</td>
                      <td>{payment.notes || "—"}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="table-btn edit"
                            onClick={() => openEditModal(payment)}
                          >
                            {t.common.edit}
                          </button>
                          <button
                            type="button"
                            className="table-btn delete"
                            onClick={() =>
                              handleRequestDeletePayment(payment.paymentId)
                            }
                          >
                            {t.common.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="empty-state-cell">
                      {t.payments.noPayments}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <PaymentFormModal
          title={t.payments.addTitle}
          description={t.payments.addDescription}
          values={addForm}
          errors={addErrors}
          invoices={invoices}
          customers={customers}
          payments={payments}
          onChange={setAddField}
          onClose={closeAddModal}
          onSubmit={handleRequestAddPayment}
          submitLabel={t.payments.savePayment}
          t={t}
          isArabic={isArabic}
        />
      )}

      {editingPayment && (
        <PaymentFormModal
          title={t.payments.editTitle}
          description={t.payments.editDescription}
          values={editForm}
          errors={editErrors}
          invoices={invoices}
          customers={customers}
          payments={payments}
          editingPaymentId={editingPayment.paymentId}
          onChange={setEditField}
          onClose={closeEditModal}
          onSubmit={handleRequestEditPayment}
          submitLabel={t.common.saveChanges}
          t={t}
          isArabic={isArabic}
        />
      )}

      {confirmDialog?.type === "update" && (
        <ConfirmDialog
          title={t.common.confirmUpdate}
          description={t.payments.confirmUpdateText}
          confirmLabel={t.payments.updateLabel}
          onConfirm={handleConfirmUpdate}
          onClose={() => setConfirmDialog(null)}
          t={t}
          isArabic={isArabic}
        />
      )}

      {confirmDialog?.type === "delete" && (
        <ConfirmDialog
          title={t.common.confirmDelete}
          description={t.payments.confirmDeleteText}
          confirmLabel={t.payments.deleteLabel}
          confirmClassName="modal-primary-btn"
          onConfirm={handleConfirmDelete}
          onClose={() => setConfirmDialog(null)}
          t={t}
          isArabic={isArabic}
        />
      )}

      {toast && <div className="toast-message">{toast.message}</div>}
    </>
  );
}