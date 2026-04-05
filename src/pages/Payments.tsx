import { useEffect, useMemo, useState } from "react";
import {
  type Payment,
  getCustomers,
  getPayments,
  savePayments,
} from "../data/storage";

type SortKey = "customer" | "method" | "date" | "amount";
type SortDirection = "asc" | "desc";
type PaymentMethod = "Cash" | "Card" | "Bank Transfer" | "Check";

type PaymentForm = {
  customer: string;
  method: PaymentMethod;
  date: string;
  amount: string;
  notes: string;
};

const initialForm: PaymentForm = {
  customer: "",
  method: "Cash",
  date: new Date().toISOString().split("T")[0],
  amount: "",
  notes: "",
};

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>(() => getPayments());
  const [customers] = useState(() => getCustomers());
  const [searchTerm, setSearchTerm] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [deleteConfirmValue, setDeleteConfirmValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: "date",
    direction: "desc",
  });

  const [form, setForm] = useState<PaymentForm>(initialForm);

  useEffect(() => {
    savePayments(payments);
  }, [payments]);

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const cashCount = payments.filter((payment) => payment.method === "Cash").length;
  const cardCount = payments.filter((payment) => payment.method === "Card").length;
  const transferCount = payments.filter((payment) => payment.method === "Bank Transfer").length;
  const checkCount = payments.filter((payment) => payment.method === "Check").length;

  const latestPaymentDate =
    payments.length > 0
      ? [...payments].sort((a, b) => b.date.localeCompare(a.date))[0].date
      : "No payments yet";

  const requestSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredPayments = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();

    const filtered = payments.filter((payment) =>
      [
        payment.customer,
        payment.method,
        payment.date,
        payment.amount,
        payment.notes ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );

    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [payments, searchTerm, sortConfig]);

  const resetFormState = () => {
    setForm({
      ...initialForm,
      date: new Date().toISOString().split("T")[0],
    });
    setSelectedPayment(null);
    setIsEditing(false);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    resetFormState();
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedPayment(null);
    setDeleteConfirmValue("");
  };

  const openAddModal = () => {
    resetFormState();
    setShowFormModal(true);
  };

  const openEditModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsEditing(true);
    setForm({
      customer: payment.customer,
      method: payment.method,
      date: payment.date,
      amount: String(payment.amount),
      notes: payment.notes ?? "",
    });
    setShowFormModal(true);
  };

  const openDeleteModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setDeleteConfirmValue("");
    setShowDeleteModal(true);
  };

  const handleSavePayment = () => {
    if (!form.customer || !form.amount || !form.date) return;

    const amountNumber = Number(form.amount);
    if (Number.isNaN(amountNumber)) return;

    const payload: Payment = {
      customer: form.customer,
      method: form.method,
      date: form.date,
      amount: amountNumber,
      notes: form.notes.trim() || undefined,
    };

    if (isEditing && selectedPayment) {
      setPayments((prev) =>
        prev.map((payment) =>
          payment.customer === selectedPayment.customer &&
          payment.date === selectedPayment.date &&
          payment.amount === selectedPayment.amount
            ? payload
            : payment
        )
      );
    } else {
      setPayments((prev) => [payload, ...prev]);
    }

    closeFormModal();
  };

  const handleDeletePayment = () => {
    if (!selectedPayment) return;

    const confirmKey = `${selectedPayment.customer}-${selectedPayment.date}`;
    if (deleteConfirmValue.trim() !== confirmKey) return;

    setPayments((prev) =>
      prev.filter(
        (payment) =>
          !(
            payment.customer === selectedPayment.customer &&
            payment.date === selectedPayment.date &&
            payment.amount === selectedPayment.amount
          )
      )
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
      <div className="payments-page payments-enhanced-page">
        <div className="payments-header enhanced-page-header">
          <div>
            <p className="dashboard-badge">Payments Management</p>
            <h1 className="dashboard-title">Payments</h1>
            <p className="dashboard-subtitle">
              Manage payment records, add new payments, edit details, and delete safely.
            </p>
          </div>

          <button className="quick-action-btn" onClick={openAddModal}>
            + Add Payment
          </button>
        </div>

        <div className="payments-hero-grid">
          <div className="payment-hero-card payment-hero-primary">
            <div className="payment-hero-top">
              <span className="payment-hero-icon">💵</span>
              <div>
                <h3>Total Payments</h3>
                <p>All payment records</p>
              </div>
            </div>
            <strong>{payments.length}</strong>
          </div>

          <div className="payment-hero-card">
            <div className="payment-hero-top">
              <span className="payment-hero-icon">💰</span>
              <div>
                <h3>Total Amount</h3>
                <p>Total collected</p>
              </div>
            </div>
            <strong>{formatCurrency(totalAmount)}</strong>
          </div>

          <div className="payment-hero-card">
            <div className="payment-hero-top">
              <span className="payment-hero-icon">💵</span>
              <div>
                <h3>Cash</h3>
                <p>Cash payments</p>
              </div>
            </div>
            <strong>{cashCount}</strong>
          </div>

          <div className="payment-hero-card">
            <div className="payment-hero-top">
              <span className="payment-hero-icon">💳</span>
              <div>
                <h3>Card</h3>
                <p>Card payments</p>
              </div>
            </div>
            <strong>{cardCount}</strong>
          </div>

          <div className="payment-hero-card">
            <div className="payment-hero-top">
              <span className="payment-hero-icon">🏦</span>
              <div>
                <h3>Transfer</h3>
                <p>Bank transfers</p>
              </div>
            </div>
            <strong>{transferCount}</strong>
          </div>

          <div className="payment-hero-card">
            <div className="payment-hero-top">
              <span className="payment-hero-icon">🧾</span>
              <div>
                <h3>Checks</h3>
                <p>Check payments</p>
              </div>
            </div>
            <strong>{checkCount}</strong>
          </div>

          <div className="payment-hero-card payment-hero-wide">
            <div className="payment-hero-top">
              <span className="payment-hero-icon">📅</span>
              <div>
                <h3>Latest Payment</h3>
                <p>Most recent payment date</p>
              </div>
            </div>
            <strong>{latestPaymentDate}</strong>
          </div>
        </div>

        <div className="dashboard-card payments-table-card">
          <div className="payments-toolbar enhanced-toolbar">
            <div className="dashboard-search-box payments-search-box enhanced-search-box">
              <label className="dashboard-search-label">Search payments</label>
              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Search by customer, method, date, amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="dashboard-search-meta">
                {searchTerm.trim()
                  ? `${filteredPayments.length} result(s)`
                  : "Search all payments"}
              </span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="dashboard-table payments-enhanced-table">
              <thead>
                <tr>
                  {sortableHeader("Customer", "customer")}
                  {sortableHeader("Method", "method")}
                  {sortableHeader("Date", "date")}
                  {sortableHeader("Amount", "amount")}
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment, index) => (
                    <tr key={`${payment.customer}-${payment.date}-${payment.amount}-${index}`}>
                      <td>{payment.customer}</td>
                      <td>
                        <span className="payment-method-chip">{payment.method}</span>
                      </td>
                      <td>{payment.date}</td>
                      <td>{formatCurrency(payment.amount)}</td>
                      <td>{payment.notes || <span className="muted-dash">—</span>}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="table-action-btn edit-btn"
                            onClick={() => openEditModal(payment)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="table-action-btn delete-btn"
                            onClick={() => openDeleteModal(payment)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty-state-cell">
                      No matching payments found.
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
                <h2>{isEditing ? "Edit Payment" : "Add Payment"}</h2>
                <p>
                  {isEditing
                    ? "Update payment information."
                    : "Enter the new payment information."}
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
                <label className="modal-label">Method</label>
                <select
                  className="modal-input"
                  value={form.method}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      method: e.target.value as PaymentMethod,
                    }))
                  }
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Check">Check</option>
                </select>
              </div>

              <div>
                <label className="modal-label">Date</label>
                <input
                  className="modal-input"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                />
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
                <button type="button" className="modal-primary-btn" onClick={handleSavePayment}>
                  {isEditing ? "Save Changes" : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedPayment && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-card delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Delete Payment</h2>
                <p>
                  To confirm deletion, type:
                  <strong> {selectedPayment.customer}-{selectedPayment.date}</strong>
                </p>
              </div>
              <button className="modal-close-btn" onClick={closeDeleteModal}>
                ×
              </button>
            </div>

            <div className="delete-confirm-box">
              <div className="delete-warning-card">
                <strong>{selectedPayment.customer}</strong>
                <p>{formatCurrency(selectedPayment.amount)}</p>
                <span className="delete-id-tag">
                  {selectedPayment.customer}-{selectedPayment.date}
                </span>
              </div>

              <input
                className="modal-input"
                type="text"
                placeholder={`Type ${selectedPayment.customer}-${selectedPayment.date}`}
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
                  onClick={handleDeletePayment}
                  disabled={
                    deleteConfirmValue.trim() !==
                    `${selectedPayment.customer}-${selectedPayment.date}`
                  }
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