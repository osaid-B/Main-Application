import { useEffect, useMemo, useRef, useState } from "react";
import {
  getProducts,
  getPurchases,
  getSuppliers,
  savePurchases,
} from "../data/storage";
import { buildPurchasesWithRelations } from "../data/relations";
import type { Product, Purchase, PurchaseStatus, Supplier } from "../data/types";

type ExtendedPurchase = Purchase & {
  supplierName: string;
  productName: string;
};

type PurchaseForm = {
  supplierId: string;
  productId: string;
  quantity: string;
  totalCost: string;
  status: PurchaseStatus;
  date: string;
  notes: string;
};

type PurchaseFormErrors = {
  supplierId?: string;
  productId?: string;
  quantity?: string;
  totalCost?: string;
  status?: string;
  date?: string;
};

const EMPTY_FORM: PurchaseForm = {
  supplierId: "",
  productId: "",
  quantity: "",
  totalCost: "",
  status: "Received",
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

function SearchableSupplierSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Supplier[];
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selectedSupplier = options.find((supplier) => supplier.id === value);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;

    return options.filter((supplier) =>
      [supplier.name, supplier.phone ?? "", supplier.email ?? "", supplier.id]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [options, query]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="relation-select" ref={wrapperRef}>
      <div className="relation-select-input-wrap">
        <input
          className="modal-input"
          type="text"
          placeholder="Search supplier..."
          value={isOpen ? query : selectedSupplier?.name ?? ""}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
        />
        <span className="relation-select-arrow">▾</span>
      </div>

      {isOpen && (
        <div className="relation-select-menu">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((supplier) => (
              <button
                key={supplier.id}
                type="button"
                className={`relation-option ${supplier.id === value ? "active" : ""}`}
                onClick={() => {
                  onChange(supplier.id);
                  setQuery("");
                  setIsOpen(false);
                }}
              >
                <strong>{supplier.name}</strong>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                  {supplier.phone ?? ""} {supplier.email ? `• ${supplier.email}` : ""}
                </div>
              </button>
            ))
          ) : (
            <div className="relation-empty">No suppliers found.</div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchableProductSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Product[];
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selectedProduct = options.find((product) => product.id === value);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;

    return options.filter((product) =>
      [product.name, product.category, product.id]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [options, query]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="relation-select" ref={wrapperRef}>
      <div className="relation-select-input-wrap">
        <input
          className="modal-input"
          type="text"
          placeholder="Search product..."
          value={isOpen ? query : selectedProduct?.name ?? ""}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
        />
        <span className="relation-select-arrow">▾</span>
      </div>

      {isOpen && (
        <div className="relation-select-menu">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((product) => (
              <button
                key={product.id}
                type="button"
                className={`relation-option ${product.id === value ? "active" : ""}`}
                onClick={() => {
                  onChange(product.id);
                  setQuery("");
                  setIsOpen(false);
                }}
              >
                <strong>{product.name}</strong>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                  {product.category} • Stock {product.stock}
                </div>
              </button>
            ))
          ) : (
            <div className="relation-empty">No products found.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Purchases() {
  const [suppliers] = useState<Supplier[]>(() => getSuppliers());
  const [products] = useState<Product[]>(() => getProducts());
  const [purchases, setPurchases] = useState<ExtendedPurchase[]>(() =>
    buildPurchasesWithRelations(getPurchases(), getSuppliers(), getProducts())
  );

  const [searchTerm, setSearchTerm] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedPurchase, setSelectedPurchase] = useState<ExtendedPurchase | null>(null);

  const [form, setForm] = useState<PurchaseForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<PurchaseFormErrors>({});
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
  }>({
    show: false,
    message: "",
  });

  useEffect(() => {
    if (!toast.show) return;
    const timer = window.setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [toast.show]);

  const filteredPurchases = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();
    if (!value) return purchases;

    return purchases.filter((purchase) =>
      [
        purchase.id,
        purchase.supplierName,
        purchase.productName,
        purchase.quantity,
        purchase.totalCost,
        purchase.status,
        purchase.date,
        purchase.notes ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [purchases, searchTerm]);

  const validateForm = (data: PurchaseForm) => {
    const nextErrors: PurchaseFormErrors = {};

    if (!data.supplierId.trim()) {
      nextErrors.supplierId = "Please select a supplier.";
    }

    if (!data.productId.trim()) {
      nextErrors.productId = "Please select a product.";
    }

    if (data.quantity.trim() === "") {
      nextErrors.quantity = "Quantity is required.";
    } else if (Number.isNaN(Number(data.quantity))) {
      nextErrors.quantity = "Quantity must be a valid number.";
    } else if (Number(data.quantity) <= 0) {
      nextErrors.quantity = "Quantity must be greater than 0.";
    }

    if (data.totalCost.trim() === "") {
      nextErrors.totalCost = "Total cost is required.";
    } else if (Number.isNaN(Number(data.totalCost))) {
      nextErrors.totalCost = "Total cost must be a valid number.";
    } else if (Number(data.totalCost) <= 0) {
      nextErrors.totalCost = "Total cost must be greater than 0.";
    }

    if (!data.date) {
      nextErrors.date = "Please select a valid date.";
    }

    if (!data.status) {
      nextErrors.status = "Please select a status.";
    }

    return nextErrors;
  };

  const refreshPurchases = (updatedPurchases: Purchase[]) => {
    savePurchases(updatedPurchases);
    setPurchases(buildPurchasesWithRelations(updatedPurchases, suppliers, products));
  };

  const showSuccessToast = (message: string) => {
    setToast({
      show: true,
      message,
    });
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedPurchase(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedPurchase(null);
    setDeleteConfirmText("");
  };

  const handleFormFieldChange = (field: keyof PurchaseForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    setErrors((prev) => {
      const next = { ...prev };

      if (field === "supplierId") {
        if (!value.trim()) next.supplierId = "Please select a supplier.";
        else delete next.supplierId;
      }

      if (field === "productId") {
        if (!value.trim()) next.productId = "Please select a product.";
        else delete next.productId;
      }

      if (field === "quantity") {
        if (value.trim() === "") next.quantity = "Quantity is required.";
        else if (Number.isNaN(Number(value))) next.quantity = "Quantity must be a valid number.";
        else if (Number(value) <= 0) next.quantity = "Quantity must be greater than 0.";
        else delete next.quantity;
      }

      if (field === "totalCost") {
        if (value.trim() === "") next.totalCost = "Total cost is required.";
        else if (Number.isNaN(Number(value))) next.totalCost = "Total cost must be a valid number.";
        else if (Number(value) <= 0) next.totalCost = "Total cost must be greater than 0.";
        else delete next.totalCost;
      }

      if (field === "date") {
        if (!value) next.date = "Please select a valid date.";
        else delete next.date;
      }

      return next;
    });
  };

  const handleAddPurchase = () => {
    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    const currentPurchases = getPurchases();

    const newPurchase: Purchase = {
      id: `PUR-${1000 + currentPurchases.length + 1}`,
      supplierId: form.supplierId,
      productId: form.productId,
      quantity: Number(form.quantity),
      totalCost: Number(form.totalCost),
      status: form.status,
      date: form.date,
      notes: form.notes.trim(),
      isDeleted: false,
    };

    const updatedPurchases = [newPurchase, ...currentPurchases];
    refreshPurchases(updatedPurchases);

    closeAddModal();
    showSuccessToast("Purchase added successfully.");
  };

  const openEditModal = (purchase: ExtendedPurchase) => {
    setSelectedPurchase(purchase);
    setForm({
      supplierId: purchase.supplierId,
      productId: purchase.productId,
      quantity: String(purchase.quantity),
      totalCost: String(purchase.totalCost),
      status: purchase.status,
      date: purchase.date,
      notes: purchase.notes ?? "",
    });
    setErrors({});
    setShowEditModal(true);
  };

  const handleConfirmEdit = () => {
    if (!selectedPurchase) return;

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    const updatedPurchases = getPurchases().map((purchase) =>
      purchase.id === selectedPurchase.id
        ? {
            ...purchase,
            supplierId: form.supplierId,
            productId: form.productId,
            quantity: Number(form.quantity),
            totalCost: Number(form.totalCost),
            status: form.status,
            date: form.date,
            notes: form.notes.trim(),
          }
        : purchase
    );

    refreshPurchases(updatedPurchases);
    closeEditModal();
    showSuccessToast("Purchase updated successfully.");
  };

  const openDeleteModal = (purchase: ExtendedPurchase) => {
    setSelectedPurchase(purchase);
    setDeleteConfirmText("");
    setShowDeleteModal(true);
  };

  const handleDeletePurchase = () => {
    if (!selectedPurchase || deleteConfirmText !== "DELETE") return;

    const updatedPurchases = getPurchases().filter(
      (purchase) => purchase.id !== selectedPurchase.id
    );

    refreshPurchases(updatedPurchases);
    closeDeleteModal();
    showSuccessToast("Purchase deleted successfully.");
  };

  const quantityInvalid =
    form.quantity.trim() === "" ||
    Number.isNaN(Number(form.quantity)) ||
    Number(form.quantity) <= 0;

  const totalCostInvalid =
    form.totalCost.trim() === "" ||
    Number.isNaN(Number(form.totalCost)) ||
    Number(form.totalCost) <= 0;

  const deleteEnabled = deleteConfirmText === "DELETE";

  return (
    <>
      <style>{`
        .purchases-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .purchases-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }

        .purchases-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
        }

        .purchases-search-box {
          flex: 1;
          min-width: 260px;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .dashboard-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1120px;
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

        .empty-state-cell {
          text-align: center;
          color: #94a3b8;
          padding: 32px 16px;
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

        .status-received {
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

        .modal-card.small {
          max-width: 480px;
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

        .modal-form,
        .modal-content {
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
        .modal-secondary-btn,
        .modal-danger-btn {
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

        .modal-danger-btn {
          background: #dc2626;
          color: white;
        }

        .modal-danger-btn:hover:not(:disabled) {
          background: #b91c1c;
        }

        .modal-primary-btn:disabled,
        .modal-danger-btn:disabled,
        .modal-secondary-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .danger-text {
          margin: 0 0 10px;
          color: #b91c1c;
          font-weight: 700;
        }

        .confirm-text {
          margin: 0;
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

        .relation-select {
          position: relative;
        }

        .relation-select-input-wrap {
          position: relative;
        }

        .relation-select-arrow {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #64748b;
          font-size: 12px;
        }

        .relation-select-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          max-height: 220px;
          overflow-y: auto;
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
          z-index: 30;
        }

        .relation-option {
          width: 100%;
          text-align: left;
          border: none;
          background: white;
          padding: 12px 14px;
          font-size: 14px;
          color: #1e293b;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .relation-option:hover,
        .relation-option.active {
          background: #eff6ff;
        }

        .relation-empty {
          padding: 12px 14px;
          color: #94a3b8;
          font-size: 14px;
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
          .modal-secondary-btn,
          .modal-danger-btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="purchases-page">
        <div className="purchases-header">
          <div>
            <p className="dashboard-badge">Purchase Management</p>
            <h1 className="dashboard-title">Purchases</h1>
            <p className="dashboard-subtitle">
              Manage supplier-linked purchases and product-linked stock entries.
            </p>
          </div>

          <button className="quick-action-btn" onClick={() => setShowAddModal(true)}>
            + Add Purchase
          </button>
        </div>

        <div className="dashboard-card">
          <div className="purchases-toolbar">
            <div className="dashboard-search-box purchases-search-box">
              <label className="dashboard-search-label">Search purchases</label>
              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Search by supplier, product, quantity, total cost, date, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="dashboard-search-meta">
                {searchTerm.trim()
                  ? `${filteredPurchases.length} result(s)`
                  : "Search all purchases"}
              </span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Supplier</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPurchases.length > 0 ? (
                  filteredPurchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td>{purchase.id}</td>
                      <td>{purchase.supplierName}</td>
                      <td>{purchase.productName}</td>
                      <td>{purchase.quantity}</td>
                      <td>${purchase.totalCost}</td>
                      <td>
                        <span
                          className={
                            purchase.status === "Received"
                              ? "status-badge status-received"
                              : "status-badge status-pending"
                          }
                        >
                          {purchase.status}
                        </span>
                      </td>
                      <td>{purchase.date}</td>
                      <td>{purchase.notes || "—"}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="table-btn edit"
                            onClick={() => openEditModal(purchase)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="table-btn delete"
                            onClick={() => openDeleteModal(purchase)}
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
                      No matching purchases found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Add Purchase</h2>
                <p>Enter the new purchase information.</p>
              </div>
              <button className="modal-close-btn" onClick={closeAddModal}>
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
              <div className="modal-grid">
                <div>
                  <label className="modal-label">Supplier</label>
                  <SearchableSupplierSelect
                    value={form.supplierId}
                    options={suppliers}
                    onChange={(value) => handleFormFieldChange("supplierId", value)}
                  />
                  {errors.supplierId && (
                    <span className="field-error">{errors.supplierId}</span>
                  )}
                </div>

                <div>
                  <label className="modal-label">Product</label>
                  <SearchableProductSelect
                    value={form.productId}
                    options={products}
                    onChange={(value) => handleFormFieldChange("productId", value)}
                  />
                  {errors.productId && (
                    <span className="field-error">{errors.productId}</span>
                  )}
                </div>

                <div>
                  <label className="modal-label">Quantity</label>
                  <input
                    className="modal-input"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter quantity"
                    value={form.quantity}
                    onChange={(e) => handleFormFieldChange("quantity", e.target.value)}
                  />
                  {errors.quantity && (
                    <span className="field-error">{errors.quantity}</span>
                  )}
                </div>

                <div>
                  <label className="modal-label">Total Cost</label>
                  <input
                    className="modal-input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Enter total cost"
                    value={form.totalCost}
                    onChange={(e) => handleFormFieldChange("totalCost", e.target.value)}
                  />
                  {errors.totalCost && (
                    <span className="field-error">{errors.totalCost}</span>
                  )}
                </div>

                <div>
                  <label className="modal-label">Status</label>
                  <select
                    className="modal-input"
                    value={form.status}
                    onChange={(e) =>
                      handleFormFieldChange("status", e.target.value as PurchaseStatus)
                    }
                  >
                    <option value="Received">Received</option>
                    <option value="Pending">Pending</option>
                  </select>
                  {errors.status && <span className="field-error">{errors.status}</span>}
                </div>

                <div>
                  <label className="modal-label">Date</label>
                  <input
                    className="modal-input"
                    type="date"
                    value={form.date}
                    onChange={(e) => handleFormFieldChange("date", e.target.value)}
                  />
                  {errors.date && <span className="field-error">{errors.date}</span>}
                </div>

                <div className="modal-grid-full">
                  <label className="modal-label">Notes</label>
                  <textarea
                    className="modal-textarea"
                    placeholder="Add purchase notes..."
                    value={form.notes}
                    onChange={(e) => handleFormFieldChange("notes", e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-secondary-btn" onClick={closeAddModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="modal-primary-btn"
                  onClick={handleAddPurchase}
                  disabled={quantityInvalid || totalCostInvalid}
                >
                  Save Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Edit Purchase</h2>
                <p>Update the purchase details below.</p>
              </div>
              <button className="modal-close-btn" onClick={closeEditModal}>
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
              <div className="modal-grid">
                <div>
                  <label className="modal-label">Supplier</label>
                  <SearchableSupplierSelect
                    value={form.supplierId}
                    options={suppliers}
                    onChange={(value) => handleFormFieldChange("supplierId", value)}
                  />
                  {errors.supplierId && (
                    <span className="field-error">{errors.supplierId}</span>
                  )}
                </div>

                <div>
                  <label className="modal-label">Product</label>
                  <SearchableProductSelect
                    value={form.productId}
                    options={products}
                    onChange={(value) => handleFormFieldChange("productId", value)}
                  />
                  {errors.productId && (
                    <span className="field-error">{errors.productId}</span>
                  )}
                </div>

                <div>
                  <label className="modal-label">Quantity</label>
                  <input
                    className="modal-input"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter quantity"
                    value={form.quantity}
                    onChange={(e) => handleFormFieldChange("quantity", e.target.value)}
                  />
                  {errors.quantity && (
                    <span className="field-error">{errors.quantity}</span>
                  )}
                </div>

                <div>
                  <label className="modal-label">Total Cost</label>
                  <input
                    className="modal-input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Enter total cost"
                    value={form.totalCost}
                    onChange={(e) => handleFormFieldChange("totalCost", e.target.value)}
                  />
                  {errors.totalCost && (
                    <span className="field-error">{errors.totalCost}</span>
                  )}
                </div>

                <div>
                  <label className="modal-label">Status</label>
                  <select
                    className="modal-input"
                    value={form.status}
                    onChange={(e) =>
                      handleFormFieldChange("status", e.target.value as PurchaseStatus)
                    }
                  >
                    <option value="Received">Received</option>
                    <option value="Pending">Pending</option>
                  </select>
                  {errors.status && <span className="field-error">{errors.status}</span>}
                </div>

                <div>
                  <label className="modal-label">Date</label>
                  <input
                    className="modal-input"
                    type="date"
                    value={form.date}
                    onChange={(e) => handleFormFieldChange("date", e.target.value)}
                  />
                  {errors.date && <span className="field-error">{errors.date}</span>}
                </div>

                <div className="modal-grid-full">
                  <label className="modal-label">Notes</label>
                  <textarea
                    className="modal-textarea"
                    placeholder="Add purchase notes..."
                    value={form.notes}
                    onChange={(e) => handleFormFieldChange("notes", e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-secondary-btn" onClick={closeEditModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="modal-primary-btn"
                  onClick={handleConfirmEdit}
                  disabled={quantityInvalid || totalCostInvalid}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-card small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Delete Purchase</h2>
                <p>This action cannot be undone.</p>
              </div>
              <button className="modal-close-btn" onClick={closeDeleteModal}>
                ×
              </button>
            </div>

            <div className="modal-content">
              <p className="danger-text">
                You are about to permanently delete purchase {selectedPurchase?.id}.
              </p>

              <p className="confirm-text" style={{ marginBottom: 14 }}>
                To confirm deletion, type exactly <strong>DELETE</strong> below.
              </p>

              <input
                className="modal-input"
                type="text"
                placeholder="Type DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />

              <div className="modal-actions">
                <button type="button" className="modal-secondary-btn" onClick={closeDeleteModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="modal-danger-btn"
                  onClick={handleDeletePurchase}
                  disabled={!deleteEnabled}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && <div className="toast-message">{toast.message}</div>}
    </>
  );
}