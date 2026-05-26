import "./Purchases.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Eye,
  Filter,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import {
  getProducts,
  getPurchases,
  getSuppliers,
  savePurchases,
  saveSuppliers,
} from "../data/storage";
import type { Product, Purchase, Supplier } from "../data/types";
import { useSettings } from "../context/SettingsContext";

type PurchaseFormState = {
  supplierId: string;
  createNewSupplier: boolean;
  newSupplierName: string;
  newSupplierPhone: string;
  newSupplierEmail: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  totalCost: string;
  date: string;
  paymentTerms: string;
  currency: string;
  taxRate: string;
  warehouse: string;
  notes: string;
};

type ViewMode = "table" | "grid";

type PurchaseStatusView =
  | "Draft"
  | "Pending"
  | "Partially Received"
  | "Received"
  | "Cancelled";

type PaymentStatusView = "Paid" | "Partial" | "Unpaid" | "Overdue";

type QuickStatus = "All" | PurchaseStatusView;

type PurchaseRecord = Purchase & {
  paymentStatus?: PaymentStatusView;
  receivedPercent?: number;
  viewStatus?: PurchaseStatusView;
  paymentTerms?: string;
  currency?: string;
  taxRate?: number;
  warehouse?: string;
};

type PurchaseRow = {
  id: string;
  poNumber: string;
  purchaseId: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  supplierEmail: string;
  supplierAddress: string;
  productId: string;
  productName: string;
  description: string;
  orderDate: string;
  deliveryDate: string;
  totalAmount: number;
  receivedAmount: number;
  receivedPercent: number;
  status: PurchaseStatusView;
  paymentStatus: PaymentStatusView;
  isOverdue: boolean;
  deliveryLabel: string;
  notes: string;
  paymentTerms: string;
  currency: string;
  warehouse: string;
};

type FilterState = {
  supplier: string;
  status: string;
  orderDate: string;
  deliveryDate: string;
  paymentStatus: string;
};

type FormErrors = Partial<
  Record<
    | "supplierId"
    | "newSupplierName"
    | "productId"
    | "quantity"
    | "unitPrice"
    | "date",
    string
  >
>;


const EMPTY_FORM: PurchaseFormState = {
  supplierId: "",
  createNewSupplier: false,
  newSupplierName: "",
  newSupplierPhone: "",
  newSupplierEmail: "",
  productId: "",
  quantity: "1",
  unitPrice: "",
  totalCost: "",
  date: new Date().toISOString().split("T")[0],
  paymentTerms: "Net 30",
  currency: "USD",
  taxRate: "0",
  warehouse: "Main Warehouse",
  notes: "",
};

const EMPTY_FILTERS: FilterState = {
  supplier: "",
  status: "",
  orderDate: "",
  deliveryDate: "",
  paymentStatus: "",
};

const DELETE_CONFIRMATION_CODE = "123";
const TODAY = new Date().toISOString().split("T")[0];

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
}

function addDays(date: string, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next.toISOString().split("T")[0];
}

