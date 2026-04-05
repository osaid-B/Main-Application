import { useEffect, useMemo, useState } from "react";
import {
  type Invoice,
  type InvoiceStatus,
  type PaymentMethod,
  getCustomers,
  getInvoices,
  saveInvoices,
} from "../data/storage";

type SortKey = "id" | "customer" | "date" | "amount" | "status" | "paymentMethod";
type SortDirection = "asc" | "desc";

type InvoiceForm = {
  customer: string;
  amount: string;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  checkNumber: string;
  checkDueDate: string;
  notes: string;
};

const initialForm: InvoiceForm = {
  customer: "",
  amount: "",
  status: "Paid",
  paymentMethod: "Cash",
  checkNumber: "",
  checkDueDate: "",
  notes: "",
};

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => getInvoices());
  const [customers] = useState(() => getCustomers());
  const [searchTerm, setSearchTerm] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteConfirmValue, setDeleteConfirmValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: "date",
    direction: "desc",
  });

  const [form, setForm] = useState<InvoiceForm>(initialForm);

  useEffect(() => {
    saveInvoices(invoices);
  }, [invoices]);

  const requestSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredInvoices = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();

    const filtered = invoices.filter((invoice) =>
      [
        invoice.id,
        invoice.customer,
        invoice.date,
        invoice.amount,
        invoice.status,
        invoice.paymentMethod,
        invoice.checkNumber ?? "",
        invoice.checkDueDate ?? "",
        invoice.notes ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );

    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? "";
      const bValue = b[sortConfig.key] ?? "";

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [invoices, searchTerm, sortConfig]);

  const paidCount = invoices.filter((invoice) => invoice.status === "Paid").length;
  const pendingCount = invoices.filter((invoice) => invoice.status === "Pending").length;
  const partialCount = invoices.filter((invoice) => invoice.status === "Partial").length;
  const checkInvoicesCount = invoices.filter(
    (invoice) => invoice.paymentMethod === "Check"
  ).length;

  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const resetFormState = () => {
    setForm(initialForm);
    setSelectedInvoice(null);
    setIsEditing(false);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    resetFormState();
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmValue("");
    setSelectedInvoice(null);
  };

  const openAddModal = () => {
    resetFormState();
    setShowFormModal(true);
  };

  const openEditModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditing(true);
    setForm({
      customer: invoice.customer,
      amount: String(invoice.amount),
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      checkNumber: invoice.checkNumber ?? "",
      checkDueDate: invoice.checkDueDate ?? "",
      notes: invoice.notes ?? "",
    });
    setShowFormModal(true);
  };

  const openDeleteModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDeleteConfirmValue("");
    setShowDeleteModal(true);
  };

  const handleSaveInvoice = () => {
    if (!form.customer || !form.amount) return;

    const amountNumber = Number(form.amount);
    if (Number.isNaN(amountNumber)) return;

    if (form.paymentMethod === "Check" && (!form.checkNumber || !form.checkDueDate)) {
      return;
    }

    const payload: Omit<Invoice, "id" | "date"> = {
      customer: form.customer,
      amount: amountNumber,
      status: form.status,
      paymentMethod: form.paymentMethod,
      checkNumber: form.paymentMethod === "Check" ? form.checkNumber : undefined,
      checkDueDate: form.paymentMethod === "Check" ? form.checkDueDate : undefined,
      notes: form.notes.trim() || undefined,
    };

    if (isEditing && selectedInvoice) {
      setInvoices((prev) =>
        prev.map((invoice) =>
          invoice.id === selectedInvoice.id
            ? {
                ...invoice,
                ...payload,
              }
            : invoice
        )
      );
    } else {
      const newInvoice: Invoice = {
        id: `INV-${1000 + invoices.length + 1}`,
        date: new Date().toISOString().split("T")[0],
        ...payload,
      };

      setInvoices((prev) => [newInvoice, ...prev]);
    }

    closeFormModal();
  };

  const handleDeleteInvoice = () => {
    if (!selectedInvoice) return;
    if (deleteConfirmValue.trim() !== selectedInvoice.id) return;

    setInvoices((prev) =>
      prev.filter((invoice) => invoice.id !== selectedInvoice.id)
    );

    closeDeleteModal();
  };

  const sortableHeader = (label: string, key: SortKey) => (
    <th
      style={{ cursor: "pointer" }}
      onClick={() => requestSort(key)}
      title={`Sort by ${label}`}
    >
      {label} {sortConfig.key === key ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <>
      <div className="invoices-page invoices-enhanced-page">
        <div className="invoices-header enhanced-page-header">
          <div>
            <p className="dashboard-badge">Invoice Management</p>
            <h1 className="dashboard-title">Invoices</h1>
            <p className="dashboard-subtitle">
              Create, manage, edit, and delete invoices with support for checks and payment methods.
            </p>
          </div>

          <button className="quick-action-btn" onClick={openAddModal}>
            + Add Invoice
          </button>
        </div>

        <div className="invoices-hero-grid">
          <div className="invoice-hero-card invoice-hero-primary">
            <div className="invoice-hero-top">
              <span className="invoice-hero-icon">🧾</span>
              <div>
                <h3>Total Invoices</h3>
                <p>All invoices in system</p>
              </div>
            </div>
            <strong>{invoices.length}</strong>
          </div>

          <div className="invoice-hero-card">
            <div className="invoice-hero-top">
              <span className="invoice-hero-icon">✅</span>
              <div>
                <h3>Paid</h3>
                <p>Completed invoices</p>
              </div>
            </div>
            <strong>{paidCount}</strong>
          </div>

          <div className="invoice-hero-card">
            <div className="invoice-hero-top">
              <span className="invoice-hero-icon">⏳</span>
              <div>
                <h3>Pending</h3>
                <p>Awaiting payment</p>
              </div>
            </div>
            <strong>{pendingCount}</strong>
          </div>

          <div className="invoice-hero-card">
            <div className="invoice-hero-top">
              <span className="invoice-hero-icon">🟡</span>
              <div>
                <h3>Partial</h3>
                <p>Need remaining amount</p>
              </div>
            </div>
            <strong>{partialCount}</strong>
          </div>

          <div className="invoice-hero-card">
            <div className="invoice-hero-top">
              <span className="invoice-hero-icon">💳</span>
              <div>
                <h3>Checks</h3>
                <p>Invoices paid by check</p>
              </div>
            </div>
            <strong>{checkInvoicesCount}</strong>
          </div>

          <div className="invoice-hero-card">
            <div className="invoice-hero-top">
              <span className="invoice-hero-icon">💵</span>
              <div>
                <h3>Total Amount</h3>
                <p>Billing value</p>
              </div>
            </div>
            <strong>${totalAmount}</strong>
            <small className="invoice-hero-small">${paidAmount} paid already</small>
          </div>
        </div>

        <div className="dashboard-card invoices-table-card">
          <div className="invoices-toolbar enhanced-toolbar">
            <div className="dashboard-search-box invoices-search-box enhanced-search-box">
              <label className="dashboard-search-label">Search invoices</label>
              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Search by customer, amount, date, status, check..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="dashboard-search-meta">
                {searchTerm.trim()
                  ? `${filteredInvoices.length} result(s)`
                  : "Search all invoices"}
              </span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="dashboard-table invoices-enhanced-table">
              <thead>
                <tr>
                  {sortableHeader("ID", "id")}
                  {sortableHeader("Customer", "customer")}
                  {sortableHeader("Date", "date")}
                  {sortableHeader("Amount", "amount")}
                  {sortableHeader("Status", "status")}
                  {sortableHeader("Method", "paymentMethod")}
                  <th>Check</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td><span className="invoice-id-badge">{invoice.id}</span></td>
                      <td>{invoice.customer}</td>
                      <td>{invoice.date}</td>
                      <td>${invoice.amount}</td>
                      <td>
                        <span
                          className={
                            invoice.status === "Paid"
                              ? "status-badge status-paid"
                              : invoice.status === "Partial"
                              ? "status-badge status-pending"
                              : "status-badge status-out"
                          }
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td><span className="invoice-method-chip">{invoice.paymentMethod}</span></td>
                      <td>
                        {invoice.paymentMethod === "Check" ? (
                          <div className="check-details-cell">
                            <strong>{invoice.checkNumber}</strong>
                            <span>{invoice.checkDueDate}</span>
                          </div>
                        ) : (
                          <span className="muted-dash">—</span>
                        )}
                      </td>
                      <td>{invoice.notes || <span className="muted-dash">—</span>}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="table-action-btn edit-btn"
                            onClick={() => openEditModal(invoice)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="table-action-btn delete-btn"
                            onClick={() => openDeleteModal(invoice)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="empty-state-cell">
                      No matching invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showFormModal && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-card enhanced-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{isEditing ? "Edit Invoice" : "Add Invoice"}</h2>
                <p>
                  {isEditing
                    ? "Update invoice details and payment method."
                    : "Create a new invoice and define its payment method."}
                </p>
              </div>
              <button className="modal-close-btn" onClick={closeFormModal}>
                ×
              </button>
            </div>

            <form className="modal-form">
              <div>
                <label className="modal-label">Customer Name</label>
                <select
                  className="modal-input"
                  value={form.customer}
                  onChange={(e) => setForm((prev) => ({ ...prev, customer: e.target.value }))}
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.name}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="modal-label">Amount</label>
                <input
                  className="modal-input"
                  type="number"
                  placeholder="Enter amount"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <div>
                <label className="modal-label">Status</label>
                <select
                  className="modal-input"
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value as InvoiceStatus,
                    }))
                  }
                >
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="modal-label">Payment Method</label>
                <select
                  className="modal-input"
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value as PaymentMethod,
                      checkNumber: e.target.value === "Check" ? prev.checkNumber : "",
                      checkDueDate: e.target.value === "Check" ? prev.checkDueDate : "",
                    }))
                  }
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Check">Check</option>
                </select>
              </div>

              {form.paymentMethod === "Check" && (
                <>
                  <div>
                    <label className="modal-label">Check Number</label>
                    <input
                      className="modal-input"
                      type="text"
                      placeholder="Enter check number"
                      value={form.checkNumber}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, checkNumber: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="modal-label">Check Due Date</label>
                    <input
                      className="modal-input"
                      type="date"
                      value={form.checkDueDate}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, checkDueDate: e.target.value }))
                      }
                    />
                  </div>
                </>
              )}

              <div>
                <label className="modal-label">Notes</label>
                <textarea
                  className="modal-input modal-textarea"
                  placeholder="Optional notes"
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-secondary-btn" onClick={closeFormModal}>
                  Cancel
                </button>
                <button type="button" className="modal-primary-btn" onClick={handleSaveInvoice}>
                  {isEditing ? "Save Changes" : "Save Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedInvoice && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-card delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Delete Invoice</h2>
                <p>
                  This action cannot be undone. Type the invoice ID exactly to confirm deletion.
                </p>
              </div>
              <button className="modal-close-btn" onClick={closeDeleteModal}>
                ×
              </button>
            </div>

            <div className="delete-confirm-box">
              <div className="delete-warning-card">
                <strong>{selectedInvoice.customer}</strong>
                <p>${selectedInvoice.amount}</p>
                <span className="delete-id-tag">{selectedInvoice.id}</span>
              </div>

              <label className="modal-label">
                Type this ID to confirm: <strong>{selectedInvoice.id}</strong>
              </label>
              <input
                className="modal-input"
                type="text"
                placeholder={`Type ${selectedInvoice.id}`}
                value={deleteConfirmValue}
                onChange={(e) => setDeleteConfirmValue(e.target.value)}
              />

              <div className="modal-actions">
                <button type="button" className="modal-secondary-btn" onClick={closeDeleteModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="modal-danger-btn"
                  onClick={handleDeleteInvoice}
                  disabled={deleteConfirmValue.trim() !== selectedInvoice.id}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}