import "./Invoices.css";
import { useEffect, useMemo, useState } from "react";
import {
  getCustomers,
  getInvoices,
  getProducts,
  saveInvoices,
} from "../data/storage";
import type { Customer, Invoice, InvoiceItem, Product } from "../data/types";

type InvoiceLineForm = {
  productId: string;
  quantity: string;
  unitPrice: string;
};

type InvoiceForm = {
  customerId: string;
  date: string;
  notes: string;
  items: InvoiceLineForm[];
};

type FormErrors = {
  customerId?: string;
  date?: string;
  items?: string;
};

type PendingCloseTarget = "add" | "edit" | null;

type SortKey =
  | "id"
  | "customer"
  | "date"
  | "items"
  | "total"
  | "stillToPay"
  | "status";

type SortMode = "default" | "desc" | "asc";

const TODAY_DATE = new Date().toISOString().split("T")[0];
const MIN_INVOICE_DATE = "2020-01-01";

const EMPTY_LINE: InvoiceLineForm = {
  productId: "",
  quantity: "",
  unitPrice: "",
};

const EMPTY_FORM: InvoiceForm = {
  customerId: "",
  date: TODAY_DATE,
  notes: "",
  items: [{ ...EMPTY_LINE }],
};

const DELETE_CONFIRMATION_CODE = "123";
const NOTE_PREVIEW_LIMIT = 220;

function buildInvoiceId(index: number) {
  return `INV-${1000 + index + 1}`;
}

function buildInvoiceItemId(invoiceId: string, index: number) {
  return `INVITEM-${invoiceId}-${index + 1}`;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundMoney(value));
}

function normalizeDateInput(value: string): string {
  const raw = String(value || "").trim();

  if (!raw) return TODAY_DATE;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, mm, dd, yyyy] = slashMatch;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  return TODAY_DATE;
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function validateInvoiceDate(value: string): string | undefined {
  const normalized = normalizeDateInput(value);

  if (!normalized.trim()) {
    return "Invoice date is required.";
  }

  if (!isValidDateString(normalized)) {
    return "Please enter a valid date.";
  }

  if (normalized > TODAY_DATE) {
    return "Future dates are not allowed.";
  }

  if (normalized < MIN_INVOICE_DATE) {
    return `Date must be on or after ${MIN_INVOICE_DATE}.`;
  }

  return undefined;
}

function normalizeInvoices(invoices: Invoice[]): Invoice[] {
  return invoices.map((invoice, index) => ({
    ...invoice,
    id: invoice.id || buildInvoiceId(index),
    customerId: invoice.customerId || "",
    date: normalizeDateInput(invoice.date || TODAY_DATE),
    notes: invoice.notes || "",
    total: roundMoney(Number(invoice.total || 0)),
    items: Array.isArray(invoice.items)
      ? invoice.items.map((item, itemIndex) => ({
          ...item,
          id:
            item.id ||
            buildInvoiceItemId(invoice.id || buildInvoiceId(index), itemIndex),
          productId: item.productId || "",
          quantity: Number(item.quantity || 0),
          unitPrice: roundMoney(Number(item.unitPrice || 0)),
          total: roundMoney(Number(item.total || 0)),
        }))
      : [],
  }));
}

function toForm(invoice: Invoice): InvoiceForm {
  return {
    customerId: invoice.customerId || "",
    date: normalizeDateInput(invoice.date || TODAY_DATE),
    notes: invoice.notes || "",
    items:
      (invoice.items?.length ?? 0) > 0
        ? (invoice.items ?? []).map((item) => ({
            productId: item.productId || "",
            quantity: String(item.quantity || ""),
            unitPrice: String(item.unitPrice || ""),
          }))
        : [{ ...EMPTY_LINE }],
  };
}

function lineTotal(line: InvoiceLineForm) {
  const quantity = Number(line.quantity || 0);
  const unitPrice = Number(line.unitPrice || 0);
  return roundMoney(quantity * unitPrice);
}

function invoiceTotal(lines: InvoiceLineForm[]) {
  return roundMoney(lines.reduce((sum, line) => sum + lineTotal(line), 0));
}

