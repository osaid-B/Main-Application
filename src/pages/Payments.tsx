import { useEffect, useMemo, useState } from "react";
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

type LocalPaymentStatus = "Completed" | "Pending";

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
  paymentId: string;
  invoiceId: string;
  customerId: string;
  amount: string;
  status: LocalPaymentStatus;
  method: PaymentMethod;
  date: string;
  notes: string;
};

type PaymentFormErrors = {
  paymentId?: string;
  invoiceId?: string;
  customerId?: string;
  amount?: string;
  status?: string;
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
  paymentId: "",
  invoiceId: "",
  customerId: "",
  amount: "",
  status: "Completed",
  method: "Cash",
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

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
    paymentId: payment.paymentId ?? payment.id ?? `PAY-${1000 + index + 1}`,
    invoiceNumber: invoice?.id ?? payment.invoiceId,
    customerName: customer?.name ?? unknownCustomer,
    amount: Number(payment.amount ?? 0),
    status: payment.status === "Pending" ? "Pending" : "Completed",
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

  return calculateInvoiceRemainingAmount(invoice, filteredPayments);
}

function translatePaymentStatus(status: string, t: any) {
  switch (status) {
    case "Paid":
      return t.status.paid;
    case "Completed":
      return t.status.completed;
    case "Pending":
      return t.status.pending;
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

  if (!values.paymentId.trim()) {
    errors.paymentId = t.payments.paymentIdRequired;
  }

  if (!values.invoiceId.trim()) {
    errors.invoiceId = t.payments.invoiceRequired;
  }

  const selectedInvoice = invoices.find(
    (invoice) => invoice.id === values.invoiceId
  );

  if (!selectedInvoice) {
    errors.invoiceId = t.payments.invoiceInvalid;
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

  if (
    selectedInvoice &&
    values.amount !== "" &&
    !Number.isNaN(Number(values.amount))
  ) {
    const remainingAmount = calculateRemainingForEditing(
      selectedInvoice,
      payments,
      editingPaymentId
    );

    if (
      values.status === "Completed" &&
      Number(values.amount) > remainingAmount
    ) {
      errors.amount = `${t.payments.remainingBalance}: ${remainingAmount}`;
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
            onSubmit();
          }}
        >
          <div className="modal-grid">
            <div>
              <label className="modal-label">{t.payments.paymentId}</label>
              <input
                className="modal-input"
                type="text"
                value={values.paymentId}
                onChange={(e) => onChange("paymentId", e.target.value)}
                placeholder={t.payments.enterPaymentId}
              />
              {errors.paymentId && (
                <p className="field-error">{errors.paymentId}</p>
              )}
            </div>

            <div>
              <label className="modal-label">{t.common.invoice}</label>
              <select
                className="modal-input"
                value={values.invoiceId}
                onChange={(e) => {
                  const invoice = invoices.find((inv) => inv.id === e.target.value);
                  onChange("invoiceId", e.target.value);
                  onChange("customerId", invoice?.customerId ?? "");
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
                value={values.amount}
                onChange={(e) => onChange("amount", e.target.value)}
                placeholder={t.payments.enterAmount}
              />
              {selectedInvoice ? (
                <p
                  style={{
                    marginTop: "6px",
                    fontSize: "12px",
                    color: "#64748b",
                    fontWeight: 600,
                  }}
                >
                  {t.payments.remainingBalance}: ${remainingAmount}
                </p>
              ) : null}
              {errors.amount && <p className="field-error">{errors.amount}</p>}
            </div>

            <div>
              <label className="modal-label">{t.common.status}</label>
              <select
                className="modal-input"
                value={values.status}
                onChange={(e) =>
                  onChange("status", e.target.value as LocalPaymentStatus)
                }
              >
                <option value="Completed">{t.payments.completed}</option>
                <option value="Pending">{t.payments.pending}</option>
              </select>
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

            <button type="submit" className="modal-primary-btn">
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
  const [invoices] = useState<Invoice[]>(() => getInvoices());
  const [payments, setPayments] = useState<ExtendedPayment[]>(() =>
    normalizePaymentList(
      getPayments(),
      getInvoices(),
      getCustomers(),
      t.payments.unknownCustomer
    )
  );

  const [searchTerm, setSearchTerm] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<PaymentForm>(EMPTY_FORM);
  const [addErrors, setAddErrors] = useState<PaymentFormErrors>({});

  const [editingPayment, setEditingPayment] = useState<ExtendedPayment | null>(null);
  const [editForm, setEditForm] = useState<PaymentForm>(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState<PaymentFormErrors>({});

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    setPayments(
      normalizePaymentList(
        getPayments(),
        getInvoices(),
        getCustomers(),
        t.payments.unknownCustomer
      )
    );
  }, [t.payments.unknownCustomer]);

  useEffect(() => {
    savePayments(payments);
  }, [payments]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredPayments = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();

    return payments.filter((payment) =>
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
  }, [payments, searchTerm]);

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
      paymentId: payment.paymentId,
      invoiceId: payment.invoiceId,
      customerId: payment.customerId,
      amount: String(payment.amount),
      status: payment.status,
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

    const newPayment: ExtendedPayment = normalizePayment(
      {
        id: addForm.paymentId.trim(),
        paymentId: addForm.paymentId.trim(),
        invoiceId: addForm.invoiceId.trim(),
        customerId: addForm.customerId.trim(),
        amount: Number(addForm.amount),
        status: addForm.status,
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
                id: editForm.paymentId.trim(),
                paymentId: editForm.paymentId.trim(),
                invoiceId: editForm.invoiceId.trim(),
                customerId: editForm.customerId.trim(),
                amount: Number(editForm.amount),
                status: editForm.status,
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
      <style>{`
        .payments-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .payments-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }

        .payments-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .dashboard-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1080px;
        }

        .dashboard-table th,
        .dashboard-table td {
          padding: 14px 16px;
          text-align: left;
          vertical-align: middle;
          border-bottom: 1px solid rgba(148, 163, 184, 0.14);
        }

        .dashboard-table th {
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          background: rgba(248, 250, 252, 0.9);
          white-space: nowrap;
        }

        .dashboard-table td {
          font-size: 14px;
          color: #1e293b;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 88px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .status-completed {
          background: rgba(34, 197, 94, 0.12);
          color: #15803d;
        }

        .status-pending {
          background: rgba(245, 158, 11, 0.14);
          color: #b45309;
        }

        .table-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .table-btn {
          border: none;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .table-btn.edit {
          background: #e2e8f0;
          color: #0f172a;
        }

        .table-btn.edit:hover {
          background: #cbd5e1;
        }

        .table-btn.delete {
          background: #ef4444;
          color: white;
        }

        .table-btn.delete:hover {
          background: #dc2626;
        }

        .empty-state-cell {
          text-align: center !important;
          color: #94a3b8;
          padding: 32px 16px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 999;
          backdrop-filter: blur(2px);
        }

        .modal-card {
          width: 100%;
          max-width: 680px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
          overflow: hidden;
          animation: modalPop 0.18s ease;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          padding: 20px 22px 16px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.14);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }

        .modal-header p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .modal-close-btn {
          border: none;
          background: transparent;
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
          color: #64748b;
          padding: 0;
        }

        .modal-form {
          padding: 20px 22px 22px;
        }

        .modal-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .modal-grid-full {
          grid-column: 1 / -1;
        }

        .modal-label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #475569;
        }

        .modal-input,
        .modal-textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
          background: white;
        }

        .modal-input:focus,
        .modal-textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
        }

        .modal-textarea {
          resize: vertical;
          min-height: 110px;
        }

        .field-error {
          display: block;
          margin-top: 6px;
          color: #dc2626;
          font-size: 12px;
          font-weight: 600;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 24px;
        }

        .modal-primary-btn,
        .modal-secondary-btn {
          border: none;
          border-radius: 12px;
          padding: 11px 16px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-primary-btn {
          background: #2563eb;
          color: white;
        }

        .modal-primary-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .modal-secondary-btn {
          background: #e2e8f0;
          color: #0f172a;
        }

        .modal-secondary-btn:hover:not(:disabled) {
          background: #cbd5e1;
        }

        .confirm-dialog-text {
          margin: 22px;
          color: #475569;
          line-height: 1.7;
          font-size: 14px;
        }

        .toast-message {
          position: fixed;
          right: 24px;
          bottom: 24px;
          background: #16a34a;
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.16);
          font-size: 14px;
          font-weight: 700;
          z-index: 1200;
        }

        @keyframes modalPop {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 900px) {
          .modal-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .table-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .table-btn {
            width: 100%;
          }

          .modal-actions {
            flex-direction: column-reverse;
          }

          .modal-primary-btn,
          .modal-secondary-btn {
            width: 100%;
          }
        }
      `}</style>

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
                  <th>{t.payments.paymentId}</th>
                  <th>{t.payments.invoiceNumber}</th>
                  <th>{t.common.customer}</th>
                  <th>{t.common.amount}</th>
                  <th>{t.common.method}</th>
                  <th>{t.common.status}</th>
                  <th>{t.common.date}</th>
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
                        <span
                          className={
                            payment.status === "Completed"
                              ? "status-badge status-completed"
                              : "status-badge status-pending"
                          }
                        >
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