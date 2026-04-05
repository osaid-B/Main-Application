import { useEffect, useMemo, useState } from "react";
import {
  type Customer,
  getCustomers,
  saveCustomers,
} from "../data/storage";

type SortKey = "id" | "name" | "email" | "phone" | "joinedAt";
type SortDirection = "asc" | "desc";

const phoneRegex = /^(059|056)\d{7}$/;

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers());
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: "joinedAt",
    direction: "desc",
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    saveCustomers(customers);
  }, [customers]);

  const requestSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedAndFilteredCustomers = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();

    const filtered = customers.filter((customer) =>
      [customer.id, customer.name, customer.email, customer.phone, customer.joinedAt]
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
  }, [customers, searchTerm, sortConfig]);

  const closeModal = () => {
    setShowModal(false);
    setPhoneError("");
    setForm({
      name: "",
      email: "",
      phone: "",
    });
  };

  const handleAddCustomer = () => {
    if (!form.name || !form.email || !form.phone) return;

    if (!phoneRegex.test(form.phone)) {
      setPhoneError("Phone must be 10 digits and start with 059 or 056.");
      return;
    }

    const newCustomer: Customer = {
      id: `CUST-${1000 + customers.length + 1}`,
      name: form.name,
      email: form.email,
      phone: form.phone,
      joinedAt: new Date().toISOString().split("T")[0],
    };

    setCustomers((prev) => [newCustomer, ...prev]);
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
      <div className="customers-page">
        <div className="customers-header">
          <div>
            <p className="dashboard-badge">Customer Management</p>
            <h1 className="dashboard-title">Customers</h1>
            <p className="dashboard-subtitle">
              Manage your customer records, search quickly, and add new clients easily.
            </p>
          </div>

          <button className="quick-action-btn" onClick={() => setShowModal(true)}>
            + Add Customer
          </button>
        </div>

        <div className="customers-stats-grid">
          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">👥</span>
              <span className="stat-title">Total Customers</span>
            </div>
            <h3 className="stat-value">{customers.length}</h3>
            <p className="stat-change">All customer records</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="customers-toolbar">
            <div className="dashboard-search-box customers-search-box">
              <label className="dashboard-search-label">Search customers</label>
              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="dashboard-search-meta">
                {searchTerm.trim()
                  ? `${sortedAndFilteredCustomers.length} result(s)`
                  : "Search all customers"}
              </span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  {sortableHeader("ID", "id")}
                  {sortableHeader("Name", "name")}
                  {sortableHeader("Email", "email")}
                  {sortableHeader("Phone", "phone")}
                  {sortableHeader("Joined", "joinedAt")}
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredCustomers.length > 0 ? (
                  sortedAndFilteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.id}</td>
                      <td>{customer.name}</td>
                      <td>{customer.email}</td>
                      <td>{customer.phone}</td>
                      <td>{customer.joinedAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty-state-cell">
                      No matching customers found.
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
                <h2>Add Customer</h2>
                <p>Enter the new customer information.</p>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                ×
              </button>
            </div>

            <form className="modal-form">
              <div>
                <label className="modal-label">Customer Name</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Enter customer name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="modal-label">Email</label>
                <input
                  className="modal-input"
                  type="email"
                  placeholder="Enter email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="modal-label">Phone</label>
                <input
                  className="modal-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="059xxxxxxx or 056xxxxxxx"
                  value={form.phone}
                  onChange={(e) => {
                    const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setForm((prev) => ({ ...prev, phone: onlyDigits }));
                    setPhoneError("");
                  }}
                />
                {phoneError ? <p className="form-error-text">{phoneError}</p> : null}
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="button" className="modal-primary-btn" onClick={handleAddCustomer}>
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}