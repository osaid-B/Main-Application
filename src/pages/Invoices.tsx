import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCustomers,
  getInvoiceItems,
  getInvoices,
  getPayments,
  getProducts,
  saveInvoiceItems,
  saveInvoices,
} from "../data/storage";
import {
  buildInvoicesWithRelations,
  getProductById,
} from "../data/relations";
import type {
  Customer,
  Invoice,
  InvoiceItem,
  Payment,
  Product,
} from "../data/types";

type ExtendedInvoice = Invoice & {
  customerName: string;
  remainingAmount: number;
  status: "Paid" | "Partial" | "Debit";
};

type InvoiceItemFormRow = {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
};

type InvoiceForm = {
  customerId: string;
  date: string;
  notes: string;
  items: InvoiceItemFormRow[];
};

type InvoiceFormErrors = {
  customerId?: string;
  date?: string;
  items?: string;
  rowErrors?: Record<
    string,
    {
      productId?: string;
      quantity?: string;
      unitPrice?: string;
    }
  >;
};

const createEmptyItemRow = (): InvoiceItemFormRow => ({
  id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  productId: "",
  quantity: "",
  unitPrice: "",
});

const EMPTY_FORM: InvoiceForm = {
  customerId: "",
  date: new Date().toISOString().split("T")[0],
  notes: "",
  items: [createEmptyItemRow()],
};

function SearchableCustomerSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Customer[];
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selectedCustomer = options.find((customer) => customer.id === value);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;

    return options.filter((customer) =>
      [customer.name, customer.phone, customer.email ?? "", customer.id]
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
    <div className="customer-select" ref={wrapperRef}>
      <div className="customer-select-input-wrap">
        <input
          className="modal-input"
          type="text"
          placeholder="Search customer..."
          value={isOpen ? query : selectedCustomer?.name ?? ""}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
        />
        <span className="customer-select-arrow">▾</span>
      </div>

      {isOpen && (
        <div className="customer-select-menu">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className={`customer-option ${customer.id === value ? "active" : ""}`}
                onClick={() => {
                  onChange(customer.id);
                  setQuery("");
                  setIsOpen(false);
                }}
              >
                <strong>{customer.name}</strong>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                  {customer.phone} {customer.email ? `• ${customer.email}` : ""}
                </div>
              </button>
            ))
          ) : (
            <div className="customer-empty">No customers found.</div>
          )}
        </div>
      )}
    </div>
  );
}

function getFormItemsTotal(items: InvoiceItemFormRow[]) {
  return items.reduce((sum, item) => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitPrice || 0);
    return sum + quantity * unitPrice;
  }, 0);
}

