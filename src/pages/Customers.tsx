import { useEffect, useMemo, useState } from "react";
import type { Customer } from "../data/types";
import { getCustomers, saveCustomers } from "../data/storage";

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
  location: string;
  notes: string;
};

type FormErrors = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
};

type PendingCloseTarget = "add" | "edit" | null;

const emptyForm: CustomerForm = {
  name: "",
  email: "",
  phone: "",
  location: "",
  notes: "",
};

const DELETE_CONFIRMATION_CODE = "123";
const NOTE_PREVIEW_LIMIT = 220;

const COMMON_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "msn.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "mail.com",
  "zoho.com",
  "gmx.com",
  "yandex.com",
  "fastmail.com",
  "me.com",
  "pm.me",
  "qq.com",
  "163.com",
  "126.com",
  "naver.com",
  "daum.net",
  "rediffmail.com",
  "inbox.com",
];

function isValidPhone(phone: string) {
  return /^(059|056)\d{7}$/.test(phone);
}

function isValidEmail(email: string) {
  if (!email.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildEmailSuggestions(input: string) {
  const value = input.trim().toLowerCase();
  if (!value) return [];

  const hasAt = value.includes("@");
  const [localPart, domainPartRaw = ""] = value.split("@");
  const domainPart = domainPartRaw.trim();

  if (!localPart.trim()) return [];

  if (!hasAt) {
    return COMMON_EMAIL_DOMAINS.slice(0, 10).map(
      (domain) => `${localPart}@${domain}`
    );
  }

  return COMMON_EMAIL_DOMAINS.filter((domain) => domain.startsWith(domainPart))
    .slice(0, 10)
    .map((domain) => `${localPart}@${domain}`);
}

function EmailInput({
  value,
  onChange,
  error,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const suggestions = useMemo(() => buildEmailSuggestions(value), [value]);

  const shouldShowSuggestions =
    isOpen && value.trim() !== "" && suggestions.length > 0;

  return (
    <div style={{ position: "relative" }}>
      <input
        className="modal-input"
        type="email"
        placeholder={placeholder || "Enter email address (Optional)"}
        value={value}
        autoComplete="off"
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 150);
        }}
        onChange={(e) => onChange(e.target.value)}
      />

      {shouldShowSuggestions && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 30,
            background: "#ffffff",
            border: "1px solid #dbe7f3",
            borderRadius: "16px",
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.10)",
            padding: "8px",
            maxHeight: "240px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: "8px 10px 10px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#7b97b0",
            }}
          >
            Suggested email addresses
          </div>

          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(suggestion);
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                border: "none",
                background: "transparent",
                padding: "12px 14px",
                borderRadius: "12px",
                cursor: "pointer",
                color: "#1e293b",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

