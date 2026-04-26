import "./Purchases.css";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Eye,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  PackageCheck,
  Pencil,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import OverflowContent from "../components/ui/OverflowContent";
import TableFooter from "../components/ui/TableFooter";
import {
  getProducts,
  getPurchases,
  getSuppliers,
  savePurchases,
} from "../data/storage";
import type { Product, Purchase, Supplier } from "../data/types";

type PurchaseFormState = {
  supplierId: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  totalCost: string;
  date: string;
  paymentTerms: string;
  currency: string;
  taxRate: string;
  warehouse: string;
  supplierReference: string;
  internalReference: string;
  attachmentName: string;
  notes: string;
};

type ViewMode = "table" | "grid";
type PurchaseStatusView =
  | "Draft"
  | "Pending"
  | "Partially Received"
  | "Received"
  | "Cancelled";
type PaymentStatusView = "Paid" | "Partial" | "Unpaid";
type QuickStatus = "All" | PurchaseStatusView;

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
};

type FilterState = {
  supplier: string;
  status: string;
  orderDate: string;
  deliveryDate: string;
  paymentStatus: string;
};

type MenuState = {
  id: string;
  top: number;
  left: number;
  placement: "down" | "up";
};

type FormErrors = Partial<
  Record<"supplierId" | "productId" | "quantity" | "unitPrice" | "date", string>
>;

const EMPTY_FORM: PurchaseFormState = {
  supplierId: "",
  productId: "",
  quantity: "1",
  unitPrice: "",
  totalCost: "",
  date: new Date().toISOString().split("T")[0],
  paymentTerms: "Net 30",
  currency: "USD",
  taxRate: "0",
  warehouse: "Main Warehouse",
  supplierReference: "",
  internalReference: "",
  attachmentName: "",
  notes: "",
};

const EMPTY_FILTERS: FilterState = {
  supplier: "",
  status: "",
  orderDate: "",
  deliveryDate: "",
  paymentStatus: "",
};

const PAGE_SIZE_OPTIONS = [5, 10, 15];
const DELETE_CONFIRMATION_CODE = "123";
const TODAY = new Date().toISOString().split("T")[0];

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function addDays(date: string, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next.toISOString().split("T")[0];
}

function dateDifferenceLabel(date: string) {
  const diffDays = Math.ceil(
    (new Date(date).getTime() - new Date(TODAY).getTime()) / (1000 * 60 * 60 * 24)
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
    case "Unpaid":
      return "danger";
    case "Pending":
      return "info";
    case "Draft":
    default:
      return "neutral";
  }
}

function buildPoNumber(index: number) {
  return `PO-2026-${String(42 - index).padStart(4, "0")}`;
}

function getStatusFromPurchase(purchase: Purchase, index: number): PurchaseStatusView {
  if (purchase.status === "Received") {
    return index % 3 === 1 ? "Partially Received" : "Received";
  }

  if (index % 5 === 0) return "Draft";
  if (index % 4 === 0) return "Cancelled";
  return "Pending";
}

function getPaymentStatusFromPurchase(
  status: PurchaseStatusView,
  index: number
): PaymentStatusView {
  if (status === "Received") return index % 4 === 0 ? "Partial" : "Paid";
  if (status === "Partially Received") return "Partial";
  return "Unpaid";
}

function getReceivedPercent(status: PurchaseStatusView, index: number) {
  if (status === "Received") return 100;
  if (status === "Partially Received") return [42, 50, 68, 74][index % 4];
  return 0;
}

function getDonutStyle(values: number[]) {
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  let cursor = 0;
  const colors = ["#5b8def", "#f7b941", "#f59e0b", "#ef5a5a"];

  const segments = values.map((value, index) => {
    const start = (cursor / total) * 360;
    cursor += value;
    const end = (cursor / total) * 360;
    return `${colors[index]} ${start}deg ${end}deg`;
  });

  return {
    background: `conic-gradient(${segments.join(", ")})`,
  };
}

function buildRows(
  purchases: Purchase[],
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
      const paymentStatus = getPaymentStatusFromPurchase(status, index);
      const receivedPercent = getReceivedPercent(status, index);
      const receivedAmount = Number(
        ((purchase.totalCost || 0) * (receivedPercent / 100)).toFixed(2)
      );
      const deliveryDate = addDays(TODAY, deliveryOffsets[index % deliveryOffsets.length]);
      const dueMeta = dateDifferenceLabel(deliveryDate);

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
        totalAmount: purchase.totalCost || 0,
        receivedAmount,
        receivedPercent,
        status,
        paymentStatus,
        isOverdue: dueMeta.label === "Overdue",
        deliveryLabel: dueMeta.label,
        notes: purchase.notes?.trim() || "No notes",
      };
    });
}