function ProductLineEditor({
  row,
  products,
  onChange,
  onRemove,
  error,
  disableRemove,
}: {
  row: InvoiceItemFormRow;
  products: Product[];
  onChange: (
    rowId: string,
    field: keyof Omit<InvoiceItemFormRow, "id">,
    value: string
  ) => void;
  onRemove: (rowId: string) => void;
  error?: {
    productId?: string;
    quantity?: string;
    unitPrice?: string;
  };
  disableRemove?: boolean;
}) {
  const selectedProduct = products.find((product) => product.id === row.productId);

  return (
    <div className="invoice-item-row">
      <div>
        <label className="modal-label">Product</label>
        <select
          className="modal-input"
          value={row.productId}
          onChange={(e) => {
            const nextProductId = e.target.value;
            const product = products.find((p) => p.id === nextProductId);
            onChange(row.id, "productId", nextProductId);
            if (product) {
              onChange(row.id, "unitPrice", String(product.price));
            }
          }}
        >
          <option value="">Select product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} - ${product.price}
            </option>
          ))}
        </select>
        {error?.productId && <span className="field-error">{error.productId}</span>}
      </div>

      <div>
        <label className="modal-label">Quantity</label>
        <input
          className="modal-input"
          type="number"
          min="1"
          step="1"
          value={row.quantity}
          onChange={(e) => onChange(row.id, "quantity", e.target.value)}
          placeholder="Qty"
        />
        {selectedProduct ? (
          <p className="mini-help-text">Available base stock: {selectedProduct.stock}</p>
        ) : null}
        {error?.quantity && <span className="field-error">{error.quantity}</span>}
      </div>

      <div>
        <label className="modal-label">Unit Price</label>
        <input
          className="modal-input"
          type="number"
          min="0"
          step="0.01"
          value={row.unitPrice}
          onChange={(e) => onChange(row.id, "unitPrice", e.target.value)}
          placeholder="Price"
        />
        {error?.unitPrice && <span className="field-error">{error.unitPrice}</span>}
      </div>

      <div className="invoice-item-row-actions">
        <label className="modal-label">Line Total</label>
        <div className="invoice-line-total">
          ${(Number(row.quantity || 0) * Number(row.unitPrice || 0)).toFixed(2)}
        </div>
        <button
          type="button"
          className="invoice-remove-line-btn"
          onClick={() => onRemove(row.id)}
          disabled={disableRemove}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function Invoices() {
  const [customers] = useState<Customer[]>(() => getCustomers());
  const [payments] = useState<Payment[]>(() => getPayments());
  const [products] = useState<Product[]>(() => getProducts());

  const [invoices, setInvoices] = useState<ExtendedInvoice[]>(() =>
    buildInvoicesWithRelations(getInvoices(), getCustomers(), getPayments())
  );

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>(() =>
    getInvoiceItems()
  );

  const [searchTerm, setSearchTerm] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmEditModal, setShowConfirmEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<ExtendedInvoice | null>(null);

  const [form, setForm] = useState<InvoiceForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<InvoiceFormErrors>({});
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [toast, setToast] = useState({
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

  const filteredInvoices = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();
    if (!value) return invoices;

    return invoices.filter((invoice) => {
      const items = invoiceItems.filter((item) => item.invoiceId === invoice.id);
      const itemNames = items
        .map((item) => getProductById(products, item.productId)?.name ?? "")
        .join(" ");

      return [
        invoice.id,
        invoice.customerName,
        invoice.customerId,
        invoice.date,
        invoice.amount,
        invoice.remainingAmount,
        invoice.status,
        invoice.notes ?? "",
        itemNames,
      ]
        .join(" ")
        .toLowerCase()
        .includes(value);
    });
  }, [invoices, invoiceItems, products, searchTerm]);

  const currentFormTotal = useMemo(() => getFormItemsTotal(form.items), [form.items]);

  const getInvoiceItemDetails = (invoiceId: string) => {
    return invoiceItems
      .filter((item) => item.invoiceId === invoiceId)
      .map((item) => {
        const product = getProductById(products, item.productId);
        return {
          ...item,
          productName: product?.name ?? "Unknown Product",
        };
      });
  };

  const validateForm = (data: InvoiceForm) => {
    const nextErrors: InvoiceFormErrors = {
      rowErrors: {},
    };

    if (!data.customerId.trim()) {
      nextErrors.customerId = "Please select a customer.";
    }

    if (!data.date) {
      nextErrors.date = "Please select a valid invoice date.";
    }

    if (data.items.length === 0) {
      nextErrors.items = "At least one product is required.";
    }

    data.items.forEach((row) => {
      const rowError: {
        productId?: string;
        quantity?: string;
        unitPrice?: string;
      } = {};

      if (!row.productId.trim()) {
        rowError.productId = "Please select a product.";
      }

      if (row.quantity.trim() === "") {
        rowError.quantity = "Quantity is required.";
      } else if (Number.isNaN(Number(row.quantity))) {
        rowError.quantity = "Quantity must be a valid number.";
      } else if (Number(row.quantity) <= 0) {
        rowError.quantity = "Quantity must be greater than 0.";
      } else {
        const product = products.find((p) => p.id === row.productId);
        if (product && Number(row.quantity) > Number(product.stock || 0)) {
          rowError.quantity = `Quantity cannot exceed available base stock (${product.stock}).`;
        }
      }

      if (row.unitPrice.trim() === "") {
        rowError.unitPrice = "Unit price is required.";
      } else if (Number.isNaN(Number(row.unitPrice))) {
        rowError.unitPrice = "Unit price must be a valid number.";
      } else if (Number(row.unitPrice) < 0) {
        rowError.unitPrice = "Unit price cannot be negative.";
      }

      if (Object.keys(rowError).length > 0) {
        nextErrors.rowErrors![row.id] = rowError;
      }
    });

    if (Object.keys(nextErrors.rowErrors || {}).length === 0) {
      delete nextErrors.rowErrors;
    }

    return nextErrors;
  };

  const refreshInvoices = (updatedInvoices: Invoice[], updatedItems?: InvoiceItem[]) => {
    saveInvoices(updatedInvoices);
    setInvoices(buildInvoicesWithRelations(updatedInvoices, customers, payments));

    if (updatedItems) {
      saveInvoiceItems(updatedItems);
      setInvoiceItems(updatedItems);
    }
  };

  const showSuccessToast = (message: string) => {
    setToast({
      show: true,
      message,
    });
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setForm({
      ...EMPTY_FORM,
      items: [createEmptyItemRow()],
    });
    setErrors({});
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setShowConfirmEditModal(false);
    setSelectedInvoice(null);
    setForm({
      ...EMPTY_FORM,
      items: [createEmptyItemRow()],
    });
    setErrors({});
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedInvoice(null);
    setDeleteConfirmText("");
  };

  const closeNoteModal = () => {
    setShowNoteModal(false);
    setSelectedInvoice(null);
  };

  const handleFormFieldChange = (field: keyof Omit<InvoiceForm, "items">, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    setErrors((prev) => {
      const next = { ...prev };

      if (field === "customerId") {
        if (!value.trim()) next.customerId = "Please select a customer.";
        else delete next.customerId;
      }

      if (field === "date") {
        if (!value) next.date = "Please select a valid invoice date.";
        else delete next.date;
      }

      return next;
    });
  };

  const handleItemChange = (
    rowId: string,
    field: keyof Omit<InvoiceItemFormRow, "id">,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === rowId ? { ...item, [field]: value } : item
      ),
    }));

    setErrors((prev) => {
      if (!prev.rowErrors?.[rowId]) return prev;

      const next = { ...prev };
      const rowErrors = { ...(next.rowErrors || {}) };

      if (rowErrors[rowId]) {
        delete rowErrors[rowId][field];
        if (Object.keys(rowErrors[rowId]).length === 0) {
          delete rowErrors[rowId];
        }
      }

      next.rowErrors =
        Object.keys(rowErrors).length > 0 ? rowErrors : undefined;

      return next;
    });
  };

  const addItemRow = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItemRow()],
    }));
  };

  const removeItemRow = (rowId: string) => {
    setForm((prev) => ({
      ...prev,
      items:
        prev.items.length > 1
          ? prev.items.filter((item) => item.id !== rowId)
          : prev.items,
    }));
  };

  const handleAddInvoice = () => {
    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    const hasRowErrors =
      validationErrors.rowErrors &&
      Object.keys(validationErrors.rowErrors).length > 0;

    if (
      validationErrors.customerId ||
      validationErrors.date ||
      validationErrors.items ||
      hasRowErrors
    ) {
      return;
    }

    const currentInvoices = getInvoices();
    const currentInvoiceItems = getInvoiceItems();

    const newInvoiceId = `INV-${1000 + currentInvoices.length + 1}`;
    const amountNumber = getFormItemsTotal(form.items);

    const newInvoice: Invoice = {
      id: newInvoiceId,
      customerId: form.customerId,
      amount: amountNumber,
      remainingAmount: amountNumber,
      status: "Debit",
      date: form.date,
      notes: form.notes.trim(),
    };

    const newItems: InvoiceItem[] = form.items.map((item, index) => ({
      id: `ITEM-${Date.now()}-${index + 1}`,
      invoiceId: newInvoiceId,
      productId: item.productId,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.quantity) * Number(item.unitPrice),
    }));

    const updatedInvoices = [newInvoice, ...currentInvoices];
    const updatedItems = [...newItems, ...currentInvoiceItems];

    refreshInvoices(updatedInvoices, updatedItems);
    closeAddModal();
    showSuccessToast("Invoice added successfully.");
  };

  const openEditModal = (invoice: ExtendedInvoice) => {
    setSelectedInvoice(invoice);

    const items = invoiceItems
      .filter((item) => item.invoiceId === invoice.id)
      .map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
      }));

    setForm({
      customerId: invoice.customerId,
      date: invoice.date,
      notes: invoice.notes ?? "",
      items: items.length > 0 ? items : [createEmptyItemRow()],
    });

    setErrors({});
    setShowEditModal(true);
  };

  const requestEditConfirmation = () => {
    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    const hasRowErrors =
      validationErrors.rowErrors &&
      Object.keys(validationErrors.rowErrors).length > 0;

    if (
      validationErrors.customerId ||
      validationErrors.date ||
      validationErrors.items ||
      hasRowErrors
    ) {
      return;
    }

    setShowConfirmEditModal(true);
  };

  const handleConfirmEdit = () => {
    if (!selectedInvoice) return;

    const updatedInvoices = getInvoices().map((invoice) =>
      invoice.id === selectedInvoice.id
        ? {
            ...invoice,
            customerId: form.customerId,
            amount: getFormItemsTotal(form.items),
            date: form.date,
            notes: form.notes.trim(),
          }
        : invoice
    );

    const currentItems = getInvoiceItems().filter(
      (item) => item.invoiceId !== selectedInvoice.id
    );

    const updatedInvoiceItems: InvoiceItem[] = [
      ...currentItems,
      ...form.items.map((item, index) => ({
        id: item.id.startsWith("ITEM-") ? item.id : `ITEM-${Date.now()}-${index + 1}`,
        invoiceId: selectedInvoice.id,
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.quantity) * Number(item.unitPrice),
      })),
    ];

    refreshInvoices(updatedInvoices, updatedInvoiceItems);
    closeEditModal();
    showSuccessToast("Invoice updated successfully.");
  };

  const openDeleteModal = (invoice: ExtendedInvoice) => {
    setSelectedInvoice(invoice);
    setDeleteConfirmText("");
    setShowDeleteModal(true);
  };

  const handleDeleteInvoice = () => {
    if (!selectedInvoice || deleteConfirmText !== "DELETE") return;

    const updatedInvoices = getInvoices().filter(
      (invoice) => invoice.id !== selectedInvoice.id
    );

    const updatedItems = getInvoiceItems().filter(
      (item) => item.invoiceId !== selectedInvoice.id
    );

    refreshInvoices(updatedInvoices, updatedItems);
    closeDeleteModal();
    showSuccessToast("Invoice deleted successfully.");
  };

  const openNoteModal = (invoice: ExtendedInvoice) => {
    setSelectedInvoice(invoice);
    setShowNoteModal(true);
  };

  const deleteEnabled = deleteConfirmText === "DELETE";

  return (
    <>
      <style>{`
        .invoices-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .invoices-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }

        .invoices-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
        }

        .invoices-search-box {
          flex: 1;
          min-width: 260px;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .dashboard-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1180px;
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
          min-width: 86px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .status-paid {
          background: rgba(34, 197, 94, 0.12);
          color: #15803d;
        }

        .status-partial {
          background: rgba(245, 158, 11, 0.14);
          color: #b45309;
        }

        .status-debit {
          background: rgba(239, 68, 68, 0.12);
          color: #b91c1c;
        }

        .remaining-paid {
          color: #15803d;
          font-weight: 700;
        }

        .remaining-partial {
          color: #b45309;
          font-weight: 700;
        }

        .remaining-debit {
          color: #b91c1c;
          font-weight: 700;
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

        .note-link-btn,
        .items-link-btn {
          border: none;
          background: transparent;
          color: #2563eb;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }

        .note-link-btn:hover,
        .items-link-btn:hover {
          text-decoration: underline;
        }

        .invoice-items-preview {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .invoice-item-chip {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          background: #eff6ff;
          color: #1d4ed8;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          width: fit-content;
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
          max-width: 980px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
          overflow: hidden;
          animation: modalPop 0.18s ease;
        }

        .modal-card.small {
          max-width: 480px;
        }

        .modal-card.note {
          max-width: 640px;
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
          min-height: 100px;
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

        .confirm-text {
          margin: 0;
          color: #475569;
          line-height: 1.7;
          font-size: 14px;
        }

        .danger-text {
          margin: 0 0 10px;
          color: #b91c1c;
          font-weight: 700;
        }

        .note-content {
          margin: 0;
          color: #334155;
          line-height: 1.8;
          white-space: pre-wrap;
          word-break: break-word;
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

        .customer-select {
          position: relative;
        }

        .customer-select-input-wrap {
          position: relative;
        }

        .customer-select-arrow {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #64748b;
          font-size: 12px;
        }

        .customer-select-menu {
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

        .customer-option {
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

        .customer-option:hover,
        .customer-option.active {
          background: #eff6ff;
        }

        .customer-empty {
          padding: 12px 14px;
          color: #94a3b8;
          font-size: 14px;
        }

        .invoice-items-block {
          margin-top: 24px;
          border-top: 1px solid rgba(148, 163, 184, 0.14);
          padding-top: 20px;
        }

        .invoice-item-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          gap: 12px;
          align-items: start;
          margin-bottom: 14px;
          padding: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #fafcff;
        }

        .invoice-item-row-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .invoice-line-total {
          min-height: 46px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          border-radius: 12px;
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 700;
        }

        .invoice-remove-line-btn {
          border: none;
          border-radius: 12px;
          padding: 10px 12px;
          background: #fee2e2;
          color: #b91c1c;
          font-weight: 700;
          cursor: pointer;
        }

        .invoice-remove-line-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .invoice-add-line-btn {
          border: none;
          border-radius: 12px;
          padding: 10px 14px;
          background: #dbeafe;
          color: #1d4ed8;
          font-weight: 700;
          cursor: pointer;
        }

        .invoice-total-box {
          margin-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 16px;
        }

        .invoice-total-box strong {
          font-size: 20px;
          color: #1d4ed8;
        }

        .mini-help-text {
          margin-top: 6px;
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
        }

        .invoice-items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .invoice-items-list-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 14px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
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

        @media (max-width: 980px) {
          .modal-grid {
            grid-template-columns: 1fr;
          }

          .invoice-item-row {
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

          .invoice-total-box {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="invoices-page">
        <div className="invoices-header">
          <div>
            <p className="dashboard-badge">Invoice Management</p>
            <h1 className="dashboard-title">Invoices</h1>
            <p className="dashboard-subtitle">
              Create invoices with real products, auto-calculate totals, and track payment status automatically.
            </p>
          </div>

          <button className="quick-action-btn" onClick={() => setShowAddModal(true)}>
            + Add Invoice
          </button>
        </div>

        <div className="dashboard-card">
          <div className="invoices-toolbar">
            <div className="dashboard-search-box invoices-search-box">
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
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Still to Pay</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => {
                    const itemDetails = getInvoiceItemDetails(invoice.id);

                    return (
                      <tr key={invoice.id}>
                        <td>{invoice.id}</td>
                        <td>{invoice.customerName}</td>
                        <td>{invoice.date}</td>
                        <td>
                          <div className="invoice-items-preview">
                            {itemDetails.slice(0, 2).map((item) => (
                              <span key={item.id} className="invoice-item-chip">
                                {item.productName} × {item.quantity}
                              </span>
                            ))}
                            {itemDetails.length > 2 ? (
                              <span style={{ fontSize: "12px", color: "#64748b" }}>
                                +{itemDetails.length - 2} more
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td>${invoice.amount}</td>
                        <td>
                          <span
                            className={
                              invoice.status === "Paid"
                                ? "remaining-paid"
                                : invoice.status === "Partial"
                                ? "remaining-partial"
                                : "remaining-debit"
                            }
                          >
                            ${invoice.remainingAmount}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              invoice.status === "Paid"
                                ? "status-badge status-paid"
                                : invoice.status === "Partial"
                                ? "status-badge status-partial"
                                : "status-badge status-debit"
                            }
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td>
                          {invoice.notes ? (
                            <button
                              type="button"
                              className="note-link-btn"
                              onClick={() => openNoteModal(invoice)}
                            >
                              View Note
                            </button>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>—</span>
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

      {(showAddModal || showEditModal) && (
        <div
          className="modal-overlay"
          onClick={showAddModal ? closeAddModal : closeEditModal}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{showAddModal ? "Add Invoice" : "Edit Invoice"}</h2>
                <p>
                  {showAddModal
                    ? "Create an invoice using real product lines."
                    : "Update invoice details and product lines."}
                </p>
              </div>
              <button
                className="modal-close-btn"
                onClick={showAddModal ? closeAddModal : closeEditModal}
              >
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
              <div className="modal-grid">
                <div>
                  <label className="modal-label">Customer</label>
                  <SearchableCustomerSelect
                    value={form.customerId}
                    options={customers}
                    onChange={(value) => handleFormFieldChange("customerId", value)}
                  />
                  {errors.customerId && (
                    <span className="field-error">{errors.customerId}</span>
                  )}
                </div>

                <div>
                  <label className="modal-label">Invoice Date</label>
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
                    placeholder="Add invoice notes..."
                    value={form.notes}
                    onChange={(e) => handleFormFieldChange("notes", e.target.value)}
                  />
                </div>
              </div>

              <div className="invoice-items-block">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, color: "#0f172a" }}>Invoice Items</h3>
                    <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "14px" }}>
                      Add products, quantities, and prices for this invoice.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="invoice-add-line-btn"
                    onClick={addItemRow}
                  >
                    + Add Product Line
                  </button>
                </div>

                {errors.items && <span className="field-error">{errors.items}</span>}

                {form.items.map((row) => (
                  <ProductLineEditor
                    key={row.id}
                    row={row}
                    products={products}
                    onChange={handleItemChange}
                    onRemove={removeItemRow}
                    error={errors.rowErrors?.[row.id]}
                    disableRemove={form.items.length === 1}
                  />
                ))}

                <div className="invoice-total-box">
                  <span style={{ color: "#1e3a8a", fontWeight: 700 }}>
                    Current Invoice Total
                  </span>
                  <strong>${currentFormTotal.toFixed(2)}</strong>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-secondary-btn"
                  onClick={showAddModal ? closeAddModal : closeEditModal}
                >
                  Cancel
                </button>

                {showAddModal ? (
                  <button
                    type="button"
                    className="modal-primary-btn"
                    onClick={handleAddInvoice}
                    disabled={currentFormTotal <= 0}
                  >
                    Save Invoice
                  </button>
                ) : (
                  <button
                    type="button"
                    className="modal-primary-btn"
                    onClick={requestEditConfirmation}
                    disabled={currentFormTotal <= 0}
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirmEditModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmEditModal(false)}>
          <div className="modal-card small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Confirm Changes</h2>
                <p>Please confirm before applying invoice updates.</p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowConfirmEditModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <p className="confirm-text">
                Are you sure you want to save these changes to the invoice?
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-secondary-btn"
                  onClick={() => setShowConfirmEditModal(false)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="modal-primary-btn"
                  onClick={handleConfirmEdit}
                >
                  Confirm Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-card small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Delete Invoice</h2>
                <p>This action cannot be undone.</p>
              </div>
              <button className="modal-close-btn" onClick={closeDeleteModal}>
                ×
              </button>
            </div>

            <div className="modal-content">
              <p className="danger-text">
                You are about to permanently delete invoice {selectedInvoice?.id}.
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
                  onClick={handleDeleteInvoice}
                  disabled={!deleteEnabled}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNoteModal && (
        <div className="modal-overlay" onClick={closeNoteModal}>
          <div className="modal-card note" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Invoice Details</h2>
                <p>Review the note and product lines attached to this invoice.</p>
              </div>
              <button className="modal-close-btn" onClick={closeNoteModal}>
                ×
              </button>
            </div>

            <div className="modal-content">
              <div style={{ marginBottom: "18px" }}>
                <h4 style={{ margin: "0 0 10px", color: "#0f172a" }}>Notes</h4>
                <p className="note-content">
                  {selectedInvoice?.notes || "No note available."}
                </p>
              </div>

              <div>
                <h4 style={{ margin: "0 0 10px", color: "#0f172a" }}>Products</h4>
                <div className="invoice-items-list">
                  {selectedInvoice &&
                    getInvoiceItemDetails(selectedInvoice.id).map((item) => (
                      <div key={item.id} className="invoice-items-list-row">
                        <span>
                          {item.productName} × {item.quantity}
                        </span>
                        <strong>${item.total}</strong>
                      </div>
                    ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-primary-btn" onClick={closeNoteModal}>
                  Close
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