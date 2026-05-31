import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  Cpu,
  Eye,
  Headphones,
  Keyboard,
  Laptop,
  Layers,
  LayoutGrid,
  List,
  Monitor,
  MoreHorizontal,
  Mouse,
  Package,
  Pencil,
  Plus,
  Printer,
  Search,
  SlidersHorizontal,
  Smartphone,
  Tags,
  Trash2,
  Wifi,
  X,
} from "lucide-react";
import { BarcodeModal } from "../components/ui/BarcodeModal";
import "./Products.css";

import { Button } from "../components/ui/Button";
import {
  getInvoiceItems,
  getPurchases,
  getSuppliers,
} from "../data/storage";

import type { InvoiceItem, Product, Purchase, Supplier } from "../data/types";
import { useSettings } from "../context/SettingsContext";
import { formatCurrencyValue } from "../utils/displayFormatters";
import { useData } from "../context/DataContext";

type StockFilter = "" | "in" | "low" | "out";
type ViewMode = "table" | "cards";
type SortDirection = "asc" | "desc";

type SortKey =
  | "name"
  | "category"
  | "supplier"
  | "stock"
  | "purchasePrice"
  | "salePrice"
  | "margin"
  | "status";

type ProductForm = {
  id?: string;
  code: string;
  name: string;
  category: string;
  purchasePrice: string;
  salePrice: string;
  stock: string;
  minStock: string;
  supplierId: string;
  barcode: string;
  description: string;
  image: string;
};

type ProductRow = Product & {
  code: string;
  salePrice: number;
  purchasePrice: number;
  available: number;
  minStock: number;
  statusLabel: string;
  supplierId: string;
  barcode: string;
  description: string;
  image: string;
  addedAt: number;
};

type CategoryDeleteTarget = {
  name: string;
  usedCount: number;
} | null;

const DELETE_CONFIRMATION_CODE = "123";
const UNCATEGORIZED = "Uncategorized";

const CATEGORY_AR: Record<string, string> = {
  "Electronics":   "إلكترونيات",
  "Accessories":   "إكسسوارات",
  "Food":          "مواد غذائية",
  "Beverages":     "مشروبات",
  "Dairy":         "ألبان",
  "Cleaning":      "منظفات",
  "Personal Care": "عناية شخصية",
};
function localizeCat(name: string, isArabic: boolean): string {
  return isArabic ? (CATEGORY_AR[name] ?? name) : name;
}

const emptyForm: ProductForm = {
  code: "",
  name: "",
  category: "",
  purchasePrice: "",
  salePrice: "",
  stock: "",
  minStock: "5",
  supplierId: "",
  barcode: "",
  description: "",
  image: "",
};

function normalizeCategoryName(value: string) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function formatMoney(value: number) {
  return formatCurrencyValue(Number(value || 0), "ILS");
}

function getStatusLabel(available: number, minStock: number) {
  if (available <= 0) return "Out of Stock";
  if (available <= minStock) return "Low Stock";
  return "In Stock";
}

function getStatusClass(status: string) {
  if (status === "In Stock") return "in";
  if (status === "Low Stock") return "low";
  return "out";
}

function getNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getStatusRank(status: string) {
  if (status === "In Stock") return 1;
  if (status === "Low Stock") return 2;
  return 3;
}

const CAT_PALETTE = [
  { bg: "#dbeafe", color: "#2563eb" },
  { bg: "#f3e8ff", color: "#7c3aed" },
  { bg: "#dcfce7", color: "#16a34a" },
  { bg: "#ffedd5", color: "#ea580c" },
  { bg: "#fce7f3", color: "#db2777" },
  { bg: "#cffafe", color: "#0891b2" },
  { bg: "#fef9c3", color: "#ca8a04" },
  { bg: "#fee2e2", color: "#dc2626" },
];

function getCategoryColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  }
  return CAT_PALETTE[h % CAT_PALETTE.length];
}

const PROD_AVATAR_COLORS = ["#2563eb","#7c3aed","#0891b2","#059669","#d97706","#dc2626","#db2777","#65a30d"];

function getProductAvatarBg(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return PROD_AVATAR_COLORS[h % PROD_AVATAR_COLORS.length];
}

function getProductInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "?";
}

function getStockColorClass(available: number, minStock: number) {
  if (available <= 0) return "stock-out";
  if (available <= minStock) return "stock-low";
  return "stock-ok";
}

function getCategoryIcon(name: string) {
  const lc = name.toLowerCase();
  if (lc.includes("electron") || lc.includes("phone") || lc.includes("mobile") || lc.includes("هاتف")) return Smartphone;
  if (lc.includes("keyboard") || lc.includes("accessori") || lc.includes("ملحق")) return Keyboard;
  if (lc.includes("graphic") || lc.includes("gpu") || lc.includes("كرت")) return Cpu;
  if (lc.includes("peripher") || lc.includes("mouse") || lc.includes("ماوس")) return Mouse;
  if (lc.includes("monitor") || lc.includes("display") || lc.includes("screen") || lc.includes("شاشة")) return Monitor;
  if (lc.includes("laptop") || lc.includes("notebook") || lc.includes("لابتوب")) return Laptop;
  if (lc.includes("computer") || lc.includes("مكتب") || lc.includes("حاسب")) return Monitor;
  if (lc.includes("print") || lc.includes("طابعة")) return Printer;
  if (lc.includes("wifi") || lc.includes("network") || lc.includes("router")) return Wifi;
  if (lc.includes("audio") || lc.includes("headphone") || lc.includes("سماعة")) return Headphones;
  return Package;
}

function buildNextProductCode(products: Product[]) {
  const maxCodeNumber = products.reduce((max, product) => {
    const candidates = [product.id, product.code];

    const localMax = candidates.reduce((innerMax, value) => {
      const match = String(value || "").match(/^PROD-(\d+)$/i);
      return match ? Math.max(innerMax, Number(match[1])) : innerMax;
    }, max);

    return Math.max(max, localMax);
  }, 1000);

  return `PROD-${maxCodeNumber + 1}`;
}