function dateDifferenceLabel(date: string) {
  const diffDays = Math.ceil(
    (new Date(date).getTime() - new Date(TODAY).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return { label: "Overdue", tone: "danger" as const };
  }

  if (diffDays === 0) {
    return { label: "Today", tone: "warning" as const };
  }

  if (diffDays === 1) {
    return { label: "Tomorrow", tone: "warning" as const };
  }

  return { label: `In ${diffDays} days`, tone: "info" as const };
}

function badgeTone(
  value: PurchaseStatusView | PaymentStatusView
): "positive" | "warning" | "danger" | "neutral" | "info" {
  switch (value) {
    case "Received":
    case "Paid":
      return "positive";
    case "Partially Received":
    case "Partial":
      return "warning";
    case "Cancelled":
    case "Overdue":
      return "danger";
    case "Unpaid":
      return "warning";
    case "Pending":
      return "info";
    case "Draft":
    default:
      return "neutral";
  }
}

function buildPoNumber(index: number) {
  return `PO-2605-${String(index + 1).padStart(3, "0")}`;
}

function getMainStatus(status: PurchaseStatusView, isOverdue: boolean): {
  label: string;
  tone: "positive" | "warning" | "danger" | "neutral" | "info";
} {
  if (isOverdue && status === "Draft") return { label: "Overdue", tone: "danger" };
  return { label: status, tone: badgeTone(status) };
}

function getProductUnitPrice(product?: Product) {
  if (!product) return 0;

  const purchasePrice = Number(product.purchasePrice);
  const price = Number(product.price);
  const salePrice = Number(product.salePrice);

  if (Number.isFinite(purchasePrice) && purchasePrice > 0) return purchasePrice;
  if (Number.isFinite(price) && price > 0) return price;
  if (Number.isFinite(salePrice) && salePrice > 0) return salePrice;

  return 0;
}

const SUPP_AVATAR_COLORS = ["#2563eb","#7c3aed","#0891b2","#059669","#d97706","#dc2626","#db2777","#65a30d"];
function getSupplierAvatarBg(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return SUPP_AVATAR_COLORS[Math.abs(hash) % SUPP_AVATAR_COLORS.length];
}
function getSupplierInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function calculateTotal(quantity: string, unitPrice: string, taxRate: string) {
  const quantityValue = Number(quantity || 0);
  const unitPriceValue = Number(unitPrice || 0);
  const taxRateValue = Number(taxRate || 0);

  const subtotal = quantityValue * unitPriceValue;
  const tax = (subtotal * taxRateValue) / 100;

  return Number((subtotal + tax).toFixed(2));
}

function getStatusFromPurchase(
  purchase: PurchaseRecord,
  index: number
): PurchaseStatusView {
  if (purchase.viewStatus) return purchase.viewStatus;

  if (purchase.status === "Received") {
    return index % 3 === 1 ? "Partially Received" : "Received";
  }

  if (index % 5 === 0) return "Draft";
  if (index % 4 === 0) return "Cancelled";

  return "Pending";
}

function getPaymentStatusFromPurchase(
  status: PurchaseStatusView,
  index: number,
  isOverdue: boolean,
  storedStatus?: PaymentStatusView
): PaymentStatusView {
  if (storedStatus) return storedStatus;
  if (status === "Received") return index % 4 === 0 ? "Partial" : "Paid";
  if (status === "Partially Received") return "Partial";
  return isOverdue ? "Overdue" : "Unpaid";
}

function getReceivedPercent(
  status: PurchaseStatusView,
  index: number,
  storedPercent?: number
) {
  if (typeof storedPercent === "number" && Number.isFinite(storedPercent)) {
    return Math.max(0, Math.min(100, storedPercent));
  }

  if (status === "Received") return 100;
  if (status === "Partially Received") return [42, 50, 68, 74][index % 4];

  return 0;
}

function buildRows(
  purchases: PurchaseRecord[],
  suppliers: Supplier[],
  products: Product[]
): PurchaseRow[] {
  const supplierMap = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  const productMap = new Map(products.map((product) => [product.id, product]));
  const deliveryOffsets = [-3, 2, 5, -1, 4, 0, 7, -4];

  return purchases
    .filter((purchase) => !purchase.isDeleted)
    .map((purchase, index) => {
      const supplier = supplierMap.get(purchase.supplierId);
      const product = productMap.get(purchase.productId);
      const status = getStatusFromPurchase(purchase, index);
      const deliveryDate = addDays(
        TODAY,
        deliveryOffsets[index % deliveryOffsets.length]
      );
      const dueMeta = dateDifferenceLabel(deliveryDate);
      const paymentStatus = getPaymentStatusFromPurchase(
        status,
        index,
        dueMeta.label === "Overdue",
        purchase.paymentStatus
      );
      const receivedPercent = getReceivedPercent(
        status,
        index,
        purchase.receivedPercent
      );
      const receivedAmount = Number(
        ((purchase.totalCost || 0) * (receivedPercent / 100)).toFixed(2)
      );

      return {
        id: purchase.id,
        poNumber: buildPoNumber(index),
        purchaseId: purchase.id,
        supplierId: purchase.supplierId,
        supplierName: supplier?.name || "Unknown Supplier",
        supplierPhone: supplier?.phone || "-",
        supplierEmail: supplier?.email || "-",
        supplierAddress: supplier?.address || "-",
        productId: purchase.productId,
        productName: product?.name || "Product",
        description: purchase.notes?.trim() || `${product?.name || "Purchase"} order`,
        orderDate: purchase.date,
        deliveryDate,
        totalAmount: Number(purchase.totalCost || 0),
        receivedAmount,
        receivedPercent,
        status,
        paymentStatus,
        isOverdue: dueMeta.label === "Overdue",
        deliveryLabel: dueMeta.label,
        notes: purchase.notes?.trim() || "No notes",
        paymentTerms: purchase.paymentTerms || "Net 30",
        currency: purchase.currency || "USD",
        warehouse: purchase.warehouse || "Main Warehouse",
      };
    });
}

export default function Purchases() {
  const { t } = useSettings();
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getSuppliers());
  const [products] = useState<Product[]>(() => getProducts());
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(
    () => getPurchases() as PurchaseRecord[]
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [quickStatus, setQuickStatus] = useState<QuickStatus>("All");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [prevFilterSig, setPrevFilterSig] = useState({ searchTerm, filters, quickStatus, rowsPerPage });

  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState<PurchaseFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formDirty, setFormDirty] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [detailRecord, setDetailRecord] = useState<PurchaseRow | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<PurchaseRow | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const filterPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    savePurchases(purchases);
  }, [purchases]);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!showMoreFilters) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (filterPopoverRef.current?.contains(target)) return;
      setShowMoreFilters(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setShowMoreFilters(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showMoreFilters]);

  const forceCloseForm = useCallback(() => {
    setFormOpen(false);
    setDiscardConfirmOpen(false);
    setFormDirty(false);
    setFormErrors({});
    setFormState(EMPTY_FORM);
    setEditingId(null);
  }, []);

  const requestCloseForm = useCallback(() => {
    if (formDirty) {
      setDiscardConfirmOpen(true);
      return;
    }
    forceCloseForm();
  }, [formDirty, forceCloseForm]);

  useEffect(() => {
    if (!formOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") requestCloseForm();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [formOpen, requestCloseForm]);

  const rows = useMemo(
    () => buildRows(purchases, suppliers, products),
    [products, purchases, suppliers]
  );

  const rowsMap = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);

  const supplierProductMap = useMemo(() => {
    const activeProducts = products.filter((product) => !product.isDeleted);

    return suppliers.reduce<Record<string, Product[]>>((accumulator, supplier, index) => {
      accumulator[supplier.id] = activeProducts.filter(
        (_, productIndex) =>
          productIndex % Math.max(1, suppliers.length) ===
          index % Math.max(1, suppliers.length)
      );

      if (accumulator[supplier.id].length === 0) {
        accumulator[supplier.id] = activeProducts;
      }

      return accumulator;
    }, {});
  }, [products, suppliers]);

  const formProducts = useMemo(() => {
    const activeProducts = products.filter((product) => !product.isDeleted);

    if (!formState.supplierId) return activeProducts;

    return supplierProductMap[formState.supplierId] || activeProducts;
  }, [formState.supplierId, products, supplierProductMap]);

  const selectedSupplier = suppliers.find(
    (supplier) => supplier.id === formState.supplierId
  );

  const selectedProduct = products.find(
    (product) => product.id === formState.productId
  );

  const quantityValue = Number(formState.quantity || 0);
  const unitPriceValue = Number(formState.unitPrice || 0);
  const subtotalValue = Number((quantityValue * unitPriceValue).toFixed(2));
  const taxValue = Number(
    ((subtotalValue * Number(formState.taxRate || 0)) / 100).toFixed(2)
  );
  const totalValue = Number((subtotalValue + taxValue).toFixed(2));

  const supplierOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.supplierName)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return rows.filter((row) => {
      if (query) {
        const haystack = [
          row.poNumber,
          row.supplierName,
          row.productName,
          row.status,
          row.paymentStatus,
          row.description,
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      if (quickStatus !== "All" && row.status !== quickStatus) return false;
      if (filters.supplier && row.supplierName !== filters.supplier) return false;
      if (filters.status && row.status !== filters.status) return false;

      if (filters.paymentStatus && row.paymentStatus !== filters.paymentStatus) {
        return false;
      }

      if (filters.orderDate) {
        if (
          filters.orderDate === "thisMonth" &&
          row.orderDate.slice(0, 7) !== TODAY.slice(0, 7)
        ) {
          return false;
        }

        if (filters.orderDate === "last7" && row.orderDate < addDays(TODAY, -7)) {
          return false;
        }
      }

      if (filters.deliveryDate) {
        if (filters.deliveryDate === "overdue" && !row.isOverdue) return false;

        if (filters.deliveryDate === "thisWeek") {
          const diffDays = Math.ceil(
            (new Date(row.deliveryDate).getTime() - new Date(TODAY).getTime()) /
              (1000 * 60 * 60 * 24)
          );

          if (diffDays < 0 || diffDays > 7) return false;
        }
      }

      return true;
    });
  }, [filters, quickStatus, rows, searchTerm]);

  if (
    prevFilterSig.searchTerm !== searchTerm ||
    prevFilterSig.filters !== filters ||
    prevFilterSig.quickStatus !== quickStatus ||
    prevFilterSig.rowsPerPage !== rowsPerPage
  ) {
    setPrevFilterSig({ searchTerm, filters, quickStatus, rowsPerPage });
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const effectivePage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((effectivePage - 1) * rowsPerPage, effectivePage * rowsPerPage);
  const visibleRows = paginatedRows;

  const activeAdvancedCount = [
    filters.orderDate,
    filters.deliveryDate,
    filters.paymentStatus,
  ].filter(Boolean).length;

  function openFilterPopover() {
    setDraftFilters(filters);
    setShowMoreFilters(true);
  }

  function applyFilters() {
    setFilters(draftFilters);
    setShowMoreFilters(false);
  }

  function resetDraftFilters() {
    setDraftFilters(EMPTY_FILTERS);
  }

  function markFormDirty() {
    setFormDirty(true);
  }

  function handleFormChange<K extends keyof PurchaseFormState>(
    field: K,
    value: PurchaseFormState[K]
  ) {
    markFormDirty();

    setFormState((current) => {
      const next = { ...current, [field]: value };

      if (field === "createNewSupplier" && value === true) {
        next.supplierId = "";
      }

      if (field === "supplierId") {
        next.createNewSupplier = false;
        next.newSupplierName = "";
        next.newSupplierPhone = "";
        next.newSupplierEmail = "";

        const allowedProducts = supplierProductMap[String(value)] || [];

        if (
          next.productId &&
          !allowedProducts.some((item) => item.id === next.productId)
        ) {
          next.productId = "";
          next.unitPrice = "";
          next.totalCost = "";
        }
      }

      if (field === "productId") {
        const product = products.find((item) => item.id === value);
        const nextUnitPrice = getProductUnitPrice(product);
        next.unitPrice = nextUnitPrice ? String(nextUnitPrice) : "";
      }

      if (
        field === "productId" ||
        field === "quantity" ||
        field === "unitPrice" ||
        field === "taxRate"
      ) {
        const total = calculateTotal(next.quantity, next.unitPrice, next.taxRate);
        next.totalCost = String(total);
      }

      return next;
    });

    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  function openAddModal() {
    setFormMode("add");
    setEditingId(null);
    setFormState(EMPTY_FORM);
    setFormErrors({});
    setFormDirty(false);
    setDiscardConfirmOpen(false);
    setFormOpen(true);
  }

  function openEditModal(id: string) {
    const purchase = purchases.find((entry) => entry.id === id);
    if (!purchase) return;

    const product = products.find((item) => item.id === purchase.productId);
    const quantity = String(purchase.quantity || 1);
    const taxRate = String(purchase.taxRate || 0);
    const productPrice = getProductUnitPrice(product);
    const unitPrice =
      purchase.quantity > 0
        ? String(Number((purchase.totalCost / Math.max(1, purchase.quantity)).toFixed(2)))
        : String(productPrice);

    setFormMode("edit");
    setEditingId(id);
    setFormState({
      supplierId: purchase.supplierId,
      createNewSupplier: false,
      newSupplierName: "",
      newSupplierPhone: "",
      newSupplierEmail: "",
      productId: purchase.productId,
      quantity,
      unitPrice,
      totalCost: String(
        purchase.totalCost || calculateTotal(quantity, unitPrice, taxRate)
      ),
      date: purchase.date,
      paymentTerms: purchase.paymentTerms || "Net 30",
      currency: purchase.currency || "USD",
      taxRate,
      warehouse: purchase.warehouse || "Main Warehouse",
      notes: purchase.notes || "",
    });
    setFormErrors({});
    setFormDirty(false);
    setDiscardConfirmOpen(false);
    setFormOpen(true);
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!formState.supplierId && !formState.createNewSupplier) {
      nextErrors.supplierId = "Choose supplier or create a new supplier";
    }

    if (formState.createNewSupplier && !formState.newSupplierName.trim()) {
      nextErrors.newSupplierName = "Supplier name is required";
    }

    if (!formState.productId) nextErrors.productId = "Product is required";

    if (!formState.quantity || Number(formState.quantity) <= 0) {
      nextErrors.quantity = "Enter a valid quantity";
    }

    if (!formState.unitPrice || Number(formState.unitPrice) <= 0) {
      nextErrors.unitPrice = "Unit price is required from product";
    }

    if (!formState.date) nextErrors.date = "Order date is required";

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function createGlobalSupplierIfNeeded() {
    if (!formState.createNewSupplier) {
      return formState.supplierId;
    }

    const supplierName = formState.newSupplierName.trim();
    const supplierPhone = formState.newSupplierPhone.trim();
    const supplierEmail = formState.newSupplierEmail.trim();

    const existingSupplier = suppliers.find(
      (supplier) =>
        supplier.name.trim().toLowerCase() === supplierName.toLowerCase()
    );

    if (existingSupplier) {
      return existingSupplier.id;
    }

    const newSupplier = {
      id: `SUP-${Date.now()}`,
      name: supplierName,
      phone: supplierPhone,
      email: supplierEmail,
      address: "",
      isDeleted: false,
      createdAt: new Date().toISOString(),
    } as Supplier;

    const nextSuppliers = [newSupplier, ...suppliers];

    setSuppliers(nextSuppliers);
    saveSuppliers(nextSuppliers);

    return newSupplier.id;
  }

  function saveForm(mode: "draft" | "final" = "final") {
    if (!validateForm()) return;

    const currentRecord = editingId
      ? purchases.find((entry) => entry.id === editingId)
      : null;

    const nextViewStatus: PurchaseStatusView =
      mode === "draft"
        ? "Draft"
        : currentRecord?.viewStatus && currentRecord.viewStatus !== "Draft"
          ? currentRecord.viewStatus
          : "Pending";

    const supplierId = createGlobalSupplierIfNeeded();

    const payload: PurchaseRecord = {
      id: editingId || `PUR-${Date.now()}`,
      supplierId,
      productId: formState.productId,
      quantity: Number(formState.quantity || 0),
      totalCost: Number(totalValue || 0),
      status: nextViewStatus === "Received" ? "Received" : "Pending",
      date: formState.date,
      notes: formState.notes.trim(),
      viewStatus: nextViewStatus,
      paymentStatus:
        mode === "draft"
          ? "Unpaid"
          : currentRecord?.paymentStatus && currentRecord.paymentStatus !== "Overdue"
            ? currentRecord.paymentStatus
            : "Unpaid",
      receivedPercent:
        nextViewStatus === "Received"
          ? 100
          : nextViewStatus === "Partially Received"
            ? currentRecord?.receivedPercent ?? 50
            : 0,
      paymentTerms: formState.paymentTerms.trim() || "Net 30",
      currency: formState.currency,
      taxRate: Number(formState.taxRate || 0),
      warehouse: formState.warehouse.trim() || "Main Warehouse",
    };

    if (!payload.supplierId || !payload.productId || payload.quantity <= 0) return;

    if (formMode === "edit" && editingId) {
      setPurchases((current) =>
        current.map((entry) => (entry.id === editingId ? payload : entry))
      );
      setToast(mode === "draft" ? t.common.saveAsDraft : t.purchases.toast.updated);
    } else {
      setPurchases((current) => [payload, ...current]);
      setToast(mode === "draft" ? t.common.saveAsDraft : t.purchases.toast.created);
    }

    forceCloseForm();
  }

  function requestDelete(row: PurchaseRow) {
    setDeleteRecord(row);
    setDeleteCode("");
    setDeleteError("");
  }

  function confirmDelete() {
    if (deleteCode !== DELETE_CONFIRMATION_CODE) {
      setDeleteError("Type 123 to confirm");
      return;
    }

    if (!deleteRecord) return;

    setPurchases((current) =>
      current.filter((entry) => entry.id !== deleteRecord.purchaseId)
    );
    setDeleteRecord(null);
    setDeleteCode("");
    setDeleteError("");
    setToast(t.purchases.toast.deleted);
  }

  function renderRowActions(row: PurchaseRow) {
    const canEdit = row.status === "Draft" || row.status === "Pending";

    return (
      <div className="purchase-row-actions">
        <button
          type="button"
          className="purchase-action-icon view"
          title="View details"
          onClick={(e) => { e.stopPropagation(); setDetailRecord(row); }}
        >
          <Eye size={15} />
        </button>

        <button
          type="button"
          className="purchase-action-icon edit"
          title={canEdit ? "Edit" : "View"}
          onClick={(e) => { e.stopPropagation(); if (canEdit) { openEditModal(row.purchaseId); } else { setDetailRecord(row); } }}
        >
          <Pencil size={15} />
        </button>

        <button
          type="button"
          className="purchase-action-icon delete"
          title="Delete"
          onClick={(e) => { e.stopPropagation(); requestDelete(row); }}
        >
          <Trash2 size={15} />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="purchases-workspace">
        <section className="purchases-header-card">
          <div className="purchases-header-copy">
            <div className="page-badge">
              <ShoppingCart size={16} />
              {t.purchases.pageTitle}
            </div>
            <h1>{t.purchases.pageTitle}</h1>
            <p>{t.purchases.pageSubtitle}</p>
          </div>

          <div className="purchases-header-actions">
            <Button variant="primary" type="button" onClick={openAddModal} leftIcon={<Plus size={16} />}>
              {t.purchases.newPurchase}
            </Button>
          </div>
        </section>

        <div className="purchases-content-card">
        <div className={`purchase-filters-section ${showMoreFilters ? "filters-open" : ""}`}>
              <div className="purchase-toolbar">
                <label className="search-field">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder={t.purchases.searchPlaceholder}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </label>

                <div className="toolbar-cluster">
                  <button
                    className={`toolbar-button ${showMoreFilters ? "active" : ""}`}
                    type="button"
                    onClick={() =>
                      showMoreFilters ? setShowMoreFilters(false) : openFilterPopover()
                    }
                    aria-expanded={showMoreFilters}
                  >
                    <Filter size={16} />
                    {t.purchases.filterBtn}
                    {activeAdvancedCount > 0 && (
                      <span className="toolbar-count">{activeAdvancedCount}</span>
                    )}
                    <ChevronDown size={15} />
                  </button>

                  <div className="view-toggle">
                    <button
                      type="button"
                      className={viewMode === "table" ? "active" : ""}
                      onClick={() => setViewMode("table")}
                    >
                      <List size={16} />
                    </button>
                    <button
                      type="button"
                      className={viewMode === "grid" ? "active" : ""}
                      onClick={() => setViewMode("grid")}
                    >
                      <LayoutGrid size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {showMoreFilters && (
                <div className="filters-popover-shell" ref={filterPopoverRef}>
                  <div className="filters-popover-head">
                    <div>
                      <strong>{t.purchases.filterBtn}</strong>
                      <span>Refine purchases with compact focused controls.</span>
                    </div>
                    <button
                      type="button"
                      className="icon-button filter-close-button"
                      onClick={() => setShowMoreFilters(false)}
                      aria-label="Close filters"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="filters-popover-grid">
                    <div className="filter-field">
                      <Select
                        label="Supplier"
                        value={draftFilters.supplier}
                        onChange={(event) =>
                          setDraftFilters((current) => ({
                            ...current,
                            supplier: event.target.value,
                          }))
                        }
                        options={[
                          { value: "", label: "All Suppliers" },
                          ...supplierOptions.map((supplier) => ({ value: supplier, label: supplier })),
                        ]}
                      />
                    </div>

                    <div className="filter-field">
                      <Select
                        label="Status"
                        value={draftFilters.status}
                        onChange={(event) =>
                          setDraftFilters((current) => ({
                            ...current,
                            status: event.target.value,
                          }))
                        }
                        options={[
                          { value: "", label: "All Statuses" },
                          { value: "Draft", label: "Draft" },
                          { value: "Pending", label: "Pending" },
                          { value: "Partially Received", label: "Partially Received" },
                          { value: "Received", label: "Received" },
                          { value: "Cancelled", label: "Cancelled" },
                        ]}
                      />
                    </div>

                    <div className="filter-field">
                      <Select
                        label="Order Date"
                        value={draftFilters.orderDate}
                        onChange={(event) =>
                          setDraftFilters((current) => ({
                            ...current,
                            orderDate: event.target.value,
                          }))
                        }
                        options={[
                          { value: "", label: "Any Range" },
                          { value: "thisMonth", label: "This Month" },
                          { value: "last7", label: "Last 7 Days" },
                        ]}
                      />
                    </div>

                    <div className="filter-field">
                      <Select
                        label="Delivery Date"
                        value={draftFilters.deliveryDate}
                        onChange={(event) =>
                          setDraftFilters((current) => ({
                            ...current,
                            deliveryDate: event.target.value,
                          }))
                        }
                        options={[
                          { value: "", label: "Any Range" },
                          { value: "thisWeek", label: "This Week" },
                          { value: "overdue", label: "Overdue" },
                        ]}
                      />
                    </div>

                    <div className="filter-field">
                      <Select
                        label="Payment Status"
                        value={draftFilters.paymentStatus}
                        onChange={(event) =>
                          setDraftFilters((current) => ({
                            ...current,
                            paymentStatus: event.target.value,
                          }))
                        }
                        options={[
                          { value: "", label: "All" },
                          { value: "Paid", label: "Paid" },
                          { value: "Partial", label: "Partial" },
                          { value: "Unpaid", label: "Unpaid" },
                          { value: "Overdue", label: "Overdue" },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="filters-popover-actions">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={resetDraftFilters}
                    >
                      {t.common.reset}
                    </Button>
                    <div className="filters-popover-cta">
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => setShowMoreFilters(false)}
                      >
                        {t.common.close}
                      </Button>
                      <Button
                        variant="primary"
                        type="button"
                        onClick={applyFilters}
                      >
                        {t.common.apply}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="status-chip-row">
                {(
                  [
                    "All",
                    "Draft",
                    "Pending",
                    "Partially Received",
                    "Received",
                    "Cancelled",
                  ] as QuickStatus[]
                ).map((status) => {
                  const count =
                    status === "All"
                      ? rows.length
                      : rows.filter((row) => row.status === status).length;

                  return (
                    <button
                      key={status}
                      type="button"
                      className={`status-chip ${quickStatus === status ? "active" : ""}`}
                      onClick={() => setQuickStatus(status)}
                    >
                      <span>{status}</span>
                      <em>{count}</em>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="purchase-table-section">
              {viewMode === "table" ? (
                <div className="purchase-table-wrap">
                  <table className="purchase-table">
                    <colgroup>
                      <col /><col /><col /><col /><col /><col /><col />
                    </colgroup>

                    <thead>
                      <tr>
                        <th><span className="th-sort">{t.purchases.cols.poNumber} <ArrowUpDown size={11} /></span></th>
                        <th>{t.purchases.cols.supplier}</th>
                        <th><span className="th-sort">Delivery Date <ArrowUpDown size={11} /></span></th>
                        <th><span className="th-sort">{t.purchases.cols.total} <ArrowUpDown size={11} /></span></th>
                        <th><span className="th-sort">{t.purchases.cols.received} <ArrowUpDown size={11} /></span></th>
                        <th>{t.purchases.cols.status}</th>
                        <th>{t.purchases.cols.actions}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleRows.map((row) => {
                        const deliveryMeta = dateDifferenceLabel(row.deliveryDate);

                        return (
                          <tr key={row.id}>
                            <td>
                              <div className="po-cell">
                                <strong>{row.poNumber}</strong>
                                <span>{row.productName}</span>
                              </div>
                            </td>

                            <td>
                              <div className="supplier-cell">
                                <div
                                  className="supp-avatar"
                                  style={{ background: getSupplierAvatarBg(row.supplierName) }}
                                >
                                  {getSupplierInitials(row.supplierName)}
                                </div>
                                <div className="supp-info">
                                  <strong>{row.supplierName}</strong>
                                  <span>{row.supplierPhone !== "-" ? row.supplierPhone : "—"}</span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <div className="delivery-cell">
                                <strong>{formatDate(row.deliveryDate)}</strong>
                                <span className={`delivery-label ${deliveryMeta.tone}`}>
                                  {deliveryMeta.tone === "danger"
                                    ? <AlertCircle size={13} />
                                    : <Calendar size={13} />}
                                  <span>{row.deliveryLabel}</span>
                                </span>
                              </div>
                            </td>

                            <td>
                              <strong className="amount-value">{money(row.totalAmount)}</strong>
                            </td>

                            <td>
                              <div className="received-cell">
                                <strong>{money(row.receivedAmount)}</strong>
                                <span>{row.receivedPercent}% {t.purchases.cols.received}</span>
                              </div>
                            </td>

                            <td>
                              {(() => {
                                const ms = getMainStatus(row.status, row.isOverdue);
                                const variantMap: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
                                  positive: "success",
                                  warning: "warning",
                                  danger: "danger",
                                  info: "info",
                                  neutral: "neutral",
                                };
                                return <Badge variant={variantMap[ms.tone]}>{ms.label}</Badge>;
                              })()}
                            </td>

                            <td className="actions-cell">{renderRowActions(row)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="purchase-grid">
                  {visibleRows.map((row) => (
                    <article key={row.id} className="purchase-grid-card">
                      <div className="purchase-grid-head">
                        <span className="purchase-grid-po">{row.poNumber}</span>
                        {(() => {
                          const tone = badgeTone(row.status);
                          const variantMap: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
                            positive: "success",
                            warning: "warning",
                            danger: "danger",
                            info: "info",
                            neutral: "neutral",
                          };
                          return <Badge variant={variantMap[tone]}>{row.status}</Badge>;
                        })()}
                      </div>

                      <p className="purchase-grid-desc">{row.description || "—"}</p>

                      <div className="purchase-grid-divider" />

                      <div className="purchase-grid-meta">
                        <div className="purchase-grid-meta-row">
                          <span className="pgm-label">{t.purchases.cols.supplier}</span>
                          <span className="pgm-value">{row.supplierName}</span>
                        </div>
                        <div className="purchase-grid-meta-row">
                          <span className="pgm-label">Delivery</span>
                          <span className="pgm-value">{formatDate(row.deliveryDate)}</span>
                        </div>
                        <div className="purchase-grid-meta-row">
                          <span className="pgm-label">{t.purchases.cols.total}</span>
                          <span className="pgm-value pgm-amount">{money(row.totalAmount)}</span>
                        </div>
                        <div className="purchase-grid-meta-row">
                          <span className="pgm-label">{t.purchases.cols.received}</span>
                          <span className="pgm-value">{row.receivedPercent}%</span>
                        </div>
                      </div>

                      <div className="purchase-grid-actions">
                        {renderRowActions(row)}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div className="purch-table-footer">
                <span>
                  Showing {filteredRows.length === 0 ? 0 : (effectivePage - 1) * rowsPerPage + 1} to{" "}
                  {Math.min(effectivePage * rowsPerPage, filteredRows.length)} of {filteredRows.length} results
                </span>
                <div className="purch-footer-right">
                  <div className="purch-pagination">
                    <button type="button" className="purch-page-btn" disabled={effectivePage <= 1}
                      onClick={() => setPage((p) => p - 1)}>‹</button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                      <button key={n} type="button"
                        className={`purch-page-btn ${effectivePage === n ? "active" : ""}`}
                        onClick={() => setPage(n)}>{n}</button>
                    ))}
                    <button type="button" className="purch-page-btn" disabled={effectivePage >= totalPages}
                      onClick={() => setPage((p) => p + 1)}>›</button>
                  </div>
                  <div className="purch-rows-select">
                    <Select
                      value={String(rowsPerPage)}
                      onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                      options={[10, 25, 50].map((n) => ({ value: String(n), label: `${n} / page` }))}
                    />
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>

      <Modal
        isOpen={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        variant="drawer"
        title={detailRecord?.supplierName}
        description={detailRecord ? `${detailRecord.poNumber} — ${detailRecord.description}` : undefined}
        className="purchase-modal purchase-detail-modal"
      >
        {detailRecord && (
              <div className="drawer-grid">
                <div className="drawer-card">
                  <h3>{t.purchases.detail.title}</h3>
                  <dl>
                    <div>
                      <dt>{t.common.product}</dt>
                      <dd>{detailRecord.productName}</dd>
                    </div>
                    <div>
                      <dt>{t.purchases.cols.date}</dt>
                      <dd>{formatDate(detailRecord.orderDate)}</dd>
                    </div>
                    <div>
                      <dt>{t.purchases.form.expectedDate}</dt>
                      <dd>{formatDate(detailRecord.deliveryDate)}</dd>
                    </div>
                    <div>
                      <dt>{t.purchases.detail.total}</dt>
                      <dd>{money(detailRecord.totalAmount)}</dd>
                    </div>
                    <div>
                      <dt>{t.purchases.cols.received}</dt>
                      <dd>{money(detailRecord.receivedAmount)}</dd>
                    </div>
                    <div>
                      <dt>Payment Terms</dt>
                      <dd>{detailRecord.paymentTerms}</dd>
                    </div>
                    <div>
                      <dt>Warehouse</dt>
                      <dd>{detailRecord.warehouse}</dd>
                    </div>
                  </dl>
                </div>

                <div className="drawer-card">
                  <h3>{t.purchases.cols.supplier}</h3>
                  <dl>
                    <div>
                      <dt>{t.common.name}</dt>
                      <dd>{detailRecord.supplierName}</dd>
                    </div>
                    <div>
                      <dt>{t.common.phone}</dt>
                      <dd>{detailRecord.supplierPhone}</dd>
                    </div>
                    <div>
                      <dt>{t.common.email}</dt>
                      <dd>{detailRecord.supplierEmail}</dd>
                    </div>
                    <div>
                      <dt>{t.common.address}</dt>
                      <dd>{detailRecord.supplierAddress}</dd>
                    </div>
                  </dl>
                </div>

                <div className="drawer-card full">
                  <h3>{t.common.notes}</h3>
                  <p>{detailRecord.notes}</p>
                </div>
              </div>
        )}
      </Modal>

      <Modal
        isOpen={formOpen}
        onClose={requestCloseForm}
        variant="dialog"
        size="lg"
        title={formMode === "add" ? t.purchases.form.createTitle : t.purchases.form.editTitle}
        description="Product pricing is linked automatically. Create a supplier here and it will be available globally."
        className="purchase-modal purchase-order-modal"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={requestCloseForm}>
              {t.common.cancel}
            </Button>
            <Button
              variant="secondary"
              className="subtle-action"
              type="button"
              onClick={() => saveForm("draft")}
            >
              {t.common.saveAsDraft}
            </Button>
            <Button variant="primary" type="button" onClick={() => saveForm("final")}>
              {formMode === "add" ? t.purchases.newPurchase : t.common.saveChanges}
            </Button>
          </>
        }
      >
              <div className="purchase-order-body">
                <div className="purchase-order-layout">
                  <div className="purchase-order-main">
                    <section className="purchase-form-section">
                      <div className="purchase-section-head">
                        <h3>{t.purchases.form.supplier}</h3>
                        <p>
                          Choose an existing supplier or create a real supplier that appears
                          in the Suppliers page.
                        </p>
                      </div>

                      <div className="purchase-form-grid">
                        <div className="purchase-field">
                          <Select
                            label="Existing Supplier"
                            value={formState.supplierId}
                            disabled={formState.createNewSupplier}
                            onChange={(event) =>
                              handleFormChange("supplierId", event.target.value)
                            }
                            placeholder="Choose supplier"
                            error={formErrors.supplierId}
                            options={suppliers.map((supplier) => ({
                              value: supplier.id,
                              label: supplier.name,
                            }))}
                          />
                        </div>

                        <label className="purchase-toggle-card">
                          <input
                            type="checkbox"
                            checked={formState.createNewSupplier}
                            onChange={(event) =>
                              handleFormChange(
                                "createNewSupplier",
                                event.target.checked
                              )
                            }
                          />
                          <span>
                            Create new supplier
                            <small>Saved globally and visible in Suppliers.</small>
                          </span>
                        </label>

                        {formState.createNewSupplier && (
                          <>
                            <div className="purchase-field">
                              <Input
                                variant="text"
                                label="Supplier Name *"
                                placeholder="Supplier name"
                                value={formState.newSupplierName}
                                onChange={(event) =>
                                  handleFormChange(
                                    "newSupplierName",
                                    event.target.value
                                  )
                                }
                                error={formErrors.newSupplierName}
                              />
                            </div>

                            <div className="purchase-field">
                              <Input
                                variant="text"
                                label="Supplier Phone"
                                placeholder="Phone number"
                                value={formState.newSupplierPhone}
                                onChange={(event) =>
                                  handleFormChange(
                                    "newSupplierPhone",
                                    event.target.value
                                  )
                                }
                              />
                            </div>

                            <div className="purchase-field full">
                              <Input
                                variant="email"
                                label="Supplier Email"
                                placeholder="supplier@example.com"
                                value={formState.newSupplierEmail}
                                onChange={(event) =>
                                  handleFormChange(
                                    "newSupplierEmail",
                                    event.target.value
                                  )
                                }
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </section>

                    <section className="purchase-form-section">
                      <div className="purchase-section-head">
                        <h3>Purchase Details</h3>
                        <p>
                          Unit price and total cost are linked to the selected product and
                          calculated automatically.
                        </p>
                      </div>

                      <div className="purchase-form-grid">
                        <div className="purchase-field">
                          <Select
                            label="Product *"
                            value={formState.productId}
                            onChange={(event) =>
                              handleFormChange("productId", event.target.value)
                            }
                            placeholder="Search or select product"
                            error={formErrors.productId}
                            options={formProducts.map((product) => ({
                              value: product.id,
                              label: product.name,
                            }))}
                          />
                        </div>

                        <div className="purchase-field">
                          <Input
                            variant="number"
                            label="Quantity *"
                            min="1"
                            placeholder="Enter quantity"
                            value={formState.quantity}
                            onChange={(event) =>
                              handleFormChange("quantity", event.target.value)
                            }
                            error={formErrors.quantity}
                          />
                        </div>

                        <div className="purchase-field purchase-field-readonly">
                          <Input
                            variant="text"
                            label="Unit Price From Product"
                            value={
                              formState.unitPrice
                                ? money(unitPriceValue)
                                : "Select product first"
                            }
                            readOnly
                            error={formErrors.unitPrice}
                          />
                        </div>

                        <div className="purchase-field purchase-field-readonly">
                          <Input
                            variant="text"
                            label="Total Cost"
                            value={money(totalValue)}
                            readOnly
                            placeholder="Auto-calculated total"
                          />
                        </div>

                        <div className="purchase-field">
                          <Input
                            variant="number"
                            label="Tax / VAT %"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            value={formState.taxRate}
                            onChange={(event) =>
                              handleFormChange("taxRate", event.target.value)
                            }
                          />
                        </div>

                        <div className="purchase-field">
                          <Input
                            variant="date"
                            label="Order Date *"
                            value={formState.date}
                            onChange={(event) =>
                              handleFormChange("date", event.target.value)
                            }
                            error={formErrors.date}
                          />
                        </div>
                      </div>
                    </section>

                    <section className="purchase-form-section">
                      <div className="purchase-section-head">
                        <h3>Terms & Notes</h3>
                        <p>
                          Payment terms are flexible. Use a suggestion or type your own
                          terms.
                        </p>
                      </div>

                      <div className="purchase-form-grid">
                        <div className="purchase-field">
                          <Input
                            variant="text"
                            label="Payment Terms"
                            list="payment-terms-options"
                            placeholder="Example: Net 30, Cash, 50% upfront..."
                            value={formState.paymentTerms}
                            onChange={(event) =>
                              handleFormChange("paymentTerms", event.target.value)
                            }
                          />
                          <datalist id="payment-terms-options">
                            <option value="Due on Receipt" />
                            <option value="Net 7" />
                            <option value="Net 15" />
                            <option value="Net 30" />
                            <option value="Net 45" />
                            <option value="50% upfront, 50% on delivery" />
                          </datalist>
                        </div>

                        <div className="purchase-field">
                          <Select
                            label="Currency"
                            value={formState.currency}
                            onChange={(event) =>
                              handleFormChange("currency", event.target.value)
                            }
                            options={[
                              { value: "USD", label: "USD" },
                              { value: "EUR", label: "EUR" },
                              { value: "ILS", label: "ILS" },
                            ]}
                          />
                        </div>

                        <div className="purchase-field full">
                          <Input
                            variant="text"
                            label="Warehouse"
                            placeholder="Destination warehouse"
                            value={formState.warehouse}
                            onChange={(event) =>
                              handleFormChange("warehouse", event.target.value)
                            }
                          />
                        </div>

                        <div className="purchase-field full">
                          <Textarea
                            label="Note"
                            rows={4}
                            placeholder="Write a note for this purchase..."
                            value={formState.notes}
                            onChange={(event) =>
                              handleFormChange("notes", event.target.value)
                            }
                          />
                        </div>
                      </div>
                    </section>
                  </div>

                  <aside className="purchase-order-summary">
                    <div className="purchase-summary-card">
                      <span className="summary-label">PO Preview</span>
                      <strong>
                        {editingId
                          ? rowsMap.get(editingId)?.poNumber || "PO-Preview"
                          : buildPoNumber(0)}
                      </strong>

                      <div className="summary-kv">
                        <span>Supplier</span>
                        <strong>
                          {selectedSupplier?.name ||
                            formState.newSupplierName ||
                            "Not selected"}
                        </strong>
                      </div>

                      <div className="summary-kv">
                        <span>Product</span>
                        <strong>{selectedProduct?.name || "Not selected"}</strong>
                      </div>

                      <div className="summary-kv">
                        <span>Quantity</span>
                        <strong>{formState.quantity || "0"}</strong>
                      </div>

                      <div className="summary-kv">
                        <span>Unit Price</span>
                        <strong>
                          {formState.unitPrice ? money(unitPriceValue) : "--"}
                        </strong>
                      </div>

                      <div className="summary-kv">
                        <span>Order Date</span>
                        <strong>
                          {formState.date ? formatDate(formState.date) : "--"}
                        </strong>
                      </div>

                      <div className="summary-kv">
                        <span>Payment Terms</span>
                        <strong>{formState.paymentTerms || "--"}</strong>
                      </div>

                      <div className="summary-kv">
                        <span>Currency</span>
                        <strong>{formState.currency || "--"}</strong>
                      </div>

                      <div className="summary-divider" />

                      <div className="summary-kv">
                        <span>Subtotal</span>
                        <strong>{money(subtotalValue)}</strong>
                      </div>

                      <div className="summary-kv">
                        <span>Tax</span>
                        <strong>{money(taxValue)}</strong>
                      </div>

                      <div className="summary-kv total">
                        <span>Estimated Total</span>
                        <strong>{money(totalValue)}</strong>
                      </div>

                      {(selectedSupplier || selectedProduct || formState.newSupplierName) && (
                        <div className="summary-hint">
                          {selectedSupplier && (
                            <span>
                              {selectedSupplier.email ||
                                selectedSupplier.phone ||
                                "Supplier profile ready"}
                            </span>
                          )}
                          {formState.newSupplierName && (
                            <span>New supplier will be saved globally.</span>
                          )}
                          {selectedProduct && (
                            <span>{selectedProduct.stock ?? 0} in stock now</span>
                          )}
                        </div>
                      )}
                    </div>
                  </aside>
                </div>
              </div>

      </Modal>

      <Modal
        isOpen={discardConfirmOpen}
        onClose={() => setDiscardConfirmOpen(false)}
        variant="alert"
        size="sm"
        title="Discard unsaved changes?"
        description="You have unsaved purchase information. Confirm before leaving this form."
        className="purchase-modal compact discard-confirm-modal"
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setDiscardConfirmOpen(false)}
            >
              {t.common.keepEditing}
            </Button>
            <Button variant="danger" type="button" onClick={forceCloseForm}>
              {t.common.discard}
            </Button>
          </>
        }
      >
        <div className="delete-confirm-icon">!</div>
      </Modal>

      <Modal
        isOpen={!!deleteRecord}
        onClose={() => setDeleteRecord(null)}
        variant="alert"
        size="sm"
        title={deleteRecord ? `Delete Purchase ${deleteRecord.poNumber}` : "Delete Purchase"}
        className="purchase-modal compact"
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setDeleteRecord(null)}
            >
              {t.common.cancel}
            </Button>
            <Button variant="danger" type="button" onClick={confirmDelete}>
              {t.common.delete}
            </Button>
          </>
        }
      >
        <div className="delete-box">
          <p>
            Type <strong>123</strong> to confirm deletion.
          </p>
          <Input
            variant="text"
            value={deleteCode}
            onChange={(event) => {
              setDeleteCode(event.target.value);
              setDeleteError("");
            }}
            placeholder="Type 123"
            error={deleteError || undefined}
          />
        </div>
      </Modal>

      {toast && (
        <div className="purchase-toast">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}
    </>
  );
}