function ConfirmCloseModal({
  open,
  onKeepEditing,
  onDiscard,
  title,
  description,
}: {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
  title: string;
  description: string;
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onKeepEditing}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "520px" }}
      >
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          <button className="modal-close-btn" onClick={onKeepEditing}>
            ×
          </button>
        </div>

        <div
          style={{
            marginTop: "6px",
            background: "#f8fbff",
            border: "1px solid #dbe7f3",
            borderRadius: "16px",
            padding: "16px 18px",
            color: "#4b6580",
            lineHeight: 1.8,
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          You have unsaved changes. If you close now, the entered data will be
          lost.
        </div>

        <div className="modal-actions" style={{ marginTop: "22px" }}>
          <button
            type="button"
            className="modal-secondary-btn"
            onClick={onKeepEditing}
          >
            Continue Editing
          </button>

          <button
            type="button"
            className="quick-action-btn delete-btn"
            onClick={onDiscard}
            style={{
              minWidth: "170px",
              background:
                "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
              border: "none",
              color: "#fff",
            }}
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(() =>
    getCustomers().map((customer) => ({
      ...customer,
      email: customer.email || "",
      notes: customer.notes || "",
      location: customer.location || customer.address || "",
      isDeleted: customer.isDeleted || false,
    }))
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddConfirmModal, setShowAddConfirmModal] = useState(false);

  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState<CustomerForm>(emptyForm);
  const [editErrors, setEditErrors] = useState<FormErrors>({});

  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);

  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [pendingCloseTarget, setPendingCloseTarget] =
    useState<PendingCloseTarget>(null);

  useEffect(() => {
    saveCustomers(customers);
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();

    return customers.filter((customer) => {
      if (customer.isDeleted) return false;
      if (!value) return true;

      return [
        customer.id,
        customer.name,
        customer.email || "",
        customer.phone,
        customer.location || "",
        customer.notes || "",
        customer.joinedAt || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(value);
    });
  }, [customers, searchTerm]);

  const hasAddUnsavedChanges = useMemo(() => {
    return (
      form.name.trim() !== "" ||
      form.email.trim() !== "" ||
      form.phone.trim() !== "" ||
      form.location.trim() !== "" ||
      form.notes.trim() !== ""
    );
  }, [form]);

  const hasEditUnsavedChanges = useMemo(() => {
    if (!editingCustomer) return false;

    return (
      editForm.name.trim() !== (editingCustomer.name || "") ||
      editForm.email.trim() !== (editingCustomer.email || "") ||
      editForm.phone.trim() !== (editingCustomer.phone || "") ||
      editForm.location.trim() !==
        (editingCustomer.location || editingCustomer.address || "") ||
      editForm.notes.trim() !== (editingCustomer.notes || "")
    );
  }, [editForm, editingCustomer]);

  const validateForm = (values: CustomerForm): FormErrors => {
    const errors: FormErrors = {};

    if (!values.name.trim()) {
      errors.name = "Customer name is required.";
    }

    if (!values.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!/^\d+$/.test(values.phone.trim())) {
      errors.phone = "Phone number must contain numbers only.";
    } else if (values.phone.trim().length !== 10) {
      errors.phone = "Phone number must be exactly 10 digits.";
    } else if (!isValidPhone(values.phone.trim())) {
      errors.phone = "Phone number must start with 059 or 056";
    }

    if (values.email.trim() && !isValidEmail(values.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!values.location.trim()) {
      errors.location = "Location is required.";
    }

    return errors;
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setShowAddConfirmModal(false);
    setForm(emptyForm);
    setFormErrors({});
  };

  const closeEditModal = () => {
    setEditingCustomer(null);
    setEditForm(emptyForm);
    setEditErrors({});
  };

  const attemptCloseAddModal = () => {
    if (hasAddUnsavedChanges) {
      setPendingCloseTarget("add");
      return;
    }

    closeAddModal();
  };

  const attemptCloseEditModal = () => {
    if (hasEditUnsavedChanges) {
      setPendingCloseTarget("edit");
      return;
    }

    closeEditModal();
  };

  const discardPendingChanges = () => {
    if (pendingCloseTarget === "add") {
      closeAddModal();
    } else if (pendingCloseTarget === "edit") {
      closeEditModal();
    }

    setPendingCloseTarget(null);
  };

  const handlePhoneChange = (
    value: string,
    mode: "add" | "edit" = "add"
  ) => {
    const cleanedValue = value.replace(/\D/g, "").slice(0, 10);

    let phoneError: string | undefined;

    if (
      cleanedValue.length > 0 &&
      !(cleanedValue.startsWith("059") || cleanedValue.startsWith("056"))
    ) {
      phoneError = "Phone number must start with 059 or 056";
    } else if (cleanedValue.length === 10 && !isValidPhone(cleanedValue)) {
      phoneError =
        "Phone number must be exactly 10 digits and start with 059 or 056";
    } else {
      phoneError = undefined;
    }

    if (mode === "add") {
      setForm((prev) => ({ ...prev, phone: cleanedValue }));
      setFormErrors((prev) => ({ ...prev, phone: phoneError }));
    } else {
      setEditForm((prev) => ({ ...prev, phone: cleanedValue }));
      setEditErrors((prev) => ({ ...prev, phone: phoneError }));
    }
  };

  const requestAddCustomer = () => {
    const errors = validateForm(form);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setShowAddConfirmModal(true);
  };

  const confirmAddCustomer = () => {
    const newCustomer: Customer = {
      id: `CUST-${1000 + customers.length + 1}`,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
      address: form.location.trim(),
      notes: form.notes.trim(),
      joinedAt: new Date().toISOString().split("T")[0],
      isDeleted: false,
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    closeAddModal();
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      location: customer.location || customer.address || "",
      notes: customer.notes || "",
    });
    setEditErrors({});
  };

  const handleEditCustomer = () => {
    if (!editingCustomer) return;

    const errors = validateForm(editForm);
    setEditErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === editingCustomer.id
          ? {
              ...customer,
              name: editForm.name.trim(),
              email: editForm.email.trim(),
              phone: editForm.phone.trim(),
              location: editForm.location.trim(),
              address: editForm.location.trim(),
              notes: editForm.notes.trim(),
            }
          : customer
      )
    );

    closeEditModal();
  };

  const openDeleteModal = (id: string) => {
    setDeleteCustomerId(id);
    setDeleteCode("");
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    setDeleteCustomerId(null);
    setDeleteCode("");
    setDeleteError("");
  };

  const confirmDeleteCustomer = () => {
    if (deleteCode.trim() !== DELETE_CONFIRMATION_CODE) {
      setDeleteError("Incorrect confirmation code. Please type 123.");
      return;
    }

    setCustomers((prev) =>
      prev.filter((customer) => customer.id !== deleteCustomerId)
    );

    closeDeleteModal();
  };

  const openNoteModal = (note?: string) => {
    const cleanNote = note?.trim() || "No notes available.";
    setSelectedNote(cleanNote);
    setIsNoteExpanded(false);
  };

  const closeNoteModal = () => {
    setSelectedNote(null);
    setIsNoteExpanded(false);
  };

  const shouldShowReadMore =
    !!selectedNote &&
    selectedNote !== "No notes available." &&
    selectedNote.length > NOTE_PREVIEW_LIMIT;

  const displayedNote =
    selectedNote && !isNoteExpanded && shouldShowReadMore
      ? `${selectedNote.slice(0, NOTE_PREVIEW_LIMIT)}...`
      : selectedNote;

  return (
    <>
      <div className="customers-page">
        <div className="customers-header">
          <div>
            <p className="dashboard-badge">Customer Management</p>
            <h1 className="dashboard-title">Customers</h1>
            <p className="dashboard-subtitle">
              Manage customer records, contact details, and notes from one clean
              and professional workspace.
            </p>
          </div>

          <button
            className="quick-action-btn"
            onClick={() => setShowAddModal(true)}
          >
            + Add Customer
          </button>
        </div>

        <div className="dashboard-card">
          <div className="customers-toolbar">
            <div className="dashboard-search-box customers-search-box">
              <label className="dashboard-search-label">Search Customers</label>

              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Search by ID, name, email, phone, location, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <span className="dashboard-search-meta">
                {searchTerm.trim()
                  ? `${filteredCustomers.length} result(s)`
                  : "Search all customers"}
              </span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.id}</td>
                      <td>{customer.name}</td>
                      <td>
                        {customer.email?.trim()
                          ? customer.email
                          : "Not provided"}
                      </td>
                      <td>{customer.phone}</td>
                      <td>{customer.joinedAt}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            className="quick-action-btn secondary"
                            onClick={() => openEditModal(customer)}
                          >
                            Edit
                          </button>

                          <button
                            className="quick-action-btn secondary"
                            onClick={() => openNoteModal(customer.notes)}
                          >
                            Note
                          </button>

                          <button
                            className="quick-action-btn delete-btn"
                            onClick={() => openDeleteModal(customer.id)}
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

      {showAddModal && (
        <div className="modal-overlay" onClick={attemptCloseAddModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Add Customer</h2>
                <p>Enter the new customer information.</p>
              </div>

              <button className="modal-close-btn" onClick={attemptCloseAddModal}>
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
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, name: e.target.value }));
                    setFormErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                />
                {formErrors.name && (
                  <p className="form-error">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="modal-label">
                  Email{" "}
                  <span style={{ color: "#7b97b0", fontWeight: 500 }}>
                    (Optional)
                  </span>
                </label>

                <EmailInput
                  value={form.email}
                  placeholder="Enter email address (Optional)"
                  error={formErrors.email}
                  onChange={(value) => {
                    setForm((prev) => ({ ...prev, email: value }));
                    setFormErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                />
              </div>

              <div>
                <label className="modal-label">Phone</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Phone must start with 059 or 056"
                  value={form.phone}
                  onChange={(e) => handlePhoneChange(e.target.value, "add")}
                />
                {formErrors.phone && (
                  <p className="form-error">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="modal-label">Location</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Enter city or area"
                  value={form.location}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, location: e.target.value }));
                    setFormErrors((prev) => ({
                      ...prev,
                      location: undefined,
                    }));
                  }}
                />
                {formErrors.location && (
                  <p className="form-error">{formErrors.location}</p>
                )}
              </div>

              <div>
                <label className="modal-label">Notes</label>
                <textarea
                  className="modal-input"
                  placeholder="Enter customer notes"
                  rows={4}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-secondary-btn"
                  onClick={attemptCloseAddModal}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="modal-primary-btn"
                  onClick={requestAddCustomer}
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddConfirmModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddConfirmModal(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Confirm Addition</h2>
                <p>Review this action before saving.</p>
              </div>

              <button
                className="modal-close-btn"
                onClick={() => setShowAddConfirmModal(false)}
              >
                ×
              </button>
            </div>

            <p style={{ margin: 0, lineHeight: "1.8", color: "#567895" }}>
              Are you sure you want to add this customer?
            </p>

            <div className="modal-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="modal-secondary-btn"
                onClick={() => setShowAddConfirmModal(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="modal-primary-btn"
                onClick={confirmAddCustomer}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCustomer && (
        <div className="modal-overlay" onClick={attemptCloseEditModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Edit Customer</h2>
                <p>Update customer information.</p>
              </div>

              <button className="modal-close-btn" onClick={attemptCloseEditModal}>
                ×
              </button>
            </div>

            <form className="modal-form">
              <div>
                <label className="modal-label">Customer Name</label>
                <input
                  className="modal-input"
                  value={editForm.name}
                  onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, name: e.target.value }));
                    setEditErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                />
                {editErrors.name && (
                  <p className="form-error">{editErrors.name}</p>
                )}
              </div>

              <div>
                <label className="modal-label">
                  Email{" "}
                  <span style={{ color: "#7b97b0", fontWeight: 500 }}>
                    (Optional)
                  </span>
                </label>

                <EmailInput
                  value={editForm.email}
                  placeholder="Enter email address (Optional)"
                  error={editErrors.email}
                  onChange={(value) => {
                    setEditForm((prev) => ({ ...prev, email: value }));
                    setEditErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                />
              </div>

              <div>
                <label className="modal-label">Phone</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Phone must start with 059 or 056"
                  value={editForm.phone}
                  onChange={(e) => handlePhoneChange(e.target.value, "edit")}
                />
                {editErrors.phone && (
                  <p className="form-error">{editErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="modal-label">Location</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Enter city or area"
                  value={editForm.location}
                  onChange={(e) => {
                    setEditForm((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }));
                    setEditErrors((prev) => ({
                      ...prev,
                      location: undefined,
                    }));
                  }}
                />
                {editErrors.location && (
                  <p className="form-error">{editErrors.location}</p>
                )}
              </div>

              <div>
                <label className="modal-label">Notes</label>
                <textarea
                  className="modal-input"
                  rows={4}
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-secondary-btn"
                  onClick={attemptCloseEditModal}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="modal-primary-btn"
                  onClick={handleEditCustomer}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteCustomerId && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Confirm Deletion</h2>
                <p>Delete action requires confirmation code.</p>
              </div>

              <button className="modal-close-btn" onClick={closeDeleteModal}>
                ×
              </button>
            </div>

            <p style={{ margin: 0, lineHeight: "1.8", color: "#567895" }}>
              To confirm deletion, type <strong>123</strong>
            </p>

            <div style={{ marginTop: "16px" }}>
              <input
                className="modal-input"
                type="text"
                placeholder="Type 123"
                value={deleteCode}
                onChange={(e) => {
                  setDeleteCode(e.target.value);
                  setDeleteError("");
                }}
              />
              {deleteError && <p className="form-error">{deleteError}</p>}
            </div>

            <div className="modal-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="modal-secondary-btn"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="quick-action-btn delete-btn"
                onClick={confirmDeleteCustomer}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedNote !== null && (
        <div className="modal-overlay" onClick={closeNoteModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Customer Note</h2>
                <p>Customer note details.</p>
              </div>

              <button className="modal-close-btn" onClick={closeNoteModal}>
                ×
              </button>
            </div>

            <div style={{ padding: "8px 0 0" }}>
              <p
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.9",
                  margin: 0,
                  color: "#334155",
                  fontSize: "15px",
                  fontWeight: 500,
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  userSelect: "text",
                  maxHeight: isNoteExpanded ? "320px" : "unset",
                  overflowY: isNoteExpanded ? "auto" : "visible",
                }}
              >
                {displayedNote}
              </p>

              {shouldShowReadMore && (
                <button
                  type="button"
                  onClick={() => setIsNoteExpanded((prev) => !prev)}
                  style={{
                    marginTop: "14px",
                    border: "none",
                    background: "transparent",
                    color: "#2563eb",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {isNoteExpanded ? "Read Less" : "Read More"}
                </button>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: "20px" }}>
              <button className="modal-primary-btn" onClick={closeNoteModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmCloseModal
        open={pendingCloseTarget !== null}
        title="Unsaved Changes"
        description="Please confirm before closing this form."
        onKeepEditing={() => setPendingCloseTarget(null)}
        onDiscard={discardPendingChanges}
      />
    </>
  );
}