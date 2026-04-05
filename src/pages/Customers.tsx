import { useEffect, useMemo, useState } from "react";
import {
  type Customer,
  getCustomers,
  saveCustomers,
} from "../data/storage";

type SortKey = "id" | "name" | "email" | "phone" | "joinedAt";
type SortDirection = "asc" | "desc";

const phoneRegex = /^(059|056)\d{7}$/;

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
};

const initialForm: CustomerForm = {
  name: "",
  email: "",
  phone: "",
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers());
  const [searchTerm, setSearchTerm] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [deleteConfirmValue, setDeleteConfirmValue] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: "joinedAt",
    direction: "desc",
  });

  const [form, setForm] = useState<CustomerForm>(initialForm);

  useEffect(() => {
    saveCustomers(customers);
  }, [customers]);

  const totalCustomers = customers.length;
  const newThisWeek = customers.filter(
    (customer) => customer.joinedAt >= "2026-04-01"
  ).length;

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

  const resetFormState = () => {
    setForm(initialForm);
    setPhoneError("");
    setSelectedCustomer(null);
    setIsEditing(false);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    resetFormState();
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmValue("");
    setSelectedCustomer(null);
  };

  const openAddModal = () => {
    resetFormState();
    setShowFormModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditing(true);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    });
    setPhoneError("");
    setShowFormModal(true);
  };

  const openDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDeleteConfirmValue("");
    setShowDeleteModal(true);
  };

  const handleSaveCustomer = () => {
    if (!form.name || !form.email || !form.phone) return;

    if (!phoneRegex.test(form.phone)) {
      setPhoneError("Phone must be exactly 10 digits and start with 059 or 056.");
      return;
    }

    if (isEditing && selectedCustomer) {
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === selectedCustomer.id
            ? {
                ...customer,
                name: form.name,
                email: form.email,
                phone: form.phone,
              }
            : customer
        )
      );
    } else {
      const newCustomer: Customer = {
        id: `CUST-${1000 + customers.length + 1}`,
        name: form.name,
        email: form.email,
        phone: form.phone,
        joinedAt: new Date().toISOString().split("T")[0],
      };

      setCustomers((prev) => [newCustomer, ...prev]);
    }

    closeFormModal();
  };

  const handleDeleteCustomer = () => {
    if (!selectedCustomer) return;
    if (deleteConfirmValue.trim() !== selectedCustomer.id) return;

    setCustomers((prev) =>
      prev.filter((customer) => customer.id !== selectedCustomer.id)
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
      <div className="customers-page customers-enhanced-page">
        <div className="customers-header enhanced-page-header">
          <div>
            <p className="dashboard-badge">Customer Management</p>
            <h1 className="dashboard-title">Customers</h1>
            <p className="dashboard-subtitle">
              Manage your customer records, edit details quickly, and delete records safely with confirmation.
            </p>
          </div>

          <button className="quick-action-btn" onClick={openAddModal}>
            + Add Customer
          </button>
        </div>

        <div className="customers-hero-grid">
          <div className="customer-hero-card customer-hero-primary">
            <div className="customer-hero-top">
              <span className="customer-hero-icon">👥</span>
              <div>
                <h3>Total Customers</h3>
                <p>All saved customer records</p>
              </div>
            </div>
            <strong>{totalCustomers}</strong>
          </div>

          <div className="customer-hero-card">
            <div className="customer-hero-top">
              <span className="customer-hero-icon">✨</span>
              <div>
                <h3>New Entries</h3>
                <p>Recently added customers</p>
              </div>
            </div>
            <strong>{newThisWeek}</strong>
          </div>

          <div className="customer-hero-card">
            <div className="customer-hero-top">
              <span className="customer-hero-icon">📱</span>
              <div>
                <h3>Valid Phones</h3>
                <p>Tracked with 059 / 056 format</p>
              </div>
            </div>
            <strong>{customers.filter((c) => phoneRegex.test(c.phone)).length}</strong>
          </div>
        </div>

        <div className="dashboard-card customers-table-card">
          <div className="customers-toolbar enhanced-toolbar">
            <div className="dashboard-search-box customers-search-box enhanced-search-box">
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
            <table className="dashboard-table customers-enhanced-table">
              <thead>
                <tr>
                  {sortableHeader("ID", "id")}
                  {sortableHeader("Name", "name")}
                  {sortableHeader("Email", "email")}
                  {sortableHeader("Phone", "phone")}
                  {sortableHeader("Joined", "joinedAt")}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredCustomers.length > 0 ? (
                  sortedAndFilteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <span className="customer-id-badge">{customer.id}</span>
                      </td>
                      <td>
                        <div className="customer-main-cell">
                          <strong>{customer.name}</strong>
                          <span>Client record</span>
                        </div>
                      </td>
                      <td>{customer.email}</td>
                      <td>{customer.phone}</td>
                      <td>{customer.joinedAt}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="table-action-btn edit-btn"
                            onClick={() => openEditModal(customer)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="table-action-btn delete-btn"
                            onClick={() => openDeleteModal(customer)}
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
                      No matching customers found.
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
                <h2>{isEditing ? "Edit Customer" : "Add Customer"}</h2>
                <p>
                  {isEditing
                    ? "Update customer information."
                    : "Enter the new customer information."}
                </p>
              </div>
              <button className="modal-close-btn" onClick={closeFormModal}>
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
                <button type="button" className="modal-secondary-btn" onClick={closeFormModal}>
                  Cancel
                </button>
                <button type="button" className="modal-primary-btn" onClick={handleSaveCustomer}>
                  {isEditing ? "Save Changes" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedCustomer && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-card delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Delete Customer</h2>
                <p>
                  This action cannot be undone. To confirm deletion, type the customer serial ID exactly.
                </p>
              </div>
              <button className="modal-close-btn" onClick={closeDeleteModal}>
                ×
              </button>
            </div>

            <div className="delete-confirm-box">
              <div className="delete-warning-card">
                <strong>{selectedCustomer.name}</strong>
                <p>{selectedCustomer.email}</p>
                <span className="delete-id-tag">{selectedCustomer.id}</span>
              </div>

              <label className="modal-label">
                Type this ID to confirm: <strong>{selectedCustomer.id}</strong>
              </label>
              <input
                className="modal-input"
                type="text"
                placeholder={`Type ${selectedCustomer.id}`}
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
                  onClick={handleDeleteCustomer}
                  disabled={deleteConfirmValue.trim() !== selectedCustomer.id}
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