function buildInvoiceItems(
  invoiceId: string,
  lines: InvoiceLineForm[]
): InvoiceItem[] {
  return lines
    .filter(
      (item) =>
        item.productId.trim() &&
        Number(item.quantity || 0) > 0 &&
        Number(item.unitPrice || 0) >= 0
    )
    .map((item, index) => {
      const quantity = Number(item.quantity);
      const unitPrice = roundMoney(Number(item.unitPrice));
      return {
        id: buildInvoiceItemId(invoiceId, index),
        invoiceId,
        productId: item.productId,
        quantity,
        unitPrice,
        total: roundMoney(quantity * unitPrice),
      };
    });
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
        className="modal-card confirm-close-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
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
            <h3>Unsaved changes detected</h3>
            <p>
              You have entered data that has not been saved yet. If you close
              now, your changes will be lost.
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

export default function Invoices() {
  const [customers] = useState<Customer[]>(() => getCustomers());
  const [products] = useState<Product[]>(() => getProducts());
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    normalizeInvoices(getInvoices())
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<InvoiceForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editForm, setEditForm] = useState<InvoiceForm>(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState<FormErrors>({});
  const [initialEditSnapshot, setInitialEditSnapshot] = useState<string>("");

  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);

  const [pendingCloseTarget, setPendingCloseTarget] =
    useState<PendingCloseTarget>(null);

  useEffect(() => {
    saveInvoices(invoices);
  }, [invoices]);

  const handleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortMode("desc");
      return;
    }

    if (sortMode === "desc") {
      setSortMode("asc");
      return;
    }

    setSortKey(null);
    setSortMode("default");
  };

  const getSortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    if (sortMode === "desc") return "↓";
    if (sortMode === "asc") return "↑";
    return "";
  };

  const filteredInvoices = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();

    const filtered = invoices.filter((invoice) => {
      if (!value) return true;

      const customerName =
        customers.find((customer) => customer.id === invoice.customerId)?.name ||
        "Unknown Customer";

      const productNames = (invoice.items ?? [])
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return `${product?.name || "Unknown Product"} x ${item.quantity}`;
        })
        .join(" ");

      return [
        invoice.id,
        customerName,
        invoice.date,
        invoice.notes || "",
        invoice.total,
        productNames,
        "Debit",
      ]
        .join(" ")
        .toLowerCase()
        .includes(value);
    });

    if (!sortKey || sortMode === "default") {
      return filtered;
    }

    const sorted = [...filtered].sort((a, b) => {
      const customerA =
        customers.find((customer) => customer.id === a.customerId)?.name ||
        "Unknown Customer";

      const customerB =
        customers.find((customer) => customer.id === b.customerId)?.name ||
        "Unknown Customer";

      const itemsA = (a.items ?? []).length;
      const itemsB = (b.items ?? []).length;

      const statusA = "Debit";
      const statusB = "Debit";

      let aValue: string | number = "";
      let bValue: string | number = "";

      switch (sortKey) {
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        case "customer":
          aValue = customerA;
          bValue = customerB;
          break;
        case "date":
          aValue = a.date;
          bValue = b.date;
          break;
        case "items":
          aValue = itemsA;
          bValue = itemsB;
          break;
        case "total":
          aValue = Number(a.total || 0);
          bValue = Number(b.total || 0);
          break;
        case "stillToPay":
          aValue = Number(a.total || 0);
          bValue = Number(b.total || 0);
          break;
        case "status":
          aValue = statusA;
          bValue = statusB;
          break;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortMode === "desc" ? bValue - aValue : aValue - bValue;
      }

      return sortMode === "desc"
        ? String(bValue).localeCompare(String(aValue))
        : String(aValue).localeCompare(String(bValue));
    });

    return sorted;
  }, [invoices, customers, products, searchTerm, sortKey, sortMode]);

  const hasAddUnsavedChanges = useMemo(() => {
    return (
      form.customerId.trim() !== "" ||
      form.date !== EMPTY_FORM.date ||
      form.notes.trim() !== "" ||
      form.items.some(
        (item) =>
          item.productId.trim() !== "" ||
          item.quantity.trim() !== "" ||
          item.unitPrice.trim() !== ""
      )
    );
  }, [form]);

  const hasEditUnsavedChanges = useMemo(() => {
    if (!editingInvoice) return false;
    return JSON.stringify(editForm) !== initialEditSnapshot;
  }, [editForm, editingInvoice, initialEditSnapshot]);

  const validateForm = (values: InvoiceForm): FormErrors => {
    const errors: FormErrors = {};

    if (!values.customerId.trim()) {
      errors.customerId = "Customer is required.";
    }

    const dateError = validateInvoiceDate(values.date);
    if (dateError) {
      errors.date = dateError;
    }

    const validItems = values.items.filter(
      (item) =>
        item.productId.trim() !== "" ||
        item.quantity.trim() !== "" ||
        item.unitPrice.trim() !== ""
    );

    if (validItems.length === 0) {
      errors.items = "At least one invoice item is required.";
      return errors;
    }

    const hasInvalidItem = validItems.some((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);

      return (
        !item.productId.trim() ||
        Number.isNaN(quantity) ||
        quantity <= 0 ||
        Number.isNaN(unitPrice) ||
        unitPrice < 0
      );
    });

    if (hasInvalidItem) {
      errors.items =
        "Each line must have a product, quantity greater than 0, and valid price.";
    }

    return errors;
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const closeEditModal = () => {
    setEditingInvoice(null);
    setEditForm(EMPTY_FORM);
    setEditErrors({});
    setInitialEditSnapshot("");
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

  const openEditModal = (invoice: Invoice) => {
    const mapped = toForm(invoice);
    setEditingInvoice(invoice);
    setEditForm(mapped);
    setEditErrors({});
    setInitialEditSnapshot(JSON.stringify(mapped));
  };

  const handleFormLineChange = (
    mode: "add" | "edit",
    index: number,
    field: keyof InvoiceLineForm,
    value: string
  ) => {
    const setState = mode === "add" ? setForm : setEditForm;
    const setErrors = mode === "add" ? setFormErrors : setEditErrors;

    setState((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;

        const nextItem = { ...item, [field]: value };

        if (field === "productId") {
          const product = products.find((p) => p.id === value);
          if (product && !item.unitPrice.trim()) {
            nextItem.unitPrice = String(product.price ?? 0);
          }
        }

        return nextItem;
      }),
    }));

    setErrors((prev) => ({ ...prev, items: undefined }));
  };

  const addInvoiceLine = (mode: "add" | "edit") => {
    const setState = mode === "add" ? setForm : setEditForm;
    setState((prev) => ({
      ...prev,
      items: [...prev.items, { ...EMPTY_LINE }],
    }));
  };

  const removeInvoiceLine = (mode: "add" | "edit", index: number) => {
    const setState = mode === "add" ? setForm : setEditForm;
    setState((prev) => ({
      ...prev,
      items:
        prev.items.length === 1
          ? [{ ...EMPTY_LINE }]
          : prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleAddInvoice = () => {
    const errors = validateForm(form);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    const invoiceId = buildInvoiceId(invoices.length);
    const items = buildInvoiceItems(invoiceId, form.items);
    const normalizedDate = normalizeDateInput(form.date);

    const newInvoice: Invoice = {
      id: invoiceId,
      customerId: form.customerId,
      date: normalizedDate,
      notes: form.notes.trim(),
      items,
      total: roundMoney(
        items.reduce((sum, item) => sum + Number(item.total || 0), 0)
      ),
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    closeAddModal();
  };

  const handleSaveEdit = () => {
    if (!editingInvoice) return;

    const errors = validateForm(editForm);
    setEditErrors(errors);

    if (Object.keys(errors).length > 0) return;

    const items = buildInvoiceItems(editingInvoice.id, editForm.items);
    const normalizedDate = normalizeDateInput(editForm.date);

    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === editingInvoice.id
          ? {
              ...invoice,
              customerId: editForm.customerId,
              date: normalizedDate,
              notes: editForm.notes.trim(),
              items,
              total: roundMoney(
                items.reduce((sum, item) => sum + Number(item.total || 0), 0)
              ),
            }
          : invoice
      )
    );

    closeEditModal();
  };

  const openDeleteModal = (invoice: Invoice) => {
    setDeleteInvoice(invoice);
    setDeleteCode("");
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    setDeleteInvoice(null);
    setDeleteCode("");
    setDeleteError("");
  };

  const confirmDeleteInvoice = () => {
    if (deleteCode.trim() !== DELETE_CONFIRMATION_CODE) {
      setDeleteError("Incorrect confirmation code. Please type 123.");
      return;
    }

    setInvoices((prev) =>
      prev.filter((invoice) => invoice.id !== deleteInvoice?.id)
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

  const renderInvoiceModal = (
    mode: "add" | "edit",
    currentForm: InvoiceForm,
    setCurrentForm: React.Dispatch<React.SetStateAction<InvoiceForm>>,
    currentErrors: FormErrors,
    onSave: () => void,
    onClose: () => void,
    title: string,
    subtitle: string
  ) => {
    const total = invoiceTotal(currentForm.items);

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-card invoice-modal-card invoice-modal-card-compact"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div>
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>

            <button type="button" className="modal-close-btn" onClick={onClose}>
              ×
            </button>
          </div>

          <form className="modal-form invoice-modal-form invoice-modal-form-compact">
            <div className="invoice-top-grid invoice-top-grid-compact">
              <div>
                <label className="modal-label">Customer</label>
                <select
                  className="modal-select"
                  value={currentForm.customerId}
                  onChange={(e) => {
                    setCurrentForm((prev) => ({
                      ...prev,
                      customerId: e.target.value,
                    }));
                  }}
                >
                  <option value="">Search customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                {currentErrors.customerId && (
                  <p className="field-error">{currentErrors.customerId}</p>
                )}
              </div>

              <div>
                <label className="modal-label">Invoice Date</label>
                <input
                  className="modal-input"
                  type="date"
                  value={normalizeDateInput(currentForm.date)}
                  min={MIN_INVOICE_DATE}
                  max={TODAY_DATE}
                  onChange={(e) =>
                    setCurrentForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />
                <p className="date-helper-text">
                  Allowed range: {MIN_INVOICE_DATE} to {TODAY_DATE}
                </p>
                {currentErrors.date && (
                  <p className="field-error">{currentErrors.date}</p>
                )}
              </div>
            </div>

            <div className="invoice-notes-group invoice-notes-group-compact">
              <label className="modal-label">Notes</label>
              <textarea
                className="modal-textarea invoice-notes-textarea invoice-notes-textarea-compact"
                placeholder="Add invoice notes..."
                rows={3}
                value={currentForm.notes}
                onChange={(e) =>
                  setCurrentForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </div>

            <div className="invoice-items-section invoice-items-section-compact">
              <div className="invoice-items-header invoice-items-header-compact">
                <div>
                  <h3>Invoice Items</h3>
                  <p>Add products, quantities, and prices for this invoice.</p>
                </div>

                <button
                  type="button"
                  className="add-line-btn"
                  onClick={() => addInvoiceLine(mode)}
                >
                  + Add Product Line
                </button>
              </div>

              {currentErrors.items && (
                <p className="field-error invoice-items-error">
                  {currentErrors.items}
                </p>
              )}

              <div className="invoice-lines-wrapper invoice-lines-wrapper-compact">
                {currentForm.items.map((item, index) => (
                  <div key={index} className="invoice-line-card invoice-line-card-compact">
                    <div className="invoice-line-grid invoice-line-grid-compact">
                      <div className="invoice-col invoice-col-product">
                        <label className="modal-label">Product</label>
                        <select
                          className="modal-select"
                          value={item.productId}
                          onChange={(e) =>
                            handleFormLineChange(
                              mode,
                              index,
                              "productId",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="invoice-col invoice-col-qty">
                        <label className="modal-label">Quantity</label>
                        <input
                          className="modal-input"
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            handleFormLineChange(
                              mode,
                              index,
                              "quantity",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="invoice-col invoice-col-price">
                        <label className="modal-label">Unit Price</label>
                        <input
                          className="modal-input"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleFormLineChange(
                              mode,
                              index,
                              "unitPrice",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="invoice-col invoice-col-total">
                        <label className="modal-label">Total</label>
                        <div className="invoice-line-total invoice-line-total-compact">
                          {formatMoney(lineTotal(item))}
                        </div>
                      </div>

                      <div className="invoice-col invoice-col-remove">
                        <label className="modal-label modal-label-hidden">Action</label>
                        <button
                          type="button"
                          className="remove-line-btn remove-line-btn-compact"
                          onClick={() => removeInvoiceLine(mode, index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="invoice-total-bar invoice-total-bar-compact">
                <span>Current Invoice Total</span>
                <strong>{formatMoney(total)}</strong>
              </div>
            </div>

            <div className="modal-actions invoice-modal-actions">
              <button
                type="button"
                className="modal-secondary-btn"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="button"
                className="modal-primary-btn"
                onClick={onSave}
              >
                {mode === "add" ? "Save Invoice" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="invoices-page">
        <div className="invoices-header">
          <div>
            <p className="dashboard-badge">Invoice Management</p>
            <h1 className="dashboard-title">Invoices</h1>
            <p className="dashboard-subtitle">
              Create invoices with real products, auto-calculate totals, and track payment status automatically.
            </p>
          </div>

          <button
            type="button"
            className="quick-action-btn"
            onClick={() => setShowAddModal(true)}
          >
            + Add Invoice
          </button>
        </div>

        <div className="dashboard-card">
          <div className="invoices-toolbar">
            <div className="dashboard-search-box">
              <label className="dashboard-search-label">Search invoices</label>
              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Search by customer, invoice id, status, product, note..."
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
                  <th className="sortable" onClick={() => handleSort("id")}>
                    <span className="sort-label">ID {getSortIndicator("id")}</span>
                  </th>
                  <th className="sortable" onClick={() => handleSort("customer")}>
                    <span className="sort-label">
                      Customer {getSortIndicator("customer")}
                    </span>
                  </th>
                  <th className="sortable" onClick={() => handleSort("date")}>
                    <span className="sort-label">Date {getSortIndicator("date")}</span>
                  </th>
                  <th className="sortable" onClick={() => handleSort("items")}>
                    <span className="sort-label">Items {getSortIndicator("items")}</span>
                  </th>
                  <th className="sortable" onClick={() => handleSort("total")}>
                    <span className="sort-label">Total {getSortIndicator("total")}</span>
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("stillToPay")}
                  >
                    <span className="sort-label">
                      Still to Pay {getSortIndicator("stillToPay")}
                    </span>
                  </th>
                  <th className="sortable" onClick={() => handleSort("status")}>
                    <span className="sort-label">
                      Status {getSortIndicator("status")}
                    </span>
                  </th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => {
                    const customerName =
                      customers.find(
                        (customer) => customer.id === invoice.customerId
                      )?.name || "Unknown Customer";

                    const itemsLabel =
                      (invoice.items?.length ?? 0) > 0
                        ? (invoice.items ?? [])
                            .map((item) => {
                              const productName =
                                products.find((p) => p.id === item.productId)
                                  ?.name || "Unknown Product";
                              return `${productName} × ${item.quantity}`;
                            })
                            .join(", ")
                        : "—";

                    return (
                      <tr key={invoice.id}>
                        <td>{invoice.id}</td>
                        <td>{customerName}</td>
                        <td>{normalizeDateInput(invoice.date)}</td>
                        <td>
                          {(invoice.items?.length ?? 0) > 0 ? (
                            <span className="item-badge">{itemsLabel}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{formatMoney(Number(invoice.total || 0))}</td>
                        <td className="still-pay">
                          {formatMoney(Number(invoice.total || 0))}
                        </td>
                        <td>
                          <span className="status-badge debit">Debit</span>
                        </td>
                        <td>
                          {invoice.notes?.trim() ? (
                            <button
                              type="button"
                              className="table-btn edit"
                              onClick={() => openNoteModal(invoice.notes)}
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
                              onClick={() => openEditModal(invoice)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="table-btn delete"
                              onClick={() => openDeleteModal(invoice)}
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

      {showAddModal &&
        renderInvoiceModal(
          "add",
          form,
          setForm,
          formErrors,
          handleAddInvoice,
          attemptCloseAddModal,
          "Add Invoice",
          "Create an invoice using real product lines."
        )}

      {editingInvoice &&
        renderInvoiceModal(
          "edit",
          editForm,
          setEditForm,
          editErrors,
          handleSaveEdit,
          attemptCloseEditModal,
          "Edit Invoice",
          "Update the selected invoice."
        )}

      {deleteInvoice && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Delete Invoice</h2>
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

            <div className="modal-form">
              <p className="delete-warning">
                You are about to permanently delete invoice {deleteInvoice.id}
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
                  onClick={confirmDeleteInvoice}
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
            <div className="modal-header">
              <div>
                <h2>Invoice Note</h2>
                <p>Invoice note details.</p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={closeNoteModal}
              >
                ×
              </button>
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