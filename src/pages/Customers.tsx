import { useEffect, useMemo, useState } from "react";
import {
  type Customer,
  getCustomers,
  resetCustomers,
  saveCustomers,
} from "../data/storage";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers());
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    status: "Active" as "Active" | "Inactive",
  });

  useEffect(() => {
    saveCustomers(customers);
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();
    if (!value) return customers;

    return customers.filter((customer) =>
      [
        customer.id,
        customer.name,
        customer.email,
        customer.phone,
        customer.status,
        customer.joinedAt,
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [customers, searchTerm]);

  const activeCount = customers.filter((customer) => customer.status === "Active").length;
  const inactiveCount = customers.filter((customer) => customer.status === "Inactive").length;

  const closeModal = () => {
    setShowModal(false);
    setForm({
      name: "",
      email: "",
      phone: "",
      status: "Active",
    });
  };

  const handleAddCustomer = () => {
    if (!form.name || !form.email || !form.phone) return;

    const newCustomer: Customer = {
      id: `CUST-${1000 + customers.length + 1}`,
      name: form.name,
      email: form.email,
      phone: form.phone,
      status: form.status,
      joinedAt: new Date().toISOString().split("T")[0],
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    closeModal();
  };

  const handleReset = () => {
    resetCustomers();
    setCustomers(getCustomers());
  };

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

          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">✅</span>
              <span className="stat-title">Active Customers</span>
            </div>
            <h3 className="stat-value">{activeCount}</h3>
            <p className="stat-change">Currently active</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">⏸️</span>
              <span className="stat-title">Inactive Customers</span>
            </div>
            <h3 className="stat-value">{inactiveCount}</h3>
            <p className="stat-change">Need follow-up</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="customers-toolbar">
            <div className="dashboard-search-box customers-search-box">
              <label className="dashboard-search-label">Search customers</label>
              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Search by name, email, phone, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="dashboard-search-meta">
                {searchTerm.trim()
                  ? `${filteredCustomers.length} result(s)`
                  : "Search all customers"}
              </span>
            </div>

            <button className="quick-action-btn secondary" onClick={handleReset}>
              Reset Data
            </button>
          </div>

          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.id}</td>
                      <td>{customer.name}</td>
                      <td>{customer.email}</td>
                      <td>{customer.phone}</td>
                      <td>
                        <span
                          className={
                            customer.status === "Active"
                              ? "status-badge status-paid"
                              : "status-badge status-pending"
                          }
                        >
                          {customer.status}
                        </span>
                      </td>
                      <td>{customer.joinedAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="empty-state-cell">
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
                  placeholder="Enter phone"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
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
                      status: e.target.value as "Active" | "Inactive",
                    }))
                  }
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
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