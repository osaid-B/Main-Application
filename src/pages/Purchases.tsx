import { useEffect, useMemo, useRef, useState } from "react";
import {
  getProducts,
  getPurchases,
  getSuppliers,
  savePurchases,
  saveSuppliers,
} from "../data/storage";
import type { Product, Purchase, Supplier } from "../data/types";

type PurchaseForm = {
  supplierId: string;
  productId: string;
  quantity: string;
  totalCost: string;
  date: string;
  notes: string;
};

type FormErrors = {
  supplierId?: string;
  productId?: string;
  quantity?: string;
  totalCost?: string;
  date?: string;
};

type PendingCloseTarget = "add" | "edit" | null;
type SortKey =
  | "id"
  | "supplier"
  | "product"
  | "quantity"
  | "totalCost"
  | "date";
type SortDirection = "asc" | "desc";

const EMPTY_FORM: PurchaseForm = {
  supplierId: "",
  productId: "",
  quantity: "",
  totalCost: "",
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

const DELETE_CONFIRMATION_CODE = "123";
const NOTE_PREVIEW_LIMIT = 220;
const BUSINESS_MIN_DATE = "2020-01-01";
const TODAY_DATE = new Date().toISOString().split("T")[0];

function buildPurchaseId(index: number) {
  return `PUR-${1000 + index + 1}`;
}

function buildSupplierId(index: number) {
  return `SUP-${1000 + index + 1}`;
}

function normalizePurchases(purchases: Purchase[]): Purchase[] {
  return purchases.map((purchase, index) => ({
    ...purchase,
    id: purchase.id || buildPurchaseId(index),
    supplierId: purchase.supplierId || "",
    productId: purchase.productId || "",
    quantity: Number(purchase.quantity || 0),
    totalCost: Number(purchase.totalCost || 0),
    date: purchase.date || new Date().toISOString().split("T")[0],
    notes: purchase.notes || "",
  }));
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidCalendarDate(value: string) {
  if (!isIsoDate(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function normalizeDate(value: string, fallback = TODAY_DATE) {
  const trimmed = (value || "").trim();
  if (!isValidCalendarDate(trimmed)) return fallback;
  return trimmed;
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function validatePurchaseDate(value: string): string | undefined {
  const raw = (value || "").trim();

  if (!raw) return "Purchase date is required.";
  if (!isIsoDate(raw)) return "Date format must be YYYY-MM-DD.";
  if (!isValidCalendarDate(raw)) return "Please enter a valid calendar date.";
  if (raw < BUSINESS_MIN_DATE) {
    return `Date cannot be earlier than ${BUSINESS_MIN_DATE}.`;
  }
  if (raw > TODAY_DATE) return "Future dates are not allowed.";

  return undefined;
}

function formatDisplayDate(value: string) {
  if (!isValidCalendarDate(value)) return "Invalid date";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB").format(
    new Date(year, month - 1, day)
  );
}

function SearchableSelect({
  value,
  options,
  placeholder,
  searchPlaceholder,
  onChange,
  allowCreate = false,
  onCreate,
  createLabel,
  error,
  allowDelete = false,
  onDelete,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  searchPlaceholder: string;
  onChange: (value: string) => void;
  allowCreate?: boolean;
  onCreate?: (name: string) => void;
  createLabel?: string;
  error?: string;
  allowDelete?: boolean;
  onDelete?: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(term)
    );
  }, [options, search]);

  const selectedLabel =
    options.find((option) => option.value === value)?.label || "";

  const canCreate =
    allowCreate &&
    !!onCreate &&
    !!search.trim() &&
    !options.some(
      (option) => option.label.toLowerCase() === search.trim().toLowerCase()
    );

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="modal-select searchable-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span style={{ color: value ? "#0f172a" : "#7b8794" }}>
          {selectedLabel || placeholder}
        </span>
        <span className={`searchable-caret ${open ? "open" : ""}`}>▼</span>
      </button>

      {open && (
        <div className="searchable-menu">
          <div className="searchable-menu-head">
            <input
              className="modal-input"
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              autoFocus
              onChange={(e) => setSearch(e.target.value)}
              style={{ margin: 0 }}
            />
          </div>

          <div className="searchable-menu-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`searchable-option-row ${
                    value === option.value ? "selected" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="searchable-option"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {option.label}
                  </button>

                  {allowDelete && onDelete && (
                    <button
                      type="button"
                      className="searchable-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(option.value);
                      }}
                      title={`Delete ${option.label}`}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="searchable-empty">No matching results found.</div>
            )}

            {canCreate && (
              <button
                type="button"
                className="searchable-create-btn"
                onClick={() => {
                  onCreate?.(search.trim());
                  setOpen(false);
                  setSearch("");
                }}
              >
                + {createLabel || `Add "${search.trim()}"`}
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function ConfirmCloseModal({
  open,
  onKeepEditing,
  onDiscard,
}: {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onKeepEditing}>
      <div
        className="modal-card confirm-close-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Unsaved Changes</h2>
            <p>Please confirm before closing this form.</p>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onKeepEditing}
          >
            ×
          </button>
        </div>

        <div className="confirm-close-box">
          <div className="confirm-close-icon">!</div>
          <div>
            <h3>You have unsaved edits</h3>
            <p>
              Your recent changes have not been saved yet. If you close now,
              these edits will be lost.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="modal-secondary-btn"
            onClick={onKeepEditing}
          >
            Continue Editing
          </button>
          <button
            type="button"
            className="modal-danger-btn"
            onClick={onDiscard}
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Purchases() {
  const [products] = useState<Product[]>(() => getProducts());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getSuppliers());
  const [purchases, setPurchases] = useState<Purchase[]>(() =>
    normalizePurchases(getPurchases())
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
  const [showEditModal, setShowEditModal] = useState(false);

  const [form, setForm] = useState<PurchaseForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editForm, setEditForm] = useState<PurchaseForm>(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState<FormErrors>({});

  const [deletePurchase, setDeletePurchase] = useState<Purchase | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [pendingCloseTarget, setPendingCloseTarget] =
    useState<PendingCloseTarget>(null);

  useEffect(() => {
    savePurchases(purchases);
  }, [purchases]);

  useEffect(() => {
    saveSuppliers?.(suppliers);
  }, [suppliers]);

  const supplierOptions = useMemo(() => {
    return suppliers
      .filter((supplier) => !supplier.isDeleted)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((supplier) => ({
        value: supplier.id,
        label: supplier.name,
      }));
  }, [suppliers]);

  const productOptions = useMemo(() => {
    return [...products]
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      .map((product) => ({
        value: product.id,
        label: product.name || "Unnamed Product",
      }));
  }, [products]);

  const supplierMap = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier.name])),
    [suppliers]
  );

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product.name || ""])),
    [products]
  );

  const createSupplier = (name: string) => {
    const normalized = normalizeName(name);
    if (!normalized) return;

    const existing = suppliers.find(
      (supplier) =>
        normalizeName(supplier.name).toLowerCase() === normalized.toLowerCase()
    );

    if (existing) {
      if (showEditModal) {
        handleEditFormChange("supplierId", existing.id);
      } else {
        handleAddFormChange("supplierId", existing.id);
      }
      return;
    }

    const newSupplier: Supplier = {
      id: buildSupplierId(suppliers.length),
      name: normalized,
      isDeleted: false,
    } as Supplier;

    setSuppliers((prev) => [newSupplier, ...prev]);

    if (showEditModal) {
      handleEditFormChange("supplierId", newSupplier.id);
    } else {
      handleAddFormChange("supplierId", newSupplier.id);
    }
  };

  const deleteSupplier = (supplierId: string) => {
    const supplierName = supplierMap.get(supplierId) || "";
    const isUsedInPurchases = purchases.some(
      (purchase) => purchase.supplierId === supplierId
    );

    if (isUsedInPurchases) {
      alert(
        `Cannot delete "${supplierName}" because it is linked to existing purchases.`
      );
      return;
    }

    setSuppliers((prev) =>
      prev.filter((supplier) => supplier.id !== supplierId)
    );

    if (form.supplierId === supplierId) {
      setForm((prev) => ({ ...prev, supplierId: "" }));
    }

    if (editForm.supplierId === supplierId) {
      setEditForm((prev) => ({ ...prev, supplierId: "" }));
    }
  };

  const filteredPurchases = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();

    const filtered = purchases.filter((purchase) => {
      if (!value) return true;

      const productName = productMap.get(purchase.productId) || "";
      const supplierName = supplierMap.get(purchase.supplierId) || "";

      return [
        purchase.id,
        supplierName,
        purchase.productId,
        productName,
        purchase.quantity,
        purchase.totalCost,
        purchase.date,
        purchase.notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(value);
    });

    return [...filtered].sort((a, b) => {
      const getValue = (purchase: Purchase) => {
        switch (sortConfig.key) {
          case "id":
            return purchase.id || "";
          case "supplier":
            return supplierMap.get(purchase.supplierId) || "";
          case "product":
            return productMap.get(purchase.productId) || "";
          case "quantity":
            return Number(purchase.quantity || 0);
          case "totalCost":
            return Number(purchase.totalCost || 0);
          case "date":
            return purchase.date || "";
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
  }, [purchases, productMap, searchTerm, sortConfig, supplierMap]);

  const hasAddUnsavedChanges = useMemo(() => {
    return (
      form.supplierId.trim() !== "" ||
      form.productId.trim() !== "" ||
      form.quantity.trim() !== "" ||
      form.totalCost.trim() !== "" ||
      form.notes.trim() !== "" ||
      form.date !== EMPTY_FORM.date
    );
  }, [form]);

  const hasEditUnsavedChanges = useMemo(() => {
    if (!editingPurchase) return false;

    return (
      editForm.supplierId.trim() !== (editingPurchase.supplierId || "") ||
      editForm.productId.trim() !== (editingPurchase.productId || "") ||
      editForm.quantity.trim() !== String(editingPurchase.quantity || "") ||
      editForm.totalCost.trim() !== String(editingPurchase.totalCost || "") ||
      editForm.notes.trim() !== (editingPurchase.notes || "") ||
      editForm.date !== (editingPurchase.date || "")
    );
  }, [editForm, editingPurchase]);

  const calculateAutoTotal = (productId: string, quantity: string) => {
    const selectedProduct = products.find((product) => product.id === productId);
    const unitPrice = Number(selectedProduct?.price || 0);
    const qty = Number(quantity || 0);

    if (!selectedProduct || Number.isNaN(qty) || qty <= 0) return "";
    return String(unitPrice * qty);
  };

  const validateForm = (values: PurchaseForm): FormErrors => {
    const errors: FormErrors = {};

    if (!values.supplierId.trim()) {
      errors.supplierId = "Supplier is required.";
    }

    if (!values.productId.trim()) {
      errors.productId = "Product is required.";
    }

    if (!values.quantity.trim()) {
      errors.quantity = "Quantity is required.";
    } else if (Number.isNaN(Number(values.quantity))) {
      errors.quantity = "Quantity must be a valid number.";
    } else if (Number(values.quantity) <= 0) {
      errors.quantity = "Quantity must be greater than 0.";
    }

    if (!values.totalCost.trim()) {
      errors.totalCost = "Total cost is required.";
    }

    const dateError = validatePurchaseDate(values.date);
    if (dateError) errors.date = dateError;

    return errors;
  };

  const handleAddFormChange = (field: keyof PurchaseForm, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "productId" || field === "quantity") {
        next.totalCost = calculateAutoTotal(
          field === "productId" ? value : prev.productId,
          field === "quantity" ? value : prev.quantity
        );
      }

      return next;
    });

    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleEditFormChange = (field: keyof PurchaseForm, value: string) => {
    setEditForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "productId" || field === "quantity") {
        next.totalCost = calculateAutoTotal(
          field === "productId" ? value : prev.productId,
          field === "quantity" ? value : prev.quantity
        );
      }

      return next;
    });

    setEditErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingPurchase(null);
    setEditForm(EMPTY_FORM);
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
    if (pendingCloseTarget === "add") closeAddModal();
    if (pendingCloseTarget === "edit") closeEditModal();
    setPendingCloseTarget(null);
  };

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

  const handleAddPurchase = () => {
    const errors = validateForm(form);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    const newPurchase: Purchase = {
      id: buildPurchaseId(purchases.length),
      supplierId: form.supplierId,
      productId: form.productId,
      quantity: Number(form.quantity),
      totalCost: Number(form.totalCost),
      status: "Pending",
      date: normalizeDate(form.date),
      notes: form.notes.trim(),
    };

    setPurchases((prev) => [newPurchase, ...prev]);
    closeAddModal();
  };

  const openEditModal = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setEditForm({
      supplierId: purchase.supplierId || "",
      productId: purchase.productId || "",
      quantity: String(purchase.quantity || ""),
      totalCost: String(purchase.totalCost || ""),
      date: normalizeDate(purchase.date || TODAY_DATE),
      notes: purchase.notes || "",
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingPurchase) return;

    const errors = validateForm(editForm);
    setEditErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setPurchases((prev) =>
      prev.map((purchase) =>
        purchase.id === editingPurchase.id
          ? {
              ...purchase,
              supplierId: editForm.supplierId,
              productId: editForm.productId,
              quantity: Number(editForm.quantity),
              totalCost: Number(editForm.totalCost),
              status: purchase.status || "Pending",
              date: normalizeDate(editForm.date),
              notes: editForm.notes.trim(),
            }
          : purchase
      )
    );

    closeEditModal();
  };

  const openDeleteModal = (purchase: Purchase) => {
    setDeletePurchase(purchase);
    setDeleteCode("");
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    setDeletePurchase(null);
    setDeleteCode("");
    setDeleteError("");
  };

  const handleConfirmDelete = () => {
    if (deleteCode.trim() !== DELETE_CONFIRMATION_CODE) {
      setDeleteError("Incorrect confirmation code. Please type 123.");
      return;
    }

    setPurchases((prev) =>
      prev.filter((purchase) => purchase.id !== deletePurchase?.id)
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
          width: 100%;
          display: block;
        }

        .purchases-toolbar .dashboard-search-box {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .purchases-toolbar .dashboard-search-input {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .table-wrapper {
          overflow-x: auto;
          border-radius: 18px;
        }

        .dashboard-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1040px;
        }

        .dashboard-table th,
        .dashboard-table td {
          padding: 16px 18px;
          text-align: left;
          vertical-align: middle;
          border-bottom: 1px solid rgba(148, 163, 184, 0.14);
        }

        .dashboard-table th {
          font-size: 13px;
          font-weight: 800;
          color: #64748b;
          background: rgba(248, 250, 252, 0.96);
          white-space: nowrap;
          user-select: none;
        }

        .dashboard-table td {
          font-size: 14px;
          color: #0f172a;
        }

        .sortable-th {
          cursor: pointer;
          transition: color 0.2s ease, background 0.2s ease;
        }

        .sortable-th:hover {
          color: #1d4ed8;
          background: #f8fbff;
        }

        .sort-head {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .table-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .table-btn {
          border: none;
          border-radius: 12px;
          padding: 9px 14px;
          font-size: 13px;
          font-weight: 700;
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
          text-align: center;
          color: #94a3b8;
          padding: 36px 16px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.52);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 999;
          backdrop-filter: blur(2px);
        }

        .modal-card {
          width: 100%;
          max-width: 860px;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 28px 70px rgba(15, 23, 42, 0.18);
          overflow: hidden;
          animation: modalPop 0.18s ease;
        }

        .purchase-modal-card {
          max-height: calc(100vh - 36px);
          display: flex;
          flex-direction: column;
        }

        .purchase-modal-scroll {
          overflow-y: auto;
          padding: 0 24px 24px;
        }

        .purchase-modal-top {
          padding: 24px 24px 18px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.14);
          background: linear-gradient(180deg, rgba(248,251,255,0.95) 0%, #ffffff 100%);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
        }

        .modal-header p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.7;
        }

        .modal-close-btn {
          border: none;
          background: #f1f5f9;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
          color: #64748b;
          padding: 0;
          flex-shrink: 0;
        }

        .modal-form {
          padding: 22px 0 0;
        }

        .modal-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .modal-grid-full {
          grid-column: 1 / -1;
        }

        .field-card {
          background: #fbfdff;
          border: 1px solid #e2eaf3;
          border-radius: 18px;
          padding: 16px;
        }

        .modal-label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 800;
          color: #475569;
        }

        .modal-input,
        .modal-select,
        .modal-textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          padding: 13px 14px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
          background: white;
          box-sizing: border-box;
        }

        .modal-input:focus,
        .modal-select:focus,
        .modal-textarea:focus,
        .searchable-trigger:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
        }

        .modal-textarea {
          resize: vertical;
          min-height: 140px;
        }

        .field-error {
          display: block;
          margin-top: 6px;
          color: #dc2626;
          font-size: 12px;
          font-weight: 700;
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
          border-radius: 14px;
          padding: 12px 18px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-primary-btn {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
        }

        .modal-primary-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.22);
        }

        .modal-secondary-btn {
          background: #e2e8f0;
          color: #0f172a;
        }

        .modal-secondary-btn:hover:not(:disabled) {
          background: #cbd5e1;
        }

        .modal-danger-btn {
          background: #ef4444;
          color: white;
        }

        .modal-danger-btn:hover:not(:disabled) {
          background: #dc2626;
        }

        .delete-warning {
          margin: 0;
          color: #dc2626;
          font-size: 16px;
          font-weight: 800;
          line-height: 1.7;
        }

        .delete-help {
          margin-top: 12px;
          color: #475569;
          line-height: 1.8;
          font-size: 14px;
        }

        .no-number-spinner::-webkit-outer-spin-button,
        .no-number-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .no-number-spinner {
          -moz-appearance: textfield;
        }

        .searchable-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          text-align: left;
        }

        .searchable-caret {
          font-size: 13px;
          color: #64748b;
          transition: transform 0.2s ease;
          flex-shrink: 0;
          margin-left: 10px;
        }

        .searchable-caret.open {
          transform: rotate(180deg);
        }

        .searchable-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          z-index: 100;
          background: #fff;
          border: 1px solid #dbe7f3;
          border-radius: 18px;
          box-shadow: 0 22px 48px rgba(15, 23, 42, 0.14);
          overflow: hidden;
        }

        .searchable-menu-head {
          padding: 12px;
          background: #f8fbff;
          border-bottom: 1px solid #edf2f7;
        }

        .searchable-menu-list {
          max-height: 260px;
          overflow-y: auto;
          padding: 8px;
        }

        .searchable-option-row {
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 12px;
          margin-bottom: 4px;
        }

        .searchable-option-row.selected {
          background: #eff6ff;
        }

        .searchable-option,
        .searchable-create-btn {
          border: none;
          background: transparent;
          padding: 12px 14px;
          border-radius: 12px;
          cursor: pointer;
          color: #1e293b;
          font-size: 14px;
          font-weight: 600;
          text-align: left;
        }

        .searchable-option {
          flex: 1;
          margin-bottom: 0;
        }

        .searchable-option:hover,
        .searchable-create-btn:hover {
          background: #f8fbff;
        }

        .searchable-option-row.selected .searchable-option {
          color: #1d4ed8;
          font-weight: 800;
        }

        .searchable-delete-btn {
          border: none;
          background: #fee2e2;
          color: #b91c1c;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .searchable-delete-btn:hover {
          background: #fecaca;
        }

        .searchable-create-btn {
          width: 100%;
          background: #f0f9ff;
          color: #0369a1;
          font-weight: 800;
          margin-top: 4px;
        }

        .searchable-empty {
          padding: 14px;
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
        }

        .helper-chip {
          margin-top: 10px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          color: #1d4ed8;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
        }

        .note-modal-body {
          padding: 20px 22px 10px;
        }

        .note-content {
          margin: 0;
          font-size: 15px;
          line-height: 1.9;
          color: #334155;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .note-content.collapsed {
          display: block;
          max-height: 160px;
          overflow: hidden;
        }

        .note-content.expanded {
          display: block;
          max-height: 320px;
          overflow-y: auto;
          padding-right: 6px;
        }

        .read-more-btn {
          margin-top: 14px;
          border: none;
          background: transparent;
          color: #2563eb;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          padding: 0;
        }

        .read-more-btn:hover {
          text-decoration: underline;
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

          .purchase-modal-scroll {
            padding: 0 16px 16px;
          }

          .purchase-modal-top {
            padding: 18px 16px 14px;
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

          .modal-card {
            max-width: 100%;
          }
        }

        .confirm-close-modal {
          max-width: 540px;
        }

        .confirm-close-box {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 18px;
          padding: 18px;
          margin: 22px 24px 0;
        }

        .confirm-close-icon {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          background: #f97316;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .confirm-close-box h3 {
          margin: 0 0 6px;
          color: #9a3412;
          font-size: 16px;
          font-weight: 800;
        }

        .confirm-close-box p {
          margin: 0;
          color: #7c2d12;
          line-height: 1.8;
          font-size: 14px;
        }
      `}</style>

      <div className="purchases-page">
        <div className="purchases-header">
          <div>
            <p className="dashboard-badge">Purchase Management</p>
            <h1 className="dashboard-title">Purchases</h1>
            <p className="dashboard-subtitle">
              Manage supplier purchases, quantities, dates, and total cost records.
            </p>
          </div>

          <button
            type="button"
            className="quick-action-btn"
            onClick={() => setShowAddModal(true)}
          >
            + Add Purchase
          </button>
        </div>

        <div className="dashboard-card">
          <div className="purchases-toolbar">
            <div className="dashboard-search-box">
              <label className="dashboard-search-label">Search purchases</label>
              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Search by supplier, product, quantity, total cost, date, or notes..."
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
                  <th className="sortable-th" onClick={() => requestSort("id")}>
                    <span className="sort-head">
                      ID {getSortIndicator("id")}
                    </span>
                  </th>
                  <th
                    className="sortable-th"
                    onClick={() => requestSort("supplier")}
                  >
                    <span className="sort-head">
                      Supplier {getSortIndicator("supplier")}
                    </span>
                  </th>
                  <th
                    className="sortable-th"
                    onClick={() => requestSort("product")}
                  >
                    <span className="sort-head">
                      Product {getSortIndicator("product")}
                    </span>
                  </th>
                  <th
                    className="sortable-th"
                    onClick={() => requestSort("quantity")}
                  >
                    <span className="sort-head">
                      Quantity {getSortIndicator("quantity")}
                    </span>
                  </th>
                  <th
                    className="sortable-th"
                    onClick={() => requestSort("totalCost")}
                  >
                    <span className="sort-head">
                      Total Cost {getSortIndicator("totalCost")}
                    </span>
                  </th>
                  <th
                    className="sortable-th"
                    onClick={() => requestSort("date")}
                  >
                    <span className="sort-head">
                      Date {getSortIndicator("date")}
                    </span>
                  </th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPurchases.length > 0 ? (
                  filteredPurchases.map((purchase) => {
                    const productName =
                      productMap.get(purchase.productId) || "Unknown Product";

                    return (
                      <tr key={purchase.id}>
                        <td>{purchase.id}</td>
                        <td>
                          {supplierMap.get(purchase.supplierId) ||
                            "Unknown Supplier"}
                        </td>
                        <td>{productName}</td>
                        <td>{purchase.quantity}</td>
                        <td>${purchase.totalCost}</td>
                        <td>{formatDisplayDate(purchase.date)}</td>
                        <td>
                          {purchase.notes?.trim() ? (
                            <button
                              type="button"
                              className="table-btn edit"
                              onClick={() => openNoteModal(purchase.notes)}
                            >
                              Note
                            </button>
                          ) : (
                            "—"
                          )}
                        </td>
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="empty-state-cell">
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
        <div className="modal-overlay" onClick={attemptCloseAddModal}>
          <div
            className="modal-card purchase-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="purchase-modal-top">
              <div className="modal-header">
                <div>
                  <h2>Add Purchase</h2>
                  <p>Enter the new purchase information.</p>
                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={attemptCloseAddModal}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="purchase-modal-scroll">
              <form className="modal-form">
                <div className="modal-grid">
                  <div className="field-card">
                    <label className="modal-label">Supplier</label>
                    <SearchableSelect
                      value={form.supplierId}
                      options={supplierOptions}
                      placeholder="Search, add, or delete supplier..."
                      searchPlaceholder="Search supplier..."
                      allowCreate
                      allowDelete
                      onCreate={createSupplier}
                      onDelete={deleteSupplier}
                      onChange={(value) =>
                        handleAddFormChange("supplierId", value)
                      }
                      error={formErrors.supplierId}
                    />
                    {form.supplierId && (
                      <div className="helper-chip">
                        Selected: {supplierMap.get(form.supplierId)}
                      </div>
                    )}
                  </div>

                  <div className="field-card">
                    <label className="modal-label">Product</label>
                    <SearchableSelect
                      value={form.productId}
                      options={productOptions}
                      placeholder="Search product..."
                      searchPlaceholder="Search product..."
                      onChange={(value) =>
                        handleAddFormChange("productId", value)
                      }
                      error={formErrors.productId}
                    />
                    {form.productId && (
                      <div className="helper-chip">
                        Product: {productMap.get(form.productId)}
                      </div>
                    )}
                  </div>

                  <div className="field-card">
                    <label className="modal-label">Quantity</label>
                    <input
                      className="modal-input no-number-spinner"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Enter quantity"
                      value={form.quantity}
                      onChange={(e) =>
                        handleAddFormChange("quantity", e.target.value)
                      }
                    />
                    {formErrors.quantity && (
                      <p className="field-error">{formErrors.quantity}</p>
                    )}
                  </div>

                  <div className="field-card">
                    <label className="modal-label">Total Cost</label>
                    <input
                      className="modal-input no-number-spinner"
                      type="number"
                      value={form.totalCost}
                      readOnly
                      placeholder="Calculated automatically"
                    />
                    {formErrors.totalCost && (
                      <p className="field-error">{formErrors.totalCost}</p>
                    )}
                  </div>

                  <div className="modal-grid-full field-card">
                    <label className="modal-label">Date</label>
                    <input
                      className="modal-input"
                      type="date"
                      value={form.date}
                      min={BUSINESS_MIN_DATE}
                      max={TODAY_DATE}
                      onChange={(e) =>
                        handleAddFormChange("date", e.target.value)
                      }
                    />
                    <p className="dashboard-search-meta">
                      Allowed range: {BUSINESS_MIN_DATE} to {TODAY_DATE}
                    </p>
                    {formErrors.date && (
                      <p className="field-error">{formErrors.date}</p>
                    )}
                  </div>

                  <div className="modal-grid-full field-card">
                    <label className="modal-label">Notes</label>
                    <textarea
                      className="modal-textarea"
                      placeholder="Add purchase notes..."
                      rows={4}
                      value={form.notes}
                      onChange={(e) =>
                        handleAddFormChange("notes", e.target.value)
                      }
                    />
                  </div>
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
                    onClick={handleAddPurchase}
                  >
                    Save Purchase
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingPurchase && (
        <div className="modal-overlay" onClick={attemptCloseEditModal}>
          <div
            className="modal-card purchase-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="purchase-modal-top">
              <div className="modal-header">
                <div>
                  <h2>Edit Purchase</h2>
                  <p>Update purchase information.</p>
                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={attemptCloseEditModal}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="purchase-modal-scroll">
              <form className="modal-form">
                <div className="modal-grid">
                  <div className="field-card">
                    <label className="modal-label">Supplier</label>
                    <SearchableSelect
                      value={editForm.supplierId}
                      options={supplierOptions}
                      placeholder="Search, add, or delete supplier..."
                      searchPlaceholder="Search supplier..."
                      allowCreate
                      allowDelete
                      onCreate={createSupplier}
                      onDelete={deleteSupplier}
                      onChange={(value) =>
                        handleEditFormChange("supplierId", value)
                      }
                      error={editErrors.supplierId}
                    />
                    {editForm.supplierId && (
                      <div className="helper-chip">
                        Selected: {supplierMap.get(editForm.supplierId)}
                      </div>
                    )}
                  </div>

                  <div className="field-card">
                    <label className="modal-label">Product</label>
                    <SearchableSelect
                      value={editForm.productId}
                      options={productOptions}
                      placeholder="Search product..."
                      searchPlaceholder="Search product..."
                      onChange={(value) =>
                        handleEditFormChange("productId", value)
                      }
                      error={editErrors.productId}
                    />
                    {editForm.productId && (
                      <div className="helper-chip">
                        Product: {productMap.get(editForm.productId)}
                      </div>
                    )}
                  </div>

                  <div className="field-card">
                    <label className="modal-label">Quantity</label>
                    <input
                      className="modal-input no-number-spinner"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Enter quantity"
                      value={editForm.quantity}
                      onChange={(e) =>
                        handleEditFormChange("quantity", e.target.value)
                      }
                    />
                    {editErrors.quantity && (
                      <p className="field-error">{editErrors.quantity}</p>
                    )}
                  </div>

                  <div className="field-card">
                    <label className="modal-label">Total Cost</label>
                    <input
                      className="modal-input no-number-spinner"
                      type="number"
                      value={editForm.totalCost}
                      readOnly
                      placeholder="Calculated automatically"
                    />
                    {editErrors.totalCost && (
                      <p className="field-error">{editErrors.totalCost}</p>
                    )}
                  </div>

                  <div className="modal-grid-full field-card">
                    <label className="modal-label">Date</label>
                    <input
                      className="modal-input"
                      type="date"
                      value={editForm.date}
                      min={BUSINESS_MIN_DATE}
                      max={TODAY_DATE}
                      onChange={(e) =>
                        handleEditFormChange("date", e.target.value)
                      }
                    />
                    <p className="dashboard-search-meta">
                      Allowed range: {BUSINESS_MIN_DATE} to {TODAY_DATE}
                    </p>
                    {editErrors.date && (
                      <p className="field-error">{editErrors.date}</p>
                    )}
                  </div>

                  <div className="modal-grid-full field-card">
                    <label className="modal-label">Notes</label>
                    <textarea
                      className="modal-textarea"
                      placeholder="Add purchase notes..."
                      rows={4}
                      value={editForm.notes}
                      onChange={(e) =>
                        handleEditFormChange("notes", e.target.value)
                      }
                    />
                  </div>
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
                    onClick={handleSaveEdit}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deletePurchase && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="purchase-modal-top">
              <div className="modal-header">
                <div>
                  <h2>Delete Purchase</h2>
                  <p>This action cannot be undone.</p>
                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={closeDeleteModal}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="purchase-modal-scroll" style={{ paddingTop: "20px" }}>
              <p className="delete-warning">
                You are about to permanently delete this purchase.
              </p>
              <p className="delete-help">
                To confirm deletion, type exactly <strong>123</strong> below.
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
                {deleteError && <p className="field-error">{deleteError}</p>}
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
                  className="modal-danger-btn"
                  onClick={handleConfirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedNote !== null && (
        <div className="modal-overlay" onClick={closeNoteModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="purchase-modal-top">
              <div className="modal-header">
                <div>
                  <h2>Purchase Note</h2>
                  <p>Purchase note details.</p>
                </div>

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={closeNoteModal}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="note-modal-body">
              <p
                className={`note-content ${
                  isNoteExpanded ? "expanded" : "collapsed"
                }`}
              >
                {displayedNote}
              </p>

              {shouldShowReadMore && (
                <button
                  type="button"
                  className="read-more-btn"
                  onClick={() => setIsNoteExpanded((prev) => !prev)}
                >
                  {isNoteExpanded ? "Read Less" : "Read More"}
                </button>
              )}
            </div>

            <div className="purchase-modal-scroll" style={{ paddingTop: 0 }}>
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-primary-btn"
                  onClick={closeNoteModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmCloseModal
        open={pendingCloseTarget !== null}
        onKeepEditing={() => setPendingCloseTarget(null)}
        onDiscard={discardPendingChanges}
      />
    </>
  );
}