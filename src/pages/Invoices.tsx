import { useEffect, useMemo, useState } from "react";
import {
  type Invoice,
  getCustomers,
  getInvoices,
  saveInvoices,
} from "../data/storage";

type SortKey = "id" | "customer" | "date" | "amount" | "status";
type SortDirection = "asc" | "desc";

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => getInvoices());
  const [customers] = useState(() => getCustomers());
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: "date",
    direction: "desc",
  });

  const [form, setForm] = useState({
    customer: "",
    amount: "",
    status: "Paid" as "Paid" | "Pending" | "Partial",
  });

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
      [invoice.id, invoice.customer, invoice.date, invoice.amount, invoice.status]
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
  }, [invoices, searchTerm, sortConfig]);

  const paidCount = invoices.filter((invoice) => invoice.status === "Paid").length;
  const pendingCount = invoices.filter((invoice) => invoice.status === "Pending").length;
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = invoices
    .filter((invoice) => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  const closeModal = () => {
    setShowModal(false);
    setForm({
      customer: "",
      amount: "",
      status: "Paid",
    });
  };

  const handleAddInvoice = () => {
    if (!form.customer || !form.amount) return;

    const amountNumber = Number(form.amount);
    if (Number.isNaN(amountNumber)) return;

    const newInvoice: Invoice = {
      id: `INV-${1000 + invoices.length + 1}`,
      customer: form.customer,
      amount: amountNumber,
      status: form.status,
      date: new Date().toISOString().split("T")[0],
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    closeModal();
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
      <div className="invoices-page">
        <div className="invoices-header">
          <div>
            <p className="dashboard-badge">Invoice Management</p>
            <h1 className="dashboard-title">Invoices</h1>
            <p className="dashboard-subtitle">
              Create, track, and search invoices with a clean and organized workflow.
            </p>
          </div>

          <button className="quick-action-btn" onClick={() => setShowModal(true)}>
            + Add Invoice
          </button>
        </div>

        <div className="invoices-stats-grid">
          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">🧾</span>
              <span className="stat-title">Total Invoices</span>
            </div>
            <h3 className="stat-value">{invoices.length}</h3>
            <p className="stat-change">All invoices in system</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">✅</span>
              <span className="stat-title">Paid Invoices</span>
            </div>
            <h3 className="stat-value">{paidCount}</h3>
            <p className="stat-change">Completed invoices</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">⏳</span>
              <span className="stat-title">Pending Invoices</span>
            </div>
            <h3 className="stat-value">{pendingCount}</h3>
            <p className="stat-change">Awaiting payment</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">💵</span>
              <span className="stat-title">Total Amount</span>
            </div>
            <h3 className="stat-value">${totalAmount}</h3>
            <p className="stat-change">${paidAmount} paid already</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="invoices-toolbar">
            <div className="dashboard-search-box invoices-search-box">
              <label className="dashboard-search-label">Search invoices</label>
              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Search by customer, amount, date, status..."
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
            <table className="dashboard-table">
              <thead>
                <tr>
                  {sortableHeader("ID", "id")}
                  {sortableHeader("Customer", "customer")}
                  {sortableHeader("Date", "date")}
                  {sortableHeader("Amount", "amount")}
                  {sortableHeader("Status", "status")}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.id}</td>
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty-state-cell">
                      No matching invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Add Invoice</h2>
                <p>Enter the new invoice information.</p>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
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
                      status: e.target.value as "Paid" | "Pending" | "Partial",
                    }))
                  }
                >
                  <option>Paid</option>
                  <option>Partial</option>
                  <option>Pending</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="button" className="modal-primary-btn" onClick={handleAddInvoice}>
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}