export default function Purchases() {
  const [suppliers] = useState<Supplier[]>(() => getSuppliers());
  const [products] = useState<Product[]>(() => getProducts());
  const [purchases, setPurchases] = useState<Purchase[]>(() => getPurchases());

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [quickStatus, setQuickStatus] = useState<QuickStatus>("All");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);

  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState<PurchaseFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const [detailRecord, setDetailRecord] = useState<PurchaseRow | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<PurchaseRow | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [menuState, setMenuState] = useState<MenuState | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    savePurchases(purchases);
  }, [purchases]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!menuState) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (menuRef.current?.contains(target)) return;
      setMenuState(null);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuState(null);
    }

    function handleViewportChange() {
      setMenuState(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [menuState]);

  const rows = useMemo(() => buildRows(purchases, suppliers, products), [products, purchases, suppliers]);
  const rowsMap = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);
  const supplierProductMap = useMemo(() => {
    const activeProducts = products.filter((product) => !product.isDeleted);
    return suppliers.reduce<Record<string, Product[]>>((accumulator, supplier, index) => {
      accumulator[supplier.id] = activeProducts.filter(
        (_, productIndex) => productIndex % Math.max(1, suppliers.length) === index % Math.max(1, suppliers.length)
      );
      if (accumulator[supplier.id].length === 0) {
        accumulator[supplier.id] = activeProducts;
      }
      return accumulator;
    }, {});
  }, [products, suppliers]);

  const formProducts = useMemo(() => {
    if (!formState.supplierId) return products.filter((product) => !product.isDeleted);
    return supplierProductMap[formState.supplierId] || products.filter((product) => !product.isDeleted);
  }, [formState.supplierId, products, supplierProductMap]);

  const selectedSupplier = suppliers.find((supplier) => supplier.id === formState.supplierId);
  const selectedProduct = products.find((product) => product.id === formState.productId);
  const quantityValue = Number(formState.quantity || 0);
  const unitPriceValue = Number(formState.unitPrice || 0);
  const subtotalValue = Number((quantityValue * unitPriceValue).toFixed(2));
  const taxValue = Number(((subtotalValue * Number(formState.taxRate || 0)) / 100).toFixed(2));
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
      if (filters.paymentStatus && row.paymentStatus !== filters.paymentStatus) return false;

      if (filters.orderDate) {
        if (filters.orderDate === "thisMonth" && row.orderDate.slice(0, 7) !== TODAY.slice(0, 7)) {
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
            (new Date(row.deliveryDate).getTime() - new Date(TODAY).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays < 0 || diffDays > 7) return false;
        }
      }

      return true;
    });
  }, [filters, quickStatus, rows, searchTerm]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(filteredRows.length / rowsPerPage)));
  const visibleRows = filteredRows.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  const selectedRows = selectedIds
    .map((id) => rowsMap.get(id))
    .filter((row): row is PurchaseRow => Boolean(row));

  const totalSelectedValue = selectedRows.reduce((sum, row) => sum + row.totalAmount, 0);

  const summary = useMemo(() => {
    const totalPurchases = rows.reduce((sum, row) => sum + row.totalAmount, 0);
    const pendingRows = rows.filter((row) => row.status === "Pending" || row.status === "Draft");
    const receivedTodayRows = rows.filter((row) => row.status === "Received" && row.deliveryDate === TODAY);
    const overdueRows = rows.filter((row) => row.isOverdue && row.paymentStatus !== "Paid");

    return {
      totalPurchases,
      pendingCount: pendingRows.length,
      pendingValue: pendingRows.reduce((sum, row) => sum + row.totalAmount, 0),
      receivedTodayCount: receivedTodayRows.length,
      receivedTodayValue: receivedTodayRows.reduce((sum, row) => sum + row.totalAmount, 0),
      overdueCount: overdueRows.length,
      overdueValue: overdueRows.reduce((sum, row) => sum + row.totalAmount, 0),
    };
  }, [rows]);

  const summaryBreakdown = useMemo(() => {
    const draft = rows
      .filter((row) => row.status === "Draft")
      .reduce((sum, row) => sum + row.totalAmount, 0);
    const pending = rows
      .filter((row) => row.status === "Pending")
      .reduce((sum, row) => sum + row.totalAmount, 0);
    const partial = rows
      .filter((row) => row.status === "Partially Received")
      .reduce((sum, row) => sum + row.totalAmount, 0);
    const received = rows
      .filter((row) => row.status === "Received")
      .reduce((sum, row) => sum + row.totalAmount, 0);
    const cancelled = rows
      .filter((row) => row.status === "Cancelled")
      .reduce((sum, row) => sum + row.totalAmount, 0);

    return [
      { label: "Draft", value: draft, color: "#94a3b8" },
      { label: "Pending", value: pending, color: "#f7b941" },
      { label: "Partially Received", value: partial, color: "#f59e0b" },
      { label: "Received", value: received, color: "#5b8def" },
      { label: "Cancelled", value: cancelled, color: "#ef5a5a" },
    ];
  }, [rows]);

  const topSuppliers = useMemo(() => {
    const totals = new Map<string, number>();

    rows.forEach((row) => {
      totals.set(row.supplierName, (totals.get(row.supplierName) || 0) + row.totalAmount);
    });

    const maxValue = Math.max(...Array.from(totals.values()), 1);

    return Array.from(totals.entries())
      .map(([name, value]) => ({
        name,
        value,
        ratio: (value / summary.totalPurchases) * 100,
        bar: (value / maxValue) * 100,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [rows, summary.totalPurchases]);

  const donutStyle = getDonutStyle(summaryBreakdown.map((item) => item.value));
  const activeAdvancedCount = [filters.orderDate, filters.deliveryDate, filters.paymentStatus].filter(Boolean).length;

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setQuickStatus("All");
    setSearchTerm("");
  }

  function handleFormChange(field: keyof PurchaseFormState, value: string) {
    setFormState((current) => {
      const next = { ...current, [field]: value };

      if (field === "supplierId") {
        const allowedProducts = supplierProductMap[value] || [];
        if (next.productId && !allowedProducts.some((item) => item.id === next.productId)) {
          next.productId = "";
          next.unitPrice = "";
        }
      }

      if (field === "productId") {
        const product = products.find((item) => item.id === value);
        next.unitPrice = product ? String(product.price) : "";
      }

      if (field === "productId" || field === "quantity" || field === "unitPrice" || field === "taxRate") {
        const product = products.find(
          (item) => item.id === (field === "productId" ? value : next.productId)
        );
        const quantity = Number(field === "quantity" ? value : next.quantity || "0");
        const unitPrice = Number(
          field === "unitPrice" ? value : field === "productId" ? String(product?.price || 0) : next.unitPrice || "0"
        );
        const subtotal = quantity * unitPrice;
        const tax = (subtotal * Number(field === "taxRate" ? value : next.taxRate || "0")) / 100;
        next.totalCost = String(Number((subtotal + tax).toFixed(2)));
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
    setFormOpen(true);
  }

  function openEditModal(id: string) {
    const purchase = purchases.find((entry) => entry.id === id);
    if (!purchase) return;

    setFormMode("edit");
    setEditingId(id);
    setFormState({
      supplierId: purchase.supplierId,
      productId: purchase.productId,
      quantity: String(purchase.quantity),
      unitPrice: String(Number((purchase.totalCost / Math.max(1, purchase.quantity)).toFixed(2))),
      totalCost: String(purchase.totalCost),
      date: purchase.date,
      paymentTerms: "Net 30",
      currency: "USD",
      taxRate: "0",
      warehouse: "Main Warehouse",
      supplierReference: purchase.id,
      internalReference: buildPoNumber(0),
      attachmentName: "",
      notes: purchase.notes || "",
    });
    setFormErrors({});
    setFormOpen(true);
    setMenuState(null);
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (!formState.supplierId) nextErrors.supplierId = "Supplier is required";
    if (!formState.productId) nextErrors.productId = "Product is required";
    if (!formState.quantity || Number(formState.quantity) <= 0) nextErrors.quantity = "Enter a valid quantity";
    if (!formState.unitPrice || Number(formState.unitPrice) <= 0) nextErrors.unitPrice = "Enter a valid unit price";
    if (!formState.date) nextErrors.date = "Order date is required";

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function saveForm() {
    if (!validateForm()) return;

    const payload: Purchase = {
      id: editingId || `PUR-${Date.now()}`,
      supplierId: formState.supplierId,
      productId: formState.productId,
      quantity: Number(formState.quantity || 0),
      totalCost: Number(totalValue || 0),
      status: "Pending",
      date: formState.date,
      notes: formState.notes.trim(),
    };

    if (!payload.supplierId || !payload.productId || payload.quantity <= 0) return;

    if (formMode === "edit" && editingId) {
      setPurchases((current) => current.map((entry) => (entry.id === editingId ? payload : entry)));
      setToast("Purchase updated");
    } else {
      setPurchases((current) => [payload, ...current]);
      setToast("Purchase created");
    }

    setFormOpen(false);
  }

  function duplicatePurchase(id: string) {
    const purchase = purchases.find((entry) => entry.id === id);
    if (!purchase) return;

    setPurchases((current) => [
      {
        ...purchase,
        id: `PUR-${Date.now()}`,
        notes: purchase.notes ? `${purchase.notes} Copy` : "Copy",
      },
      ...current,
    ]);
    setMenuState(null);
    setToast("Purchase duplicated");
  }

  function markAsReceived(id: string) {
    setPurchases((current) =>
      current.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              status: "Received",
            }
          : entry
      )
    );
    setMenuState(null);
    setToast("Marked as received");
  }

  function confirmDelete() {
    if (deleteCode !== DELETE_CONFIRMATION_CODE) {
      setDeleteError("Type 123 to confirm");
      return;
    }

    if (!deleteRecord) return;

    setPurchases((current) => current.filter((entry) => entry.id !== deleteRecord.purchaseId));
    setDeleteRecord(null);
    setDeleteCode("");
    setDeleteError("");
    setToast("Purchase deleted");
  }

  function openMenu(id: string, trigger: HTMLButtonElement) {
    if (menuState?.id === id) {
      setMenuState(null);
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 220;
    const menuHeight = 248;
    const gap = 8;
    const canOpenUp = window.innerHeight - rect.bottom < menuHeight && rect.top > menuHeight;

    setMenuState({
      id,
      left: Math.min(window.innerWidth - menuWidth - 12, Math.max(12, rect.right - menuWidth)),
      top: canOpenUp ? Math.max(12, rect.top - menuHeight - gap) : rect.bottom + gap,
      placement: canOpenUp ? "up" : "down",
    });
  }

  const menuRecord = menuState ? rowsMap.get(menuState.id) ?? null : null;

  return (
    <>
      <div className="purchases-workspace">
        <section className="purchases-header-card">
          <div className="purchases-header-copy">
            <div className="page-badge">
              <ShoppingCart size={16} />
              Purchases
            </div>
            <h1>Purchases</h1>
            <p>Manage and track all your purchase orders and bills</p>
          </div>

          <div className="purchases-header-actions">
            <button className="primary-button" type="button" onClick={openAddModal}>
              <Plus size={16} />
              New Purchase
            </button>
            <button className="secondary-button" type="button" onClick={() => setToast("Import flow is ready for integration")}>
              <ArrowDownToLine size={16} />
              Import
            </button>
          </div>
        </section>

        <section className="purchase-kpi-grid">
          <article className="kpi-card">
            <div className="kpi-icon blue">
              <Receipt size={20} />
            </div>
            <div className="kpi-content">
              <span>Total Purchases</span>
              <strong>{money(summary.totalPurchases)}</strong>
              <div className="kpi-meta">
                <small>This Month</small>
                <em>+12.5% vs last month</em>
              </div>
            </div>
          </article>

          <article className="kpi-card">
            <div className="kpi-icon amber">
              <ShoppingCart size={20} />
            </div>
            <div className="kpi-content">
              <span>Pending Orders</span>
              <strong>{summary.pendingCount}</strong>
              <div className="kpi-meta">
                <small>Total Value</small>
                <em>{money(summary.pendingValue)}</em>
              </div>
            </div>
          </article>

          <article className="kpi-card">
            <div className="kpi-icon green">
              <Truck size={20} />
            </div>
            <div className="kpi-content">
              <span>Received Today</span>
              <strong>{summary.receivedTodayCount}</strong>
              <div className="kpi-meta">
                <small>Total Value</small>
                <em>{money(summary.receivedTodayValue)}</em>
              </div>
            </div>
          </article>

          <article className="kpi-card">
            <div className="kpi-icon red">
              <AlertCircle size={20} />
            </div>
            <div className="kpi-content">
              <span>Overdue Bills</span>
              <strong>{summary.overdueCount}</strong>
              <div className="kpi-meta">
                <small>Total Value</small>
                <em>{money(summary.overdueValue)}</em>
              </div>
            </div>
          </article>
        </section>

        <div className="purchase-layout">
          <section className="purchase-main-column">
            <div className={`purchase-filters-card ${showMoreFilters ? "filters-open" : ""}`}>
              <div className="purchase-toolbar">
                <label className="search-field">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search by PO number, supplier, status or product..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </label>

                <div className="toolbar-cluster">
                  <button
                    className={`toolbar-button ${showMoreFilters ? "active" : ""}`}
                    type="button"
                    onClick={() => setShowMoreFilters((current) => !current)}
                    aria-expanded={showMoreFilters}
                  >
                    <Filter size={16} />
                    Filters
                  </button>
                  <button
                    className={`toolbar-button subtle ${showMoreFilters ? "active" : ""}`}
                    type="button"
                    onClick={() => setShowMoreFilters((current) => !current)}
                    aria-expanded={showMoreFilters}
                  >
                    More Filters
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

              <div className="primary-filters">
                <label className="filter-field">
                  <span>Supplier</span>
                  <select
                    className="app-select-control"
                    value={filters.supplier}
                    onChange={(event) => setFilters((current) => ({ ...current, supplier: event.target.value }))}
                  >
                    <option value="">All Suppliers</option>
                    {supplierOptions.map((supplier) => (
                      <option key={supplier} value={supplier}>
                        {supplier}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="filter-field">
                  <span>Status</span>
                  <select
                    className="app-select-control"
                    value={filters.status}
                    onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                  >
                    <option value="">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Pending">Pending</option>
                    <option value="Partially Received">Partially Received</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </label>

                <label className="filter-field">
                  <span>Order Date</span>
                  <select
                    className="app-select-control"
                    value={filters.orderDate}
                    onChange={(event) => setFilters((current) => ({ ...current, orderDate: event.target.value }))}
                  >
                    <option value="">Any Range</option>
                    <option value="thisMonth">This Month</option>
                    <option value="last7">Last 7 Days</option>
                  </select>
                </label>

                <label className="filter-field">
                  <span>Delivery Date</span>
                  <select
                    className="app-select-control"
                    value={filters.deliveryDate}
                    onChange={(event) => setFilters((current) => ({ ...current, deliveryDate: event.target.value }))}
                  >
                    <option value="">Any Range</option>
                    <option value="thisWeek">This Week</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </label>

                <label className="filter-field">
                  <span>Payment Status</span>
                  <select
                    className="app-select-control"
                    value={filters.paymentStatus}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, paymentStatus: event.target.value }))
                    }
                  >
                    <option value="">All</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </label>

                <button className="clear-button" type="button" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>

              {showMoreFilters && (
                <div className="more-filters-panel">
                  <div className="more-filter-chip">
                    <CalendarDays size={14} />
                    This month
                  </div>
                  <div className="more-filter-chip">
                    <PackageCheck size={14} />
                    Supplier health
                  </div>
                  <div className="more-filter-chip">
                    <Building2 size={14} />
                    Linked bills
                  </div>
                </div>
              )}

              <div className="status-chip-row">
                {(["All", "Draft", "Pending", "Partially Received", "Received", "Cancelled"] as QuickStatus[]).map((status) => {
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

            <div className="purchase-table-card">
              {selectedRows.length > 0 && (
                <div className="bulk-bar">
                  <span>{selectedRows.length} selected</span>
                  <strong>{money(totalSelectedValue)}</strong>
                </div>
              )}

              {viewMode === "table" ? (
                <div className="purchase-table-wrap app-table-wrap">
                  <table className="purchase-table app-data-table">
                    <thead>
                      <tr>
                        <th>
                          <input
                            type="checkbox"
                            checked={visibleRows.length > 0 && visibleRows.every((row) => selectedIds.includes(row.id))}
                            onChange={(event) =>
                              setSelectedIds(
                                event.target.checked ? visibleRows.map((row) => row.id) : []
                              )
                            }
                          />
                        </th>
                        <th>PO Number</th>
                        <th>Supplier</th>
                        <th>Delivery Date</th>
                        <th>Total Amount</th>
                        <th>Received</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleRows.map((row) => {
                        const deliveryMeta = dateDifferenceLabel(row.deliveryDate);

                        return (
                          <tr key={row.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(row.id)}
                                onChange={() =>
                                  setSelectedIds((current) =>
                                    current.includes(row.id)
                                      ? current.filter((entry) => entry !== row.id)
                                      : [...current, row.id]
                                  )
                                }
                              />
                            </td>
                            <td>
                              <div className="po-cell app-cell-stack">
                                <strong>{row.poNumber}</strong>
                                <small>Ordered {formatDate(row.orderDate)}</small>
                                <OverflowContent
                                  title={row.poNumber}
                                  subtitle={row.supplierName}
                                  preview={row.description}
                                  content={row.description}
                                  meta={[
                                    { label: "Order date", value: formatDate(row.orderDate) },
                                    { label: "Delivery", value: formatDate(row.deliveryDate) },
                                  ]}
                                />
                              </div>
                            </td>
                            <td>
                              <div className="supplier-cell">
                                <strong>{row.supplierName}</strong>
                                <span>{row.productName}</span>
                              </div>
                            </td>
                            <td>
                              <div className="delivery-cell app-cell-stack">
                                <strong>{formatDate(row.deliveryDate)}</strong>
                                <span className={deliveryMeta.tone}>{row.deliveryLabel}</span>
                              </div>
                            </td>
                            <td className="numeric-cell">{money(row.totalAmount)}</td>
                            <td>
                              <div className="received-cell app-cell-stack">
                                <strong>{money(row.receivedAmount)}</strong>
                                <span>{row.receivedPercent}% received</span>
                              </div>
                            </td>
                            <td>
                              <div className="status-stack app-cell-stack">
                                <span className={`status-badge ${badgeTone(row.status)}`}>{row.status}</span>
                                <span className={`status-badge ${badgeTone(row.paymentStatus)}`}>
                                  {row.paymentStatus}
                                </span>
                              </div>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="action-button"
                                aria-label={`Open actions for ${row.poNumber}`}
                                onClick={(event) => openMenu(row.id, event.currentTarget)}
                              >
                                <MoreHorizontal size={16} />
                              </button>
                            </td>
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
                      <div className="purchase-grid-top">
                        <div>
                          <strong>{row.poNumber}</strong>
                          <p>{row.description}</p>
                        </div>
                        <span className={`status-badge ${badgeTone(row.status)}`}>{row.status}</span>
                      </div>
                      <div className="purchase-grid-meta">
                        <span>{row.supplierName}</span>
                        <span>{formatDate(row.deliveryDate)}</span>
                        <span>{money(row.totalAmount)}</span>
                        <span>{row.receivedPercent}% received</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}

                <TableFooter
                  className="table-footer"
                  total={filteredRows.length}
                  page={safePage}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={PAGE_SIZE_OPTIONS}
                onRowsPerPageChange={(value) => {
                  setRowsPerPage(value);
                  setPage(1);
                }}
                onPageChange={setPage}
              />
            </div>
          </section>

          <aside className="purchase-side-column">
            <section className="side-card">
              <div className="side-card-head">
                <h3>Status Mix</h3>
                <button type="button">This Month</button>
              </div>

              <div className="summary-chart-row">
                <div className="donut-chart" style={donutStyle}>
                  <div className="donut-chart-center">
                    <strong>{money(summary.totalPurchases)}</strong>
                    <span>Total Purchases</span>
                  </div>
                </div>
              </div>

              <div className="summary-breakdown">
                {summaryBreakdown.map((item) => {
                  const percent = summary.totalPurchases === 0 ? 0 : (item.value / summary.totalPurchases) * 100;
                  return (
                    <div key={item.label} className="summary-breakdown-row">
                      <div className="summary-breakdown-label">
                        <i style={{ background: item.color }} />
                        <span>{item.label}</span>
                      </div>
                      <strong>{money(item.value)}</strong>
                      <em>{percent.toFixed(1)}%</em>
                    </div>
                  );
                })}
              </div>

              <div className="summary-overdue-strip">
                <span>Overdue deliveries</span>
                <strong>
                  {summary.overdueCount} · {money(summary.overdueValue)}
                </strong>
              </div>
            </section>

            <section className="side-card">
              <div className="side-card-head">
                <h3>Top Suppliers</h3>
                <button type="button">This Month</button>
              </div>

              <div className="supplier-rank-list">
                {topSuppliers.map((supplier) => (
                  <div key={supplier.name} className="supplier-rank-item">
                    <div className="supplier-rank-top">
                      <span>{supplier.name}</span>
                      <strong>{money(supplier.value)}</strong>
                    </div>
                    <div className="supplier-rank-progress">
                      <div style={{ width: `${supplier.bar}%` }} />
                    </div>
                    <small>{supplier.ratio.toFixed(1)}%</small>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {menuState && menuRecord && createPortal(
        <div
          ref={menuRef}
          className={`purchase-actions-menu ${menuState.placement === "up" ? "upward" : ""}`}
          style={{ top: menuState.top, left: menuState.left }}
        >
          <button type="button" onClick={() => { setDetailRecord(menuRecord); setMenuState(null); }}>
            <Eye size={15} />
            View Purchase
          </button>
          <button type="button" onClick={() => openEditModal(menuRecord.purchaseId)}>
            <Pencil size={15} />
            Edit Purchase
          </button>
          <button type="button" onClick={() => markAsReceived(menuRecord.purchaseId)}>
            <CheckCircle2 size={15} />
            Mark Received
          </button>
          <button type="button" onClick={() => duplicatePurchase(menuRecord.purchaseId)}>
            <Receipt size={15} />
            Duplicate
          </button>
          <div className="menu-divider" />
          <button
            type="button"
            className="danger"
            onClick={() => {
              setDeleteRecord(menuRecord);
              setDeleteCode("");
              setDeleteError("");
              setMenuState(null);
            }}
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>,
        document.body
      )}

      {detailRecord && (
        <div className="purchase-overlay" onClick={() => setDetailRecord(null)}>
          <aside className="purchase-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <span>{detailRecord.poNumber}</span>
                <h2>{detailRecord.supplierName}</h2>
                <p>{detailRecord.description}</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setDetailRecord(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-grid">
              <div className="drawer-card">
                <h3>Overview</h3>
                <dl>
                  <div><dt>Product</dt><dd>{detailRecord.productName}</dd></div>
                  <div><dt>Order Date</dt><dd>{formatDate(detailRecord.orderDate)}</dd></div>
                  <div><dt>Delivery</dt><dd>{formatDate(detailRecord.deliveryDate)}</dd></div>
                  <div><dt>Total</dt><dd>{money(detailRecord.totalAmount)}</dd></div>
                  <div><dt>Received</dt><dd>{money(detailRecord.receivedAmount)}</dd></div>
                </dl>
              </div>

              <div className="drawer-card">
                <h3>Supplier</h3>
                <dl>
                  <div><dt>Name</dt><dd>{detailRecord.supplierName}</dd></div>
                  <div><dt>Phone</dt><dd>{detailRecord.supplierPhone}</dd></div>
                  <div><dt>Email</dt><dd>{detailRecord.supplierEmail}</dd></div>
                  <div><dt>Address</dt><dd>{detailRecord.supplierAddress}</dd></div>
                </dl>
              </div>

              <div className="drawer-card full">
                <h3>Notes</h3>
                <p>{detailRecord.notes}</p>
              </div>
            </div>
          </aside>
        </div>
      )}

      {formOpen && (
        <div className="purchase-overlay" onClick={() => setFormOpen(false)}>
          <div className="purchase-modal purchase-order-modal" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <span>{formMode === "add" ? "New Supplier Purchase" : "Edit Supplier Purchase"}</span>
                <h2>{formMode === "add" ? "Add Supplier Purchase" : "Update Supplier Purchase"}</h2>
                <p>Create a new purchase entry linked to a supplier</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setFormOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="purchase-order-layout">
              <div className="purchase-order-main">
                <section className="purchase-form-section">
                  <div className="purchase-section-head">
                    <h3>Supplier Details</h3>
                  </div>
                  <div className="purchase-form-grid">
                    <label className="purchase-field">
                      <span>Supplier *</span>
                      <select
                        className="app-select-control"
                        value={formState.supplierId}
                        onChange={(event) => handleFormChange("supplierId", event.target.value)}
                      >
                        <option value="">Choose supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.supplierId && <small className="field-error-text">{formErrors.supplierId}</small>}
                    </label>

                    <label className="purchase-field">
                      <span>Supplier Reference</span>
                      <input
                        type="text"
                        placeholder="Optional supplier reference"
                        value={formState.supplierReference}
                        onChange={(event) => handleFormChange("supplierReference", event.target.value)}
                      />
                    </label>

                    {selectedSupplier && (
                      <div className="purchase-inline-preview full">
                        <span>{selectedSupplier.name}</span>
                        <small>{selectedSupplier.email || selectedSupplier.phone || "Supplier profile available"}</small>
                      </div>
                    )}
                  </div>
                </section>

                <section className="purchase-form-section">
                  <div className="purchase-section-head">
                    <h3>Purchase Details</h3>
                  </div>
                  <div className="purchase-form-grid">
                    <label className="purchase-field">
                      <span>Product *</span>
                      <select
                        className="app-select-control"
                        value={formState.productId}
                        onChange={(event) => handleFormChange("productId", event.target.value)}
                      >
                        <option value="">Search or select product</option>
                        {formProducts.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.productId && <small className="field-error-text">{formErrors.productId}</small>}
                    </label>

                    <label className="purchase-field">
                      <span>Quantity *</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="Enter quantity"
                        value={formState.quantity}
                        onChange={(event) => handleFormChange("quantity", event.target.value)}
                      />
                      {formErrors.quantity && <small className="field-error-text">{formErrors.quantity}</small>}
                    </label>

                    <label className="purchase-field">
                      <span>Unit Price *</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Auto-filled or editable"
                        value={formState.unitPrice}
                        onChange={(event) => handleFormChange("unitPrice", event.target.value)}
                      />
                      {formErrors.unitPrice && <small className="field-error-text">{formErrors.unitPrice}</small>}
                    </label>

                    <label className="purchase-field purchase-field-readonly">
                      <span>Total Cost</span>
                      <input type="text" value={money(totalValue)} readOnly placeholder="Auto-calculated total" />
                    </label>

                    <label className="purchase-field">
                      <span>Tax / VAT</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={formState.taxRate}
                        onChange={(event) => handleFormChange("taxRate", event.target.value)}
                      />
                    </label>
                  </div>
                </section>

                <section className="purchase-form-section">
                  <div className="purchase-section-head">
                    <h3>Order Information</h3>
                  </div>
                  <div className="purchase-form-grid">
                    <label className="purchase-field">
                      <span>Order Date *</span>
                      <input
                        type="date"
                        value={formState.date}
                        onChange={(event) => handleFormChange("date", event.target.value)}
                      />
                      {formErrors.date && <small className="field-error-text">{formErrors.date}</small>}
                    </label>

                    <label className="purchase-field">
                      <span>Payment Terms</span>
                      <select
                        className="app-select-control"
                        value={formState.paymentTerms}
                        onChange={(event) => handleFormChange("paymentTerms", event.target.value)}
                      >
                        <option value="Due on Receipt">Due on Receipt</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 45">Net 45</option>
                      </select>
                    </label>

                    <label className="purchase-field">
                      <span>Currency</span>
                      <select
                        className="app-select-control"
                        value={formState.currency}
                        onChange={(event) => handleFormChange("currency", event.target.value)}
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="ILS">ILS</option>
                      </select>
                    </label>

                    <label className="purchase-field">
                      <span>Warehouse</span>
                      <input
                        type="text"
                        placeholder="Destination warehouse"
                        value={formState.warehouse}
                        onChange={(event) => handleFormChange("warehouse", event.target.value)}
                      />
                    </label>
                  </div>
                </section>

                <section className="purchase-form-section">
                  <div className="purchase-section-head">
                    <h3>Additional Information</h3>
                  </div>
                  <div className="purchase-form-grid">
                    <label className="purchase-field">
                      <span>Attachment</span>
                      <input
                        type="text"
                        placeholder="Optional file name"
                        value={formState.attachmentName}
                        onChange={(event) => handleFormChange("attachmentName", event.target.value)}
                      />
                    </label>

                    <label className="purchase-field">
                      <span>Internal Reference</span>
                      <input
                        type="text"
                        placeholder="Optional internal reference"
                        value={formState.internalReference}
                        onChange={(event) => handleFormChange("internalReference", event.target.value)}
                      />
                    </label>

                    <label className="purchase-field full">
                      <span>Notes</span>
                      <textarea
                        rows={3}
                        placeholder="Optional notes"
                        value={formState.notes}
                        onChange={(event) => handleFormChange("notes", event.target.value)}
                      />
                    </label>
                  </div>
                </section>
              </div>

              <aside className="purchase-order-summary">
                <div className="purchase-summary-card">
                  <span className="summary-label">PO Preview</span>
                  <strong>{editingId ? rowsMap.get(editingId)?.poNumber || "PO-Preview" : buildPoNumber(0)}</strong>
                  <div className="summary-kv">
                    <span>Supplier</span>
                    <strong>{selectedSupplier?.name || "Not selected"}</strong>
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
                    <strong>{formState.unitPrice ? money(unitPriceValue) : "—"}</strong>
                  </div>
                  <div className="summary-kv">
                    <span>Order Date</span>
                    <strong>{formState.date ? formatDate(formState.date) : "—"}</strong>
                  </div>
                  <div className="summary-kv">
                    <span>Payment Terms</span>
                    <strong>{formState.paymentTerms || "—"}</strong>
                  </div>
                  <div className="summary-kv">
                    <span>Currency</span>
                    <strong>{formState.currency || "—"}</strong>
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
                  {(selectedSupplier || selectedProduct) && (
                    <div className="summary-hint">
                      {selectedSupplier && <span>{selectedSupplier.email || selectedSupplier.phone || "Supplier profile ready"}</span>}
                      {selectedProduct && <span>{selectedProduct.stock} in stock now</span>}
                    </div>
                  )}
                </div>
              </aside>
            </div>

            <div className="modal-footer">
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  setFormErrors({});
                }}
              >
                Cancel
              </button>
              <button
                className="secondary-button subtle-action"
                type="button"
                onClick={() => {
                  setToast("Purchase saved as draft");
                  setFormOpen(false);
                }}
              >
                Save as Draft
              </button>
              <button className="primary-button" type="button" onClick={saveForm}>
                {formMode === "add" ? "Save Purchase" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteRecord && (
        <div className="purchase-overlay" onClick={() => setDeleteRecord(null)}>
          <div className="purchase-modal compact" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <span>Delete Purchase</span>
                <h2>{deleteRecord.poNumber}</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setDeleteRecord(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="delete-box">
              <p>Type <strong>123</strong> to confirm deletion.</p>
              <input
                type="text"
                value={deleteCode}
                onChange={(event) => {
                  setDeleteCode(event.target.value);
                  setDeleteError("");
                }}
                placeholder="Type 123"
              />
              {deleteError && <small>{deleteError}</small>}
            </div>

            <div className="modal-footer">
              <button className="secondary-button" type="button" onClick={() => setDeleteRecord(null)}>
                Cancel
              </button>
              <button className="danger-button" type="button" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="purchase-toast">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}
    </>
  );
}