function SortButton({
  sortKey,
  sortConfig,
  onSort,
  children,
}: {
  sortKey: SortKey;
  sortConfig: { key: SortKey; direction: SortDirection };
  onSort: (key: SortKey) => void;
  children: string;
}) {
  const label = sortConfig.key !== sortKey ? "↕" : sortConfig.direction === "asc" ? "↑" : "↓";
  return (
    <button
      type="button"
      className={`table-sort-btn ${sortConfig.key === sortKey ? "active" : ""}`}
      onClick={() => onSort(sortKey)}
    >
      <span>{children}</span>
      <span>{label}</span>
    </button>
  );
}

export default function Products() {
  const { t, isArabic } = useSettings();
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    productCategories,
    setProductCategories,
  } = useData();
  const [purchases] = useState<Purchase[]>(() => getPurchases());
  const [invoiceItems] = useState<InvoiceItem[]>(() => getInvoiceItems());
  const [suppliers] = useState<Supplier[]>(() => getSuppliers());

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const [filterCategory, setFilterCategory] = useState("");
  const [filterStock, setFilterStock] = useState<StockFilter>("");
  const [filterSupplier, setFilterSupplier] = useState("");

  const [showProductModal, setShowProductModal] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const [viewProduct, setViewProduct] = useState<ProductRow | null>(null);

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: "name",
    direction: "asc",
  });

  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const [barcodeProduct, setBarcodeProduct] = useState<ProductRow | null>(null);
  const [menuProductId, setMenuProductId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryDeleteTarget, setCategoryDeleteTarget] =
    useState<CategoryDeleteTarget>(null);
  const [categoryDeleteCode, setCategoryDeleteCode] = useState("");

  const filtersRef = useRef<HTMLDivElement | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!showFilters) return;

      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showFilters]);

  useEffect(() => {
    if (!showCategoryDropdown) return;
    function handleCategoryClose(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleCategoryClose);
    return () => document.removeEventListener("mousedown", handleCategoryClose);
  }, [showCategoryDropdown]);

  useEffect(() => {
    if (!menuProductId) return;
    function handleMenuClose(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuProductId(null);
      }
    }
    document.addEventListener("mousedown", handleMenuClose);
    return () => document.removeEventListener("mousedown", handleMenuClose);
  }, [menuProductId]);

  const supplierMap = useMemo(() => {
    const map = new Map<string, string>();

    suppliers.forEach((supplier) => {
      map.set(supplier.id, supplier.name);
    });

    return map;
  }, [suppliers]);

  const categoryUsageMap = useMemo(() => {
    const map = new Map<string, number>();

    products
      .filter((product) => !product.isDeleted)
      .forEach((product) => {
        const category = normalizeCategoryName(product.category || "");
        if (!category) return;
        map.set(category, (map.get(category) || 0) + 1);
      });

    return map;
  }, [products]);

  const productRows = useMemo<ProductRow[]>(() => {
    return products
      .filter((product) => !product.isDeleted)
      .filter((product) => String(product.name || "").trim() !== "")
      .map((product, index) => {
        const receivedQuantity = purchases
          .filter((purchase) => purchase.productId === product.id && !purchase.isDeleted)
          .reduce((sum, purchase) => sum + getNumber(purchase.quantity), 0);

        const soldQuantity = invoiceItems
          .filter((item) => item.productId === product.id)
          .reduce((sum, item) => sum + getNumber(item.quantity), 0);

        const baseStock = getNumber(product.stock);
        const available = Math.max(baseStock + receivedQuantity - soldQuantity, 0);

        const salePrice = getNumber(product.salePrice ?? product.price);
        const purchasePrice = getNumber(product.purchasePrice, salePrice * 0.7);
        const minStock = getNumber(product.minStock, 5);

        return {
          ...product,
          code: String(product.code || product.id || `PROD-${1000 + index + 1}`),
          salePrice,
          purchasePrice,
          available,
          minStock,
          statusLabel: getStatusLabel(available, minStock),
          supplierId: String(product.supplierLink || ""),
          barcode: String(product.barcode || ""),
          description: String(product.description || ""),
          image: String(product.image || ""),
          addedAt: getNumber(product.addedAt, 0),
        };
      });
  }, [products, purchases, invoiceItems]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = productRows.filter((product) => {
      if (
        filterCategory &&
        normalizeCategoryName(product.category || "").toLowerCase() !==
          filterCategory.toLowerCase()
      ) {
        return false;
      }

      if (filterSupplier && product.supplierId !== filterSupplier) {
        return false;
      }

      if (filterStock === "in" && product.available <= 0) {
        return false;
      }

      if (filterStock === "low" && product.statusLabel !== "Low Stock") {
        return false;
      }

      if (filterStock === "out" && product.statusLabel !== "Out of Stock") {
        return false;
      }

      if (!term) return true;

      const searchContent = [
        product.id,
        product.code,
        product.name,
        product.category,
        product.statusLabel,
        product.barcode,
        product.description,
        product.salePrice,
        product.purchasePrice,
      ]
        .join(" ")
        .toLowerCase();

      return searchContent.includes(term);
    });

    return [...filtered].sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;

      if (sortConfig.key === "name") {
        return a.name.localeCompare(b.name) * direction;
      }

      if (sortConfig.key === "category") {
        return String(a.category || "").localeCompare(String(b.category || "")) * direction;
      }

      if (sortConfig.key === "supplier") {
        const aSupplier = supplierMap.get(a.supplierId) || "";
        const bSupplier = supplierMap.get(b.supplierId) || "";
        return aSupplier.localeCompare(bSupplier) * direction;
      }

      if (sortConfig.key === "stock") {
        return (a.available - b.available) * direction;
      }

      if (sortConfig.key === "purchasePrice") {
        return (a.purchasePrice - b.purchasePrice) * direction;
      }

      if (sortConfig.key === "salePrice") {
        return (a.salePrice - b.salePrice) * direction;
      }

      if (sortConfig.key === "margin") {
        const aMargin = a.salePrice - a.purchasePrice;
        const bMargin = b.salePrice - b.purchasePrice;
        return (aMargin - bMargin) * direction;
      }

      if (sortConfig.key === "status") {
        return (getStatusRank(a.statusLabel) - getStatusRank(b.statusLabel)) * direction;
      }

      return 0;
    });
  }, [
    productRows,
    searchTerm,
    filterCategory,
    filterStock,
    filterSupplier,
    sortConfig,
    supplierMap,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = filteredProducts.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  const stats = useMemo(() => {
    const total = productRows.length;
    const inStock = productRows.filter((product) => product.available > 0).length;
    const lowStock = productRows.filter((product) => product.statusLabel === "Low Stock").length;
    const outOfStock = productRows.filter(
      (product) => product.statusLabel === "Out of Stock"
    ).length;

    return { total, inStock, lowStock, outOfStock };
  }, [productRows]);

  function resetForm() {
    setForm(emptyForm);
  }

  function updateSort(key: SortKey) {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction:
          key === "name" || key === "category" || key === "supplier" ? "asc" : "desc",
      };
    });
  }



  function openAddModal() {
    setForm({
      ...emptyForm,
      code: buildNextProductCode(products),
    });

    setShowProductModal(true);
  }

  function openEditModal(product: ProductRow) {
    setForm({
      id: product.id,
      code: product.code,
      name: product.name || "",
      category: product.category || "",
      purchasePrice: String(product.purchasePrice || ""),
      salePrice: String(product.salePrice || ""),
      stock: String(product.stock || ""),
      minStock: String(product.minStock || "5"),
      supplierId: product.supplierId || "",
      barcode: product.barcode || "",
      description: product.description || "",
      image: product.image || "",
    });

    setShowProductModal(true);
  }

  function closeProductModal() {
    setShowProductModal(false);
    setShowCategoryDropdown(false);
    resetForm();
  }

  function handleSaveProduct() {
    const code = form.id ? form.code.trim() : form.code.trim() || buildNextProductCode(products);
    const name = form.name.trim();
    const category = normalizeCategoryName(form.category);
    const salePrice = Number(form.salePrice);
    const purchasePrice = Number(form.purchasePrice || 0);
    const stock = Number(form.stock || 0);
    const minStock = Number(form.minStock || 5);

    if (!name || !category || Number.isNaN(salePrice)) {
      alert("Please fill name, category, and sale price.");
      return;
    }

    const duplicatedCode = products.some((product) => {
      return product.id !== form.id && String(product.code || "").trim() === code;
    });

    if (duplicatedCode) {
      alert("Product code already exists.");
      return;
    }

    const productToSave: Product = {
      id: form.id || code,
      name,
      category,
      price: salePrice,
      stock: Number.isFinite(stock) ? stock : 0,
      code,
      salePrice,
      purchasePrice: Number.isFinite(purchasePrice) ? purchasePrice : 0,
      minStock: Number.isFinite(minStock) ? minStock : 5,
      supplierId: form.supplierId,
      barcode: form.barcode.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      addedAt: form.id
        ? getNumber(products.find((product) => product.id === form.id)?.addedAt, Date.now())
        : Date.now(),
      isDeleted: false,
    } as Product;

    if (form.id) {
      updateProduct(productToSave);
    } else {
      addProduct(productToSave);
    }

    const mergedCats = Array.from(new Set([...productCategories, category])).sort((a, b) =>
      a.localeCompare(b)
    );
    setProductCategories(mergedCats);

    closeProductModal();
  }

  function requestDeleteProduct(product: ProductRow) {
    setDeleteTarget(product);
    setDeleteCode("");
  }

  function closeDeleteModal() {
    setDeleteTarget(null);
    setDeleteCode("");
  }

  function confirmDeleteProduct() {
    if (!deleteTarget) return;
    if (deleteCode.trim() !== DELETE_CONFIRMATION_CODE) return;

    deleteProduct(deleteTarget.id);

    if (viewProduct?.id === deleteTarget.id) {
      setViewProduct(null);
    }

    closeDeleteModal();
  }

  function clearFilters() {
    setSearchTerm("");
    setFilterCategory("");
    setFilterStock("");
    setFilterSupplier("");
    setPage(1);
  }

  function applyFilters() {
    setShowFilters(false);
  }

  function openCategoryModal() {
    setCategoryInput("");
    setEditingCategory(null);
    setCategoryError("");
    setCategorySearch("");
    setShowCategoryModal(true);
  }

  function closeCategoryModal() {
    setCategoryInput("");
    setEditingCategory(null);
    setCategoryError("");
    setCategorySearch("");
    setShowCategoryModal(false);
  }

  function saveCategory() {
    const nextName = normalizeCategoryName(categoryInput);

    if (!nextName) {
      setCategoryError("Category name is required.");
      return;
    }

    const duplicate = productCategories.some((category) => {
      const sameName = category.toLowerCase() === nextName.toLowerCase();
      const sameEditing =
        editingCategory && category.toLowerCase() === editingCategory.toLowerCase();

      return sameName && !sameEditing;
    });

    if (duplicate) {
      setCategoryError("Category already exists.");
      return;
    }

    if (editingCategory) {
      const nextCategories = productCategories
        .map((category) => (category === editingCategory ? nextName : category))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

      setProductCategories(nextCategories);
      products
        .filter((p) => p.category === editingCategory)
        .forEach((p) => updateProduct({ ...p, category: nextName } as Product));

      if (filterCategory === editingCategory) {
        setFilterCategory(nextName);
      }
    } else {
      const nextCategories = Array.from(new Set([...productCategories, nextName]))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

      setProductCategories(nextCategories);
    }

    setCategoryInput("");
    setEditingCategory(null);
    setCategoryError("");
  }

  function startEditCategory(category: string) {
    setEditingCategory(category);
    setCategoryInput(category);
    setCategoryError("");
  }

  function requestDeleteCategory(category: string) {
    const usedCount = categoryUsageMap.get(category) || 0;

    setCategoryDeleteTarget({
      name: category,
      usedCount,
    });

    setCategoryDeleteCode("");
  }

  function closeCategoryDeleteModal() {
    setCategoryDeleteTarget(null);
    setCategoryDeleteCode("");
  }

  function confirmDeleteCategory() {
    if (!categoryDeleteTarget) return;
    if (categoryDeleteCode.trim() !== DELETE_CONFIRMATION_CODE) return;

    const category = categoryDeleteTarget.name;

    const nextCategories = Array.from(
      new Set(productCategories.filter((item) => item !== category).concat(UNCATEGORIZED))
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    products
      .filter((p) => p.category === category)
      .forEach((p) => updateProduct({ ...p, category: UNCATEGORIZED } as Product));

    setProductCategories(nextCategories);

    if (filterCategory === category) {
      setFilterCategory("");
    }

    if (editingCategory === category) {
      setEditingCategory(null);
      setCategoryInput("");
    }

    closeCategoryDeleteModal();
  }

  const addProductLabel = t.products?.addProduct || "Add Product";
  const searchPlaceholder =
    t.products?.searchPlaceholder || "Search products, SKU, category...";

  return (
    <div className="products-page">
      {/* Title + description */}
      <div className="products-topbar">
        <div>
          <p className="products-page-desc">
            {t.layout.sectionSubtitles.products}
          </p>
        </div>
      </div>

      {/* KPI stat cards */}
      <section className="products-stats-grid">
        <article className="products-stat-card">
          <div>
            <span>{t.common?.total || "Total"}</span>
            <strong>{stats.total}</strong>
            <small>{t.products.pageTitle}</small>
          </div>
        </article>
        <article className="products-stat-card">
          <div>
            <span>{t.products?.inStock || "In Stock"}</span>
            <strong>{stats.inStock}</strong>
            <small>{t.products.pageTitle}</small>
          </div>
        </article>
        <article className="products-stat-card">
          <div>
            <span>{t.products?.low || "Low Stock"}</span>
            <strong>{stats.lowStock}</strong>
            <small>{t.products.pageTitle}</small>
          </div>
        </article>
        <article className="products-stat-card">
          <div>
            <span>{t.products?.out || "Out of Stock"}</span>
            <strong>{stats.outOfStock}</strong>
            <small>{t.products.pageTitle}</small>
          </div>
        </article>
      </section>

      {/* Results card: toolbar + table */}
      <div className="products-list-card">
        <div className="prod-list-header">
          <div className="prod-list-title-row">
            <h2 className="prod-list-heading">Product List</h2>
            <span className="prod-results-badge">{filteredProducts.length} {t.products?.recordsCount || "results"}</span>
          </div>
        </div>
        <div className="products-toolbar">
          <div className="products-search-box">
            <Search size={15} />
            <input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="products-toolbar-actions">
            <div className="filters-anchor" ref={filtersRef}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className={`filter-btn ${showFilters ? "active" : ""}`}
                onClick={() => setShowFilters((current) => !current)}
                aria-expanded={showFilters}
                leftIcon={<SlidersHorizontal size={16} />}
              >
                {t.products?.filters || "Filters"}
              </Button>

              <div className={`filters-dropdown ${showFilters ? "open" : ""}`}>
                <div className="filters-dropdown-header">
                  <div>
                    <h4>Filters</h4>
                    <p>Refine product results quickly without covering the page.</p>
                  </div>

                  <Button
                    type="button"
                    variant="icon"
                    size="sm"
                    className="filters-close-btn"
                    onClick={() => setShowFilters(false)}
                    aria-label="Close filters"
                  >
                    <X size={15} />
                  </Button>
                </div>

                <div className="filters-dropdown-body">
                  <div className="filters-mini-grid">
                    <div className="field">
                      <label>{t.products?.category || "Category"}</label>

                      <select
                        value={filterCategory}
                        onChange={(event) => setFilterCategory(event.target.value)}
                      >
                        <option value="">{t.products?.allCategories || "All Categories"}</option>
                        {productCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label>{t.products?.stock || "Stock"}</label>

                      <select
                        value={filterStock}
                        onChange={(event) =>
                          setFilterStock(event.target.value as StockFilter)
                        }
                      >
                        <option value="">{t.products?.anyStock || "Any Stock"}</option>
                        <option value="in">{t.products?.inStock || "In Stock"}</option>
                        <option value="low">{t.products?.low || "Low Stock"}</option>
                        <option value="out">{t.products?.out || "Out of Stock"}</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>{t.products?.supplier || "Supplier"}</label>

                      <select
                        value={filterSupplier}
                        onChange={(event) => setFilterSupplier(event.target.value)}
                      >
                        <option value="">{t.products?.anySupplier || "Any Supplier"}</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="filters-dropdown-actions">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="filters-reset-btn"
                      onClick={clearFilters}
                    >
                      {t.common?.reset || "Reset"}
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      className="filters-apply-btn"
                      onClick={applyFilters}
                    >
                      {t.common?.apply || "Apply"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="md"
              className="category-manage-btn"
              onClick={openCategoryModal}
              leftIcon={<Tags size={16} />}
            >
              {t.products?.manageCategories || "Categories"}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              className="add-product-btn primary"
              onClick={openAddModal}
              leftIcon={<Plus size={16} />}
            >
              {addProductLabel}
            </Button>

            <button
              type="button"
              className="view-toggle-btn"
              onClick={() =>
                setViewMode((current) => (current === "table" ? "cards" : "table"))
              }
              aria-label={viewMode === "table"
                ? t.products?.viewToggleCards || "Card View"
                : t.products?.viewToggleTable || "Table View"}
            >
              {viewMode === "table" ? <LayoutGrid size={16} /> : <List size={16} />}
            </button>
          </div>
        </div>


        {viewMode === "table" ? (
          <div className="table-wrapper compact-table-wrapper atlas-table-wrapper">
            <table className="dashboard-table compact-dashboard-table atlas-table" role="grid">
              <colgroup>
                <col />
                <col className="col-w-110" />
                <col className="col-w-110" />
                <col className="col-w-72" />
                <col className="col-currency" />
                <col className="col-currency" />
                <col className="col-currency" />
                <col className="col-w-90" />
                <col className="col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th className="col-product">
                    <SortButton sortKey="name" sortConfig={sortConfig} onSort={updateSort}>
                      {t.common?.product || "Product"}
                    </SortButton>
                  </th>

                  <th className="col-category">
                    <SortButton sortKey="category" sortConfig={sortConfig} onSort={updateSort}>
                      {t.products?.category || "Category"}
                    </SortButton>
                  </th>

                  <th className="col-supplier">
                    <SortButton sortKey="supplier" sortConfig={sortConfig} onSort={updateSort}>
                      {t.products?.supplier || "Supplier"}
                    </SortButton>
                  </th>

                  <th className="col-stock">
                    <SortButton sortKey="stock" sortConfig={sortConfig} onSort={updateSort}>
                      {t.products?.stock || "Stock"}
                    </SortButton>
                  </th>

                  <th className="col-purchase">
                    <SortButton sortKey="purchasePrice" sortConfig={sortConfig} onSort={updateSort}>
                      {t.products?.purchasePrice || "Purchase"}
                    </SortButton>
                  </th>

                  <th className="col-sale">
                    <SortButton sortKey="salePrice" sortConfig={sortConfig} onSort={updateSort}>
                      {t.products?.salePrice || "Sale"}
                    </SortButton>
                  </th>

                  <th className="col-margin">
                    <SortButton sortKey="margin" sortConfig={sortConfig} onSort={updateSort}>
                      {t.products?.margin || "Margin"}
                    </SortButton>
                  </th>

                  <th className="col-status">
                    <SortButton sortKey="status" sortConfig={sortConfig} onSort={updateSort}>
                      {t.products?.status || "Status"}
                    </SortButton>
                  </th>

                  <th className="col-actions">
                    {t.products?.actions || t.common?.actions || "Actions"}
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedRows.length > 0 ? (
                  paginatedRows.map((product) => {
                    const margin = Math.max(
                      product.salePrice - product.purchasePrice,
                      0
                    );
                    const supplierName = supplierMap.get(product.supplierId) || "—";

                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="product-cell">
                            <div
                              className="prod-avatar"
                              style={{ background: getProductAvatarBg(product.name) }}
                            >
                              {getProductInitials(product.name)}
                            </div>
                            <div className="product-name-info">
                              <div className="product-title">{product.name}</div>
                              <div className="product-sku">{product.code}</div>
                            </div>
                          </div>
                        </td>

                        <td>{localizeCat(product.category || "", isArabic) || "—"}</td>
                        <td>{supplierName}</td>

                        <td>
                          <div className="stock-number-cell">
                            <strong className={getStockColorClass(product.available, product.minStock)}>{product.available}</strong>
                          </div>
                        </td>

                        <td className="money-cell">
                          {formatMoney(product.purchasePrice)}
                        </td>

                        <td className="money-cell">
                          {formatMoney(product.salePrice)}
                        </td>

                        <td className="money-cell">
                          {formatMoney(margin)}
                        </td>

                        <td className="status-cell">
                          <span
                            className={`status-pill ${getStatusClass(
                              product.statusLabel
                            )}`}
                          >
                            {product.statusLabel}
                          </span>
                        </td>

                        <td className="actions-cell">
                          <Button
                            type="button"
                            variant="icon"
                            size="sm"
                            className="product-action-icon edit"
                            title="Edit product"
                            aria-label="Edit product"
                            onClick={() => openEditModal(product)}
                          >
                            <Pencil size={15} />
                          </Button>

                          <div
                            className="prod-menu-wrap"
                            ref={menuProductId === product.id ? menuRef : undefined}
                          >
                            <Button
                              type="button"
                              variant="icon"
                              size="sm"
                              className={`product-action-icon ${menuProductId === product.id ? "active" : ""}`}
                              title="More actions"
                              aria-label="More actions"
                              onClick={() => setMenuProductId(menuProductId === product.id ? null : product.id)}
                            >
                              <MoreHorizontal size={15} />
                            </Button>
                            {menuProductId === product.id && (
                              <div className="prod-action-menu">
                                <button type="button" onClick={() => { setViewProduct(product); setMenuProductId(null); }}>
                                  <Eye size={14} /> عرض التفاصيل
                                </button>
                                <button type="button" onClick={() => { openEditModal(product); setMenuProductId(null); }}>
                                  <Pencil size={14} /> تعديل
                                </button>
                                <button type="button" onClick={() => { setBarcodeProduct(product); setMenuProductId(null); }}>
                                  <Tags size={14} /> باركود
                                </button>
                                <button type="button" className="danger" onClick={() => { requestDeleteProduct(product); setMenuProductId(null); }}>
                                  <Trash2 size={14} /> حذف
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="empty-state-cell">
                      {t.products?.noProducts || "No matching products found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {viewMode === "table" && filteredProducts.length > 0 ? (
          <div className="prod-pagination-footer">
            <span className="prod-pagination-info">
              {`عرض ${(safePage - 1) * rowsPerPage + 1}–${Math.min(safePage * rowsPerPage, filteredProducts.length)} من ${filteredProducts.length} منتج`}
            </span>
            <div className="prod-pagination-controls">
              <Button
                type="button"
                variant="icon"
                size="sm"
                className="prod-page-btn"
                disabled={safePage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                ‹
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                  if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("…");
                  acc.push(n);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "…" ? (
                    <span key={`ellipsis-${idx}`} className="prod-page-ellipsis">…</span>
                  ) : (
                    <Button
                      key={item}
                      type="button"
                      variant="icon"
                      size="sm"
                      className={`prod-page-btn${safePage === item ? " active" : ""}`}
                      onClick={() => setPage(item as number)}
                      aria-label={`Go to page ${item}`}
                    >
                      {item}
                    </Button>
                  )
                )}
              <Button
                type="button"
                variant="icon"
                size="sm"
                className="prod-page-btn"
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                ›
              </Button>
            </div>
            <select
              className="prod-rows-select"
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
            >
              {[10, 25, 50].map(n => <option key={n} value={n}>{n}/page</option>)}
            </select>
          </div>
        ) : null}

        {viewMode === "cards" ? (
          <div className="products-grid compact-cards">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <article className="product-mini-card" key={product.id}>
                  <div className="mini-card-head">
                    <div>
                      <div className="mini-title">{product.name}</div>
                      <div className="mini-sku">{product.code}</div>
                    </div>

                    <span className={`pill ${getStatusClass(product.statusLabel)}`}>
                      {product.statusLabel}
                    </span>
                  </div>

                  <div className="mini-meta">{localizeCat(product.category || "", isArabic) || "—"}</div>

                  <div className="mini-metrics">
                    <div>
                      <span>{t.products?.stock || "Stock"}</span>
                      <strong>{product.available}</strong>
                    </div>

                    <div>
                      <span>{t.products?.sale || t.products?.salePrice || "Sale"}</span>
                      <strong>{formatMoney(product.salePrice)}</strong>
                    </div>

                    <div>
                      <span>{t.products?.purchase || t.products?.purchasePrice || "Purchase"}</span>
                      <strong>{formatMoney(product.purchasePrice)}</strong>
                    </div>

                    <div>
                      <span>{t.products?.margin || "Margin"}</span>
                      <strong>
                        {formatMoney(
                          Math.max(product.salePrice - product.purchasePrice, 0)
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="mini-actions">
                    <Button
                      type="button"
                      variant="icon"
                      size="sm"
                      className="product-action-icon view"
                      title="View product"
                      aria-label="View product"
                      onClick={() => setViewProduct(product)}
                    >
                      <Eye size={15} />
                    </Button>

                    <Button
                      type="button"
                      variant="icon"
                      size="sm"
                      className="product-action-icon edit"
                      title="Edit product"
                      aria-label="Edit product"
                      onClick={() => openEditModal(product)}
                    >
                      <Pencil size={15} />
                    </Button>

                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="product-action-icon delete"
                      title="Delete product"
                      aria-label="Delete product"
                      onClick={() => requestDeleteProduct(product)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state-box">
                {t.products?.noProducts || "No matching products found."}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {showProductModal ? (
        <div className="modal-overlay" onClick={closeProductModal}>
          <div
            className="prod-modal"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="prod-modal-header">
              <div className="prod-modal-title-block">
                <h2>{form.id ? t.common?.edit || "Edit Product" : addProductLabel}</h2>
                <p>{form.id ? "Update product details, pricing, and inventory." : "Create a new product. The product code is generated automatically."}</p>
              </div>
              <Button
                type="button"
                variant="icon"
                size="sm"
                className="prod-modal-close"
                onClick={closeProductModal}
                aria-label="Close product modal"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Scrollable body */}
            <div className="prod-modal-body">

              {/* Basic Information */}
              <div className="prod-section">
                <div className="prod-section-title">Basic Information</div>
                <div className="prod-form-row-2">
                  <div className="prod-field">
                    <label className="prod-label">Product Code</label>
                    <div className="prod-code-field">
                      <input className="prod-input" value={form.code} readOnly />
                      <span className="prod-auto-badge">Auto-generated</span>
                    </div>
                    <small className="prod-helper">Generated automatically and cannot be edited.</small>
                  </div>
                  <div className="prod-field">
                    <label className="prod-label">{t.common?.name || "Product Name"}</label>
                    <input
                      className="prod-input"
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="e.g. Wireless Mouse"
                    />
                  </div>
                </div>
                <div className="prod-form-row-2">
                  <div className="prod-field">
                    <label className="prod-label">{t.products?.category || "Category"}</label>
                    <div className="prod-cat-wrap" ref={categoryDropdownRef}>
                      <button
                        type="button"
                        className={`prod-cat-trigger ${showCategoryDropdown ? "open" : ""}`}
                        onClick={() => setShowCategoryDropdown((v) => !v)}
                      >
                        <span className={form.category ? "" : "placeholder"}>
                          {form.category || "Choose or type category"}
                        </span>
                        <ChevronDown size={15} className="prod-cat-chevron" />
                      </button>
                      {showCategoryDropdown && (
                        <div className="prod-cat-list">
                          {productCategories.length === 0 ? (
                            <div className="prod-cat-empty">No categories yet. Add some via the Categories button.</div>
                          ) : (
                            productCategories.map((cat) => {
                              const Icon = getCategoryIcon(cat);
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  className={`prod-cat-item ${form.category === cat ? "selected" : ""}`}
                                  onClick={() => {
                                    setForm((current) => ({ ...current, category: cat }));
                                    setShowCategoryDropdown(false);
                                  }}
                                >
                                  <span className="prod-cat-item-icon"><Icon size={15} /></span>
                                  {cat}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="prod-field">
                    <label className="prod-label">{t.products?.supplier || "Supplier"}</label>
                    <div className="prod-select-wrap">
                      <select
                        className="prod-input prod-select"
                        value={form.supplierId}
                        onChange={(event) => setForm((current) => ({ ...current, supplierId: event.target.value }))}
                      >
                        <option value="">No supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="prod-select-chevron" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Inventory */}
              <div className="prod-section">
                <div className="prod-section-title">Pricing &amp; Inventory</div>
                <div className="prod-form-row-2">
                  <div className="prod-field">
                    <label className="prod-label">{t.products?.purchasePrice || "Purchase Price"}</label>
                    <div className="prod-icon-input">
                      <span className="prod-icon-prefix">₪</span>
                      <input
                        className="prod-input with-prefix"
                        type="number" min="0" step="0.01"
                        value={form.purchasePrice}
                        onChange={(event) => setForm((current) => ({ ...current, purchasePrice: event.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="prod-field">
                    <label className="prod-label">{t.products?.salePrice || "Sale Price"}</label>
                    <div className="prod-icon-input">
                      <span className="prod-icon-prefix">₪</span>
                      <input
                        className="prod-input with-prefix"
                        type="number" min="0" step="0.01"
                        value={form.salePrice}
                        onChange={(event) => setForm((current) => ({ ...current, salePrice: event.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
                <div className="prod-form-row-2">
                  <div className="prod-field">
                    <label className="prod-label">{t.products?.stock || "Stock"}</label>
                    <div className="prod-icon-input">
                      <span className="prod-icon-left"><Layers size={15} /></span>
                      <input
                        className="prod-input with-icon"
                        type="number" min="0"
                        value={form.stock}
                        onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="prod-field">
                    <label className="prod-label">Low Stock Alert (Threshold)</label>
                    <div className="prod-icon-input">
                      <span className="prod-icon-left"><Bell size={15} /></span>
                      <input
                        className="prod-input with-icon"
                        type="number" min="0"
                        value={form.minStock}
                        onChange={(event) => setForm((current) => ({ ...current, minStock: event.target.value }))}
                        placeholder="5"
                      />
                    </div>
                    <small className="prod-helper">Get notified when stock reaches this level.</small>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="prod-section">
                <div className="prod-section-title">Additional Details</div>
                <div className="prod-field" style={{ marginBottom: 12 }}>
                  <label className="prod-label">Barcode</label>
                  <input
                    className="prod-input"
                    value={form.barcode}
                    onChange={(event) => setForm((current) => ({ ...current, barcode: event.target.value }))}
                    placeholder="Optional barcode or SKU"
                  />
                </div>
                <div className="prod-field">
                  <label className="prod-label">Description</label>
                  <textarea
                    className="prod-input prod-textarea"
                    rows={3}
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Optional product description"
                  />
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="prod-modal-footer">
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="prod-btn-secondary"
                onClick={closeProductModal}
              >
                {t.common?.cancel || "Cancel"}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                className="prod-btn-primary"
                onClick={handleSaveProduct}
                leftIcon={<Package size={15} />}
              >
                {t.common?.save || "Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showCategoryModal ? (
        <div className="category-modal-overlay" onClick={closeCategoryModal}>
          <div
            className="category-modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="category-modal-header">
              <div>
                <h2>Manage Categories</h2>
                <p>
                  Add, rename, or delete product categories. Renaming updates all
                  related products automatically.
                </p>
              </div>

              <Button
                type="button"
                variant="icon"
                size="sm"
                className="modal-close-btn"
                onClick={closeCategoryModal}
                aria-label="Close category modal"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="category-modal-body">
              <div className="cat-editor-card">
                <h3 className="cat-editor-title">
                  {editingCategory ? "Rename Category" : "New Category"}
                </h3>
                <div className="cat-editor-field">
                  <label className="prod-label">Category name</label>
                  <input
                    className="prod-input"
                    value={categoryInput}
                    onChange={(event) => {
                      setCategoryInput(event.target.value);
                      setCategoryError("");
                    }}
                    onKeyDown={(event) => { if (event.key === "Enter") saveCategory(); }}
                    placeholder="Enter category name"
                  />
                  {categoryError ? <p className="category-error">{categoryError}</p> : null}
                </div>
                <div className="cat-editor-actions">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="cat-add-btn"
                    onClick={saveCategory}
                    leftIcon={<Plus size={15} />}
                  >
                    {editingCategory ? "Save Rename" : "Add Category"}
                  </Button>
                  {editingCategory ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      className="cat-cancel-btn"
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryInput("");
                        setCategoryError("");
                      }}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>

              {productCategories.length > 0 && (
                <div className="category-search-wrap">
                  <Search size={14} className="category-search-icon" />
                  <input
                    className="category-search-input"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search categories…"
                    autoComplete="off"
                  />
                  {categorySearch && (
                    <Button
                      type="button"
                      variant="icon"
                      size="sm"
                      className="category-search-clear"
                      onClick={() => setCategorySearch("")}
                      aria-label="Clear search"
                    >
                      <X size={13} />
                    </Button>
                  )}
                </div>
              )}

              <div className="category-list">
                {(() => {
                  const q = categorySearch.trim().toLowerCase();
                  const filtered = q
                    ? productCategories.filter((c) => c.toLowerCase().includes(q))
                    : productCategories;

                  if (productCategories.length === 0) {
                    return <div className="category-empty-state">No categories yet. Add one above.</div>;
                  }

                  if (filtered.length === 0) {
                    return (
                      <div className="category-empty-state">
                        <Search size={20} />
                        <span>No categories match "{categorySearch}"</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="category-search-reset"
                          onClick={() => setCategorySearch("")}
                        >
                          Clear search
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <>
                      {q && (
                        <div className="category-search-meta">
                          {filtered.length} of {productCategories.length} categor{productCategories.length === 1 ? "y" : "ies"}
                        </div>
                      )}
                      {filtered.map((category) => {
                        const usedCount = categoryUsageMap.get(category) || 0;
                        const lc = category.toLowerCase();
                        const idx = q ? lc.indexOf(q) : -1;

                        const label = idx >= 0 ? (
                          <>
                            {category.slice(0, idx)}
                            <mark className="cat-highlight">{category.slice(idx, idx + q.length)}</mark>
                            {category.slice(idx + q.length)}
                          </>
                        ) : category;

                        const catColor = getCategoryColor(category);
                        const CatIcon = getCategoryIcon(category);

                        return (
                          <div className="category-list-item" key={category}>
                            <div
                              className="cat-item-icon"
                              style={{ background: catColor.bg, color: catColor.color }}
                            >
                              <CatIcon size={18} />
                            </div>
                            <div className="category-list-info">
                              <strong>{label}</strong>
                              <span>{usedCount} product{usedCount !== 1 ? "s" : ""}</span>
                            </div>
                            <div className="category-list-actions">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="category-edit-btn"
                                onClick={() => startEditCategory(category)}
                                leftIcon={<Pencil size={13} />}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                className="category-delete-btn"
                                onClick={() => requestDeleteCategory(category)}
                                leftIcon={<Trash2 size={13} />}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {categoryDeleteTarget ? (
        <div className="delete-confirm-overlay" onClick={closeCategoryDeleteModal}>
          <div
            className="delete-confirm-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-confirm-icon">!</div>

            <div>
              <h3>Delete category?</h3>
              <p>
                This will delete <strong>{categoryDeleteTarget.name}</strong>.
                {categoryDeleteTarget.usedCount > 0
                  ? ` ${categoryDeleteTarget.usedCount} product(s) will be moved to Uncategorized.`
                  : " No products currently use this category."}{" "}
                Type <strong>{DELETE_CONFIRMATION_CODE}</strong> to confirm.
              </p>
            </div>

            <label className="delete-code-field">
              <span>Confirmation Code</span>

              <input
                value={categoryDeleteCode}
                onChange={(event) => setCategoryDeleteCode(event.target.value)}
                placeholder="Type 123 to delete"
                autoFocus
              />
            </label>

            <div className="delete-confirm-actions">
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="modal-secondary-btn"
                onClick={closeCategoryDeleteModal}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="danger"
                size="md"
                className="modal-danger-btn"
                disabled={categoryDeleteCode.trim() !== DELETE_CONFIRMATION_CODE}
                onClick={confirmDeleteCategory}
              >
                Delete Category
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {viewProduct ? (
        <div className="modal-overlay" onClick={() => setViewProduct(null)}>
          <div
            className="modal-card product-view-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>{viewProduct.name}</h2>
                <p>Product details</p>
              </div>

              <Button
                type="button"
                variant="icon"
                size="sm"
                className="modal-close-btn"
                onClick={() => setViewProduct(null)}
                aria-label="Close product view"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="modal-form">
              <div className="view-detail-panel">
                <div>
                  <span>Code</span>
                  <strong>{viewProduct.code}</strong>
                </div>

                <div>
                  <span>{t.products?.category || "Category"}</span>
                  <strong>{viewProduct.category || "—"}</strong>
                </div>

                <div>
                  <span>{t.products?.purchasePrice || "Purchase"}</span>
                  <strong>{formatMoney(viewProduct.purchasePrice)}</strong>
                </div>

                <div>
                  <span>{t.products?.salePrice || "Sale"}</span>
                  <strong>{formatMoney(viewProduct.salePrice)}</strong>
                </div>

                <div>
                  <span>{t.products?.stock || "Available"}</span>
                  <strong>{viewProduct.available}</strong>
                </div>

                <div>
                  <span>{t.products?.status || "Status"}</span>
                  <strong>{viewProduct.statusLabel}</strong>
                </div>

                <div>
                  <span>{t.products?.supplier || "Supplier"}</span>
                  <strong>{supplierMap.get(viewProduct.supplierId) || "—"}</strong>
                </div>

                <div>
                  <span>Barcode</span>
                  <strong>{viewProduct.barcode || "—"}</strong>
                </div>
              </div>

              {viewProduct.description ? (
                <div className="view-description-box">
                  <h4>Description</h4>
                  <p>{viewProduct.description}</p>
                </div>
              ) : null}

              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="modal-secondary-btn"
                  onClick={() => openEditModal(viewProduct)}
                >
                  {t.common?.edit || "Edit"}
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  size="md"
                  className="modal-danger-btn"
                  onClick={() => requestDeleteProduct(viewProduct)}
                >
                  {t.common?.delete || "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="delete-confirm-overlay" onClick={closeDeleteModal}>
          <div
            className="delete-confirm-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-confirm-icon">!</div>

            <div>
              <h3>Delete product?</h3>
              <p>
                This will delete <strong>{deleteTarget.name}</strong>. To confirm
                deletion, type <strong>{DELETE_CONFIRMATION_CODE}</strong> below.
              </p>
            </div>

            <label className="delete-code-field">
              <span>Confirmation Code</span>

              <input
                value={deleteCode}
                onChange={(event) => setDeleteCode(event.target.value)}
                placeholder="Type 123 to delete"
                autoFocus
              />
            </label>

            <div className="delete-confirm-actions">
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="modal-secondary-btn"
                onClick={closeDeleteModal}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="danger"
                size="md"
                className="modal-danger-btn"
                disabled={deleteCode.trim() !== DELETE_CONFIRMATION_CODE}
                onClick={confirmDeleteProduct}
              >
                Delete Product
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {barcodeProduct && (
        <BarcodeModal
          product={barcodeProduct}
          onClose={() => setBarcodeProduct(null)}
        />
      )}
    </div>
  );
}
