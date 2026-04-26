import "./Products.css";
<<<<<<< HEAD
import React, { useEffect, useMemo, useState } from "react";
=======
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowUpDown,
  BarChart3,
  Box,
  Boxes,
  ChevronDown,
  CircleAlert,
  Copy,
  DollarSign,
  Eye,
  FolderTree,
  ImagePlus,
  PackagePlus,
  PencilLine,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  ScanLine,
  Tag,
  Trash2,
  Warehouse,
} from "lucide-react";
import OverflowContent from "../components/ui/OverflowContent";
>>>>>>> 1c472c9 (26/4/2026)
import {
  getInvoiceItems,
  getProductCategories,
  getProducts,
  getPurchases,
<<<<<<< HEAD
=======
  getSuppliers,
  saveProductCategories,
>>>>>>> 1c472c9 (26/4/2026)
  saveProducts,
  getSuppliers,
  saveProductCategories,
} from "../data/storage";
<<<<<<< HEAD
import type { Product, Purchase, InvoiceItem, Supplier } from "../data/types";
import { useSettings } from "../context/SettingsContext";

function normalizeCategoryName(value: string) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function getStatusLabel(available: number, minStock: number) {
  if (available <= 0) return "Out of Stock";
  if (available <= minStock) return "Low Stock";
  return "In Stock";
}

export default function Products() {
  const { t, isArabic } = useSettings();

  // Data sources
  const [rawProducts, setRawProducts] = useState<Product[]>(() => getProducts());
  const [categories, setCategories] = useState<string[]>(() => getProductCategories());
=======
import { calculateProductSoldQuantity } from "../data/relations";
import type { InvoiceItem, Product, ProductPricingMode, ProductType, Purchase, Supplier } from "../data/types";

type ProductForm = {
  productType: ProductType;
  code: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  barcode: string;
  purchasePrice: string;
  salePrice: string;
  pricingMode: ProductPricingMode;
  targetMargin: string;
  currency: string;
  taxClass: string;
  taxRate: string;
  stock: string;
  minStock: string;
  reorderThreshold: string;
  unit: string;
  warehouse: string;
  stockTracking: boolean;
  serialTracking: boolean;
  batchTracking: boolean;
  isActive: boolean;
  image: string;
  barcodeImage: string;
  description: string;
  tags: string;
  internalNotes: string;
  supplierLink: string;
  supplierSku: string;
  purchaseUnit: string;
  leadTimeDays: string;
  paymentTerms: string;
  incomeAccount: string;
  expenseAccount: string;
  attachments: string[];
  variantAttributes: string;
  createOpeningMovement: boolean;
};

type FormErrors = Partial<
  Record<
    | "code"
    | "name"
    | "category"
    | "purchasePrice"
    | "salePrice"
    | "targetMargin"
    | "stock"
    | "minStock"
    | "reorderThreshold"
    | "barcode"
    | "productType",
    string
  >
>;

type ProductStatusTone = "in-stock" | "low-stock" | "reorder-soon" | "out-of-stock";
type ViewMode = "grid" | "list";
type SortField =
  | "name"
  | "salePrice"
  | "purchasePrice"
  | "profit"
  | "margin"
  | "stock"
  | "status"
  | "addedAt";

type ActionMenuState = {
  productId: string;
  top: number;
  left: number;
};

type CategoryDefaults = {
  taxClass?: string;
  taxRate?: number;
  stockTracking?: boolean;
  unit?: string;
  purchaseUnit?: string;
  reorderThreshold?: number;
  minStock?: number;
  targetMargin?: number;
  warehouse?: string;
  incomeAccount?: string;
  expenseAccount?: string;
};

type ExtendedProduct = Product & {
  addedAt?: number;
};

type ProductRow = ExtendedProduct & {
  salePrice: number;
  purchasePrice: number;
  stock: number;
  available: number;
  sold: number;
  received: number;
  minStock: number;
  reorderThreshold: number;
  statusLabel: "In Stock" | "Low Stock" | "Reorder Soon" | "Out of Stock";
  statusTone: ProductStatusTone;
  profit: number;
  margin: number;
  image: string;
  code: string;
  brand: string;
  model: string;
  description: string;
  barcode: string;
  barcodeImage: string;
  taxClass: string;
  currency: string;
  taxRate: number;
  unit: string;
  purchaseUnit: string;
  warehouse: string;
  stockTracking: boolean;
  serialTracking: boolean;
  batchTracking: boolean;
  isActive: boolean;
  productType: ProductType;
  pricingMode: ProductPricingMode;
  targetMargin: number;
  tags: string[];
  internalNotes: string;
  supplierLink: string;
  supplierSku: string;
  leadTimeDays: number;
  paymentTerms: string;
  incomeAccount: string;
  expenseAccount: string;
  attachments: string[];
  variantAttributes: string;
  archived: boolean;
  purchaseCount: number;
  salesCount: number;
  inventoryValue: number;
};

type SupplierMatchInsight = {
  productName: string;
  purchasePrice: number;
  currency: string;
  purchaseUnit: string;
  supplierSku: string;
  leadTimeDays: number;
  paymentTerms: string;
};

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&w=900&q=80";
const DELETE_CONFIRMATION_CODE = "123";
const PRODUCT_DRAFT_STORAGE_KEY = "products-add-draft";
const PRODUCT_TYPE_OPTIONS: Array<{
  value: ProductType;
  label: string;
  description: string;
}> = [
  { value: "Stocked", label: "Stocked", description: "Tracked inventory item for regular sales and purchasing." },
  { value: "Service", label: "Service", description: "Non-stock service item with pricing and tax only." },
  { value: "Digital", label: "Digital", description: "Digital or downloadable product without stock or warehouse handling." },
  { value: "Bundle", label: "Bundle", description: "Grouped product that combines multiple sale-ready items into one offer." },
];
const WAREHOUSE_OPTIONS = ["Main Warehouse", "Retail Store", "Backroom", "Raw Material Store"];
const TAX_PROFILE_OPTIONS = [
  { value: "Zero Rated", rate: 0 },
  { value: "Reduced VAT", rate: 8 },
  { value: "Standard VAT", rate: 16 },
];
const CATEGORY_DEFAULTS: Record<string, CategoryDefaults> = {
  electronics: { taxClass: "Standard VAT", taxRate: 16, stockTracking: true, unit: "pcs", purchaseUnit: "pcs", reorderThreshold: 10, minStock: 5, targetMargin: 22, warehouse: "Main Warehouse", incomeAccount: "4000 Sales Revenue", expenseAccount: "5000 Cost of Goods Sold" },
  services: { taxClass: "Standard VAT", taxRate: 16, stockTracking: false, unit: "service", purchaseUnit: "service", reorderThreshold: 0, minStock: 0, targetMargin: 35, warehouse: "Main Warehouse", incomeAccount: "4100 Service Revenue", expenseAccount: "5100 Direct Service Costs" },
  packaging: { taxClass: "Reduced VAT", taxRate: 8, stockTracking: true, unit: "pack", purchaseUnit: "carton", reorderThreshold: 20, minStock: 10, targetMargin: 18, warehouse: "Backroom", incomeAccount: "4000 Sales Revenue", expenseAccount: "5200 Packaging Supplies" },
  "raw materials": { taxClass: "Reduced VAT", taxRate: 8, stockTracking: true, unit: "kg", purchaseUnit: "kg", reorderThreshold: 30, minStock: 15, targetMargin: 16, warehouse: "Raw Material Store", incomeAccount: "4200 Finished Goods Revenue", expenseAccount: "5300 Raw Materials" },
};

const EMPTY_FORM: ProductForm = {
  productType: "Stocked",
  code: "",
  name: "",
  category: "",
  brand: "",
  model: "",
  barcode: "",
  purchasePrice: "",
  salePrice: "",
  pricingMode: "fixed-price",
  targetMargin: "25",
  currency: "USD",
  taxClass: "Standard VAT",
  taxRate: "0",
  stock: "0",
  minStock: "5",
  reorderThreshold: "10",
  unit: "pcs",
  warehouse: "Main Warehouse",
  stockTracking: true,
  serialTracking: false,
  batchTracking: false,
  isActive: true,
  image: "",
  barcodeImage: "",
  description: "",
  tags: "",
  internalNotes: "",
  supplierLink: "",
  supplierSku: "",
  purchaseUnit: "pcs",
  leadTimeDays: "",
  paymentTerms: "",
  incomeAccount: "",
  expenseAccount: "",
  attachments: [],
  variantAttributes: "",
  createOpeningMovement: true,
};

function normalizeCategoryName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function formatMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function roundNumber(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function readFileAsDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normalizeProducts(products: Product[]) {
  return products.map((product, index) => {
    const extended = product as ExtendedProduct;
    const salePrice = Number(extended.salePrice ?? product.price ?? 0);
    const purchasePrice = Number(extended.purchasePrice ?? Math.max(salePrice * 0.72, 0));

    return {
      ...product,
      id: product.id || `PROD-${1000 + index + 1}`,
      price: salePrice,
      stock: Number(product.stock || 0),
      code: extended.code || product.id || `SKU-${1000 + index + 1}`,
      image: extended.image || "",
      purchasePrice,
      salePrice,
      minStock: Number(extended.minStock ?? 5),
      reorderThreshold: Number(extended.reorderThreshold ?? 10),
      description: extended.description || "",
      barcode: extended.barcode || "",
      barcodeImage: extended.barcodeImage || "",
      addedAt: Number(extended.addedAt || Date.now() - index),
      currency: extended.currency || "USD",
      taxClass: extended.taxClass || getTaxClassFromRate(extended.taxRate),
      taxRate: Number(extended.taxRate ?? 0),
      unit: extended.unit || "pcs",
      purchaseUnit: extended.purchaseUnit || extended.unit || "pcs",
      warehouse: extended.warehouse || "Main Warehouse",
      stockTracking: extended.stockTracking ?? true,
      productType: normalizeProductType(extended.productType),
      brand: extended.brand || "",
      isActive: extended.isActive ?? true,
      serialTracking: extended.serialTracking ?? false,
      batchTracking: extended.batchTracking ?? false,
      pricingMode: extended.pricingMode || "fixed-price",
      targetMargin: Number(extended.targetMargin ?? 25),
      tags: Array.isArray(extended.tags) ? extended.tags : [],
      internalNotes: extended.internalNotes || "",
      supplierLink: extended.supplierLink || "",
      supplierSku: extended.supplierSku || "",
      leadTimeDays: Number(extended.leadTimeDays ?? 0),
      paymentTerms: extended.paymentTerms || "",
      incomeAccount: extended.incomeAccount || "",
      expenseAccount: extended.expenseAccount || "",
      attachments: Array.isArray(extended.attachments) ? extended.attachments : [],
      variantAttributes: extended.variantAttributes || "",
      archived: Boolean(extended.archived),
    } as ExtendedProduct;
  });
}

function deriveStatus(available: number, minStock: number, reorderThreshold: number) {
  if (available <= 0) {
    return { label: "Out of Stock" as const, tone: "out-of-stock" as const };
  }
  if (available <= minStock) {
    return { label: "Low Stock" as const, tone: "low-stock" as const };
  }
  if (available <= reorderThreshold) {
    return { label: "Reorder Soon" as const, tone: "reorder-soon" as const };
  }
  return { label: "In Stock" as const, tone: "in-stock" as const };
}

function buildProductCode(name: string, index: number) {
  const compact = name
    .trim()
    .split(/\s+/)
    .map((part) => part.slice(0, 3).toUpperCase())
    .join("")
    .slice(0, 6);
  return `${compact || "PRD"}-${1100 + index}`;
}

function buildBarcodeSeed(index: number) {
  return `BAR${String(Date.now()).slice(-6)}${String(100 + index).slice(-3)}`;
}

function normalizeProductType(type?: ProductType): ProductType {
  if (!type) return "Stocked";
  if (type === "Stock Product" || type === "Raw Material" || type === "Finished Product" || type === "Variant Product") {
    return "Stocked";
  }
  return type;
}

function getTaxProfileRate(taxClass: string) {
  return TAX_PROFILE_OPTIONS.find((option) => option.value === taxClass)?.rate ?? 0;
}

function getTaxClassFromRate(rate?: number) {
  const normalizedRate = Number(rate ?? 0);
  return TAX_PROFILE_OPTIONS.find((option) => option.rate === normalizedRate)?.value ?? "Standard VAT";
}

function requiresInventoryFields(productType: ProductType, stockTracking: boolean) {
  return productType !== "Service" && productType !== "Digital" && stockTracking;
}

function getTypeDefaults(type: ProductType): CategoryDefaults {
  if (type === "Service") {
    return { taxClass: "Standard VAT", stockTracking: false, unit: "service", purchaseUnit: "service", reorderThreshold: 0, minStock: 0, targetMargin: 35, warehouse: "Main Warehouse", incomeAccount: "4100 Service Revenue", expenseAccount: "5100 Direct Service Costs" };
  }
  if (type === "Digital") {
    return { taxClass: "Standard VAT", stockTracking: false, unit: "license", purchaseUnit: "license", reorderThreshold: 0, minStock: 0, targetMargin: 42, warehouse: "Main Warehouse", incomeAccount: "4300 Digital Revenue", expenseAccount: "5400 Platform Costs" };
  }
  if (type === "Bundle") {
    return { taxClass: "Standard VAT", stockTracking: true, unit: "bundle", purchaseUnit: "bundle", reorderThreshold: 6, minStock: 2, targetMargin: 20, warehouse: "Retail Store", incomeAccount: "4000 Sales Revenue", expenseAccount: "5000 Cost of Goods Sold" };
  }
  return { taxClass: "Standard VAT", stockTracking: true, unit: "pcs", purchaseUnit: "pcs", reorderThreshold: 10, minStock: 5, targetMargin: 25, warehouse: "Main Warehouse", incomeAccount: "4000 Sales Revenue", expenseAccount: "5000 Cost of Goods Sold" };
}

function getCategoryDefaults(category: string, type: ProductType): CategoryDefaults {
  const normalized = category.trim().toLowerCase();
  return {
    ...getTypeDefaults(type),
    ...(CATEGORY_DEFAULTS[normalized] || {}),
  };
}

function calculateSalePrice(purchasePrice: number, target: number, mode: ProductPricingMode) {
  if (mode === "target-margin") {
    const safeRatio = Math.min(Math.max(target, 0), 95) / 100;
    return safeRatio >= 0.95 ? purchasePrice : purchasePrice / (1 - safeRatio);
  }
  if (mode === "markup") {
    return purchasePrice * (1 + Math.max(target, 0) / 100);
  }
  return purchasePrice;
}

function calculateMarkup(purchasePrice: number, salePrice: number) {
  return purchasePrice > 0 ? roundNumber(((salePrice - purchasePrice) / purchasePrice) * 100) : 0;
}

function ProductDetailsModal({
  product,
  supplierName,
  onClose,
  onPreviewImage,
}: {
  product: ProductRow | null;
  supplierName: string;
  onClose: () => void;
  onPreviewImage: (image: string) => void;
}) {
  if (!product) return null;

  return (
    <div className="modal-overlay product-sheet-overlay" onClick={onClose}>
      <div className="modal-card product-view-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">Product Overview</span>
            <h2>{product.name}</h2>
            <p>Pricing, stock health, supplier context, and operational product details.</p>
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="product-view-body">
          <div className="product-view-image-wrap">
            <img
              src={product.image || PLACEHOLDER_IMAGE}
              alt={product.name}
              className="product-view-image clickable-product-image"
              onClick={() => onPreviewImage(product.image || PLACEHOLDER_IMAGE)}
            />
          </div>

          <div className="product-view-content">
            <div className="product-view-grid">
              <div className="view-stat-card">
                <span>Product Code</span>
                <strong>{product.code}</strong>
              </div>
              <div className="view-stat-card">
                <span>Status</span>
                <strong>{product.statusLabel}</strong>
              </div>
              <div className="view-stat-card">
                <span>Purchase Price</span>
                <strong>{formatMoney(product.purchasePrice, product.currency)}</strong>
              </div>
              <div className="view-stat-card">
                <span>Sale Price</span>
                <strong>{formatMoney(product.salePrice, product.currency)}</strong>
              </div>
              <div className="view-stat-card">
                <span>Profit</span>
                <strong>{formatMoney(product.profit, product.currency)}</strong>
              </div>
              <div className="view-stat-card">
                <span>Margin</span>
                <strong>{product.margin.toFixed(1)}%</strong>
              </div>
              <div className="view-stat-card">
                <span>Current Stock</span>
                <strong>
                  {product.available} {product.unit}
                </strong>
              </div>
              <div className="view-stat-card">
                <span>Supplier</span>
                <strong>{supplierName || "Not linked"}</strong>
              </div>
              <div className="view-stat-card">
                <span>Inventory Value</span>
                <strong>{formatMoney(product.inventoryValue, product.currency)}</strong>
              </div>
              <div className="view-stat-card">
                <span>Purchase / Sales</span>
                <strong>
                  {product.purchaseCount} / {product.salesCount}
                </strong>
              </div>
            </div>

            <div className="view-description-box">
              <h4>Business Details</h4>
              <div className="view-detail-grid">
                <div>
                  <span>Category</span>
                  <strong>{product.category || "Unassigned"}</strong>
                </div>
                <div>
                  <span>Barcode</span>
                  <strong>{product.barcode || "Not provided"}</strong>
                </div>
                <div>
                  <span>Minimum Stock Alert</span>
                  <strong>{product.minStock}</strong>
                </div>
                <div>
                  <span>Reorder Threshold</span>
                  <strong>{product.reorderThreshold}</strong>
                </div>
              </div>
            </div>

            <div className="view-description-box">
              <h4>Description</h4>
              <p>{product.description || "No description added yet."}</p>
            </div>

            {product.internalNotes ? (
              <div className="view-description-box">
                <h4>Internal Notes</h4>
                <p>{product.internalNotes}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductWorkflowModal({
  title,
  description,
  form,
  errors,
  isDirty,
  canSave,
  categoryOptions,
  supplierOptions,
  supplierInsight,
  onClose,
  onOpenCategoryManager,
  onSaveDraft,
  onSubmit,
  onSaveAndAddAnother,
  onFieldChange,
  onTypeChange,
  onCategoryChange,
  onSupplierChange,
  onPricingModeChange,
  onGenerateCode,
  onGenerateBarcode,
  onScanBarcode,
  onToggleStockTracking,
  onToggleOpeningMovement,
  onImageChange,
  onAttachmentChange,
  onBarcodeImageChange,
  onPreviewImage,
}: {
  title: string;
  description: string;
  form: ProductForm;
  errors: FormErrors;
  isDirty: boolean;
  canSave: boolean;
  categoryOptions: string[];
  supplierOptions: Supplier[];
  supplierInsight: SupplierMatchInsight | null;
  onClose: () => void;
  onOpenCategoryManager: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onSaveAndAddAnother: () => void;
  onFieldChange: (field: keyof ProductForm, value: string) => void;
  onTypeChange: (value: ProductType) => void;
  onCategoryChange: (value: string) => void;
  onSupplierChange: (value: string) => void;
  onPricingModeChange: (value: ProductPricingMode) => void;
  onGenerateCode: () => void;
  onGenerateBarcode: () => void;
  onScanBarcode: () => void;
  onToggleStockTracking: () => void;
  onToggleOpeningMovement: () => void;
  onImageChange: (file: File | null) => void;
  onAttachmentChange: (files: FileList | null) => void;
  onBarcodeImageChange: (file: File | null) => void;
  onPreviewImage: (image: string) => void;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof FormErrors, boolean>>>({});
  const modalRef = useRef<HTMLDivElement | null>(null);
  const purchasePrice = Number(form.purchasePrice || 0);
  const salePrice = Number(form.salePrice || 0);
  const profit = roundNumber(salePrice - purchasePrice);
  const margin = salePrice > 0 ? roundNumber((profit / salePrice) * 100) : 0;
  const markup = calculateMarkup(purchasePrice, salePrice);
  const belowCost = salePrice > 0 && salePrice < purchasePrice;
  const linkedSupplier = supplierOptions.find((supplier) => supplier.id === form.supplierLink);
  const inventoryRelevant = form.productType !== "Service" && form.productType !== "Digital";
  const inventoryEnabled = requiresInventoryFields(form.productType, form.stockTracking);
  const targetLabel = form.pricingMode === "markup" ? "Markup %" : "Target Margin %";
  const openingInventoryValue = inventoryEnabled ? roundNumber(Number(form.stock || 0) * purchasePrice) : 0;

  const markTouched = (field: keyof FormErrors) => {
    setTouchedFields((current) => ({ ...current, [field]: true }));
  };

  const showFieldError = (field: keyof FormErrors) => Boolean(errors[field] && (submitAttempted || touchedFields[field]));

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const firstField = modalRef.current?.querySelector<HTMLElement>('input, select, textarea, button');
    firstField?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="modal-overlay product-workflow-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="modal-card product-form-modal modal-scroll-card product-workflow-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-workflow-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header modal-sticky-header product-workflow-header">
          <div>
            <div className="product-workflow-title-row">
              <span className="modal-eyebrow">Product Workflow</span>
              {isDirty ? <span className="product-draft-badge">Draft</span> : null}
            </div>
            <h2 id="product-workflow-title">{title}</h2>
            <p>{description}</p>
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close add product">
            ×
          </button>
        </div>

        <form
          className="modal-form modal-form-scroll product-workflow-form"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitAttempted(true);
            if (!canSave) return;
            onSubmit();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && event.target instanceof HTMLElement && event.target.tagName !== "TEXTAREA" && event.target.tagName !== "BUTTON") {
              event.preventDefault();
            }
          }}
        >
          <div className="workflow-steps">
            {["Core Info", "Pricing", "Inventory", "Supplier", "Media", "Advanced"].map((step) => (
              <span key={step} className="workflow-step-chip">
                {step}
              </span>
            ))}
          </div>

          <div className="product-form-layout product-workflow-layout">
            <div className="product-form-main">
              <section className="product-form-section">
                <div className="section-head">
                  <h3>Core product info</h3>
                  <p>Start with the product type so the form can reveal only the fields that matter.</p>
                </div>

                <div className="product-type-grid product-type-grid-compact">
                  {PRODUCT_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`product-type-card ${form.productType === option.value ? "active" : ""}`}
                      onClick={() => {
                        markTouched("productType");
                        onTypeChange(option.value);
                      }}
                    >
                      <strong>{option.label}</strong>
                      <span>{option.description}</span>
                    </button>
                  ))}
                </div>
                {showFieldError("productType") ? <p className="field-error">{errors.productType}</p> : null}

                <div className="modal-grid">
                  <div className="modal-grid-full">
                    <label className="modal-label">Product Name</label>
                    <input className="modal-input" type="text" placeholder="e.g. Laptop 14-inch i5" value={form.name} onChange={(event) => onFieldChange("name", event.target.value)} onBlur={() => markTouched("name")} />
                    {showFieldError("name") ? <p className="field-error">{errors.name}</p> : null}
                  </div>

                  <div>
                    <label className="modal-label">SKU / Product Code</label>
                    <div className="field-with-actions">
                      <input className="modal-input" type="text" placeholder="Auto-generated if left empty" value={form.code} onChange={(event) => onFieldChange("code", event.target.value)} onBlur={() => markTouched("code")} />
                      <button type="button" className="field-inline-btn" onClick={onGenerateCode}>
                        Generate
                      </button>
                    </div>
                    <p className="field-helper">Generated automatically, but you can still override it.</p>
                    {showFieldError("code") ? <p className="field-error">{errors.code}</p> : null}
                  </div>

                  <div className="category-field">
                    <label className="modal-label">Category</label>
                    <div className="category-select-row">
                      <select className="modal-select" value={form.category} onChange={(event) => onCategoryChange(event.target.value)} onBlur={() => markTouched("category")}>
                        <option value="">Select category</option>
                        {categoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="field-inline-btn subtle" onClick={onOpenCategoryManager}>
                        Quick create
                      </button>
                    </div>
                    <p className="field-helper">{form.category ? "Category defaults are now filling tax, unit, and stock suggestions." : "Select a category to unlock suggested tax, unit, and stock defaults."}</p>
                    {showFieldError("category") ? <p className="field-error">{errors.category}</p> : null}
                  </div>

                  <div>
                    <label className="modal-label">Brand</label>
                    <input className="modal-input" type="text" placeholder="Optional brand" value={form.brand} onChange={(event) => onFieldChange("brand", event.target.value)} />
                  </div>

                  <div>
                    <label className="modal-label">Barcode</label>
                    <div className="field-with-actions">
                      <input className="modal-input" type="text" placeholder="Scan or generate barcode" value={form.barcode} onChange={(event) => onFieldChange("barcode", event.target.value)} onBlur={() => markTouched("barcode")} />
                      <button type="button" className="field-inline-btn" onClick={onGenerateBarcode}>
                        Generate
                      </button>
                      <button type="button" className="field-inline-btn subtle" onClick={onScanBarcode}>
                        <ScanLine size={14} />
                        Scan
                      </button>
                    </div>
                    {showFieldError("barcode") ? <p className="field-error">{errors.barcode}</p> : null}
                  </div>

                  <div>
                    <label className="modal-label">Unit of Measure</label>
                    <input className="modal-input" type="text" placeholder="e.g. pcs, kg, license" value={form.unit} onChange={(event) => onFieldChange("unit", event.target.value)} />
                  </div>

                  <div className="modal-grid-full">
                    <label className="toggle-row">
                      <span>
                        <strong>{form.isActive ? "Active" : "Inactive"}</strong>
                        <small>Control whether this product is immediately available across operations.</small>
                      </span>
                      <button type="button" className={`toggle-switch ${form.isActive ? "active" : ""}`} onClick={() => onFieldChange("isActive", String(!form.isActive))}>
                        <i />
                      </button>
                    </label>
                  </div>
                </div>
              </section>

              <section className="product-form-section">
                <div className="section-head">
                  <h3>Pricing</h3>
                  <p>Purchase price, sale price, profit, and margin stay linked while you type.</p>
                </div>

                <div className="modal-grid">
                  <div>
                    <label className="modal-label">Pricing Mode</label>
                    <select className="modal-select" value={form.pricingMode} onChange={(event) => onPricingModeChange(event.target.value as ProductPricingMode)}>
                      <option value="fixed-price">Fixed sale price</option>
                      <option value="target-margin">Target margin</option>
                      <option value="markup">Markup</option>
                    </select>
                  </div>

                  <div>
                    <label className="modal-label">Tax Class / VAT</label>
                    <select className="modal-select" value={form.taxClass} onChange={(event) => onFieldChange("taxClass", event.target.value)}>
                      {TAX_PROFILE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="modal-label">Purchase Price</label>
                    <input className="modal-input" type="number" min="0" step="0.01" placeholder="Enter purchase price" value={form.purchasePrice} onChange={(event) => onFieldChange("purchasePrice", event.target.value)} onBlur={() => markTouched("purchasePrice")} />
                    {showFieldError("purchasePrice") ? <p className="field-error">{errors.purchasePrice}</p> : null}
                  </div>

                  {form.pricingMode !== "fixed-price" ? (
                    <div>
                      <label className="modal-label">{targetLabel}</label>
                      <input className="modal-input" type="number" min="0" step="0.01" placeholder={`Enter ${targetLabel.toLowerCase()}`} value={form.targetMargin} onChange={(event) => onFieldChange("targetMargin", event.target.value)} onBlur={() => markTouched("targetMargin")} />
                      {showFieldError("targetMargin") ? <p className="field-error">{errors.targetMargin}</p> : null}
                    </div>
                  ) : null}

                  <div>
                    <label className="modal-label">Sale Price</label>
                    <input className="modal-input" type="number" min="0" step="0.01" placeholder={form.pricingMode === "fixed-price" ? "Enter sale price" : "Auto-calculated from pricing mode"} value={form.salePrice} onChange={(event) => onFieldChange("salePrice", event.target.value)} readOnly={form.pricingMode !== "fixed-price"} onBlur={() => markTouched("salePrice")} />
                    {showFieldError("salePrice") ? <p className="field-error">{errors.salePrice}</p> : null}
                    {belowCost ? <p className="field-warning">Sale price is below purchase price. Review the pricing before saving.</p> : null}
                  </div>

                  <div>
                    <label className="modal-label">Profit</label>
                    <input className="modal-input readonly-input" type="text" readOnly value={formatMoney(profit, form.currency)} />
                  </div>

                  <div>
                    <label className="modal-label">Margin %</label>
                    <input className="modal-input readonly-input" type="text" readOnly value={`${margin.toFixed(1)}%`} />
                    {form.pricingMode === "markup" ? <p className="field-helper">Current markup: {markup.toFixed(1)}%</p> : null}
                  </div>
                </div>
              </section>

              {inventoryRelevant ? (
                <section className="product-form-section">
                  <div className="section-head">
                    <h3>Inventory</h3>
                    <p>Inventory fields are only shown for products that actually need stock control.</p>
                  </div>

                  <div className="modal-grid">
                    <div className="modal-grid-full">
                      <label className="toggle-row">
                        <span>
                          <strong>Track inventory</strong>
                          <small>Disable when this product should not create stock movements.</small>
                        </span>
                        <button type="button" className={`toggle-switch ${form.stockTracking ? "active" : ""}`} onClick={onToggleStockTracking}>
                          <i />
                        </button>
                      </label>
                    </div>

                    {inventoryEnabled ? (
                      <>
                        <div>
                          <label className="modal-label">Opening Stock</label>
                          <input className="modal-input" type="number" min="0" step="1" placeholder="Quantity available at product creation" value={form.stock} onChange={(event) => onFieldChange("stock", event.target.value)} onBlur={() => markTouched("stock")} />
                          {showFieldError("stock") ? <p className="field-error">{errors.stock}</p> : null}
                        </div>

                        <div>
                          <label className="modal-label">Warehouse / Location</label>
                          <select className="modal-select" value={form.warehouse} onChange={(event) => onFieldChange("warehouse", event.target.value)}>
                            {WAREHOUSE_OPTIONS.map((warehouse) => (
                              <option key={warehouse} value={warehouse}>
                                {warehouse}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="modal-label">Reorder Point</label>
                          <input className="modal-input" type="number" min="0" step="1" placeholder="When replenishment should start" value={form.reorderThreshold} onChange={(event) => onFieldChange("reorderThreshold", event.target.value)} onBlur={() => markTouched("reorderThreshold")} />
                          {showFieldError("reorderThreshold") ? <p className="field-error">{errors.reorderThreshold}</p> : null}
                        </div>

                        <div>
                          <label className="modal-label">Min Stock Alert</label>
                          <input className="modal-input" type="number" min="0" step="1" placeholder="Critical low-stock threshold" value={form.minStock} onChange={(event) => onFieldChange("minStock", event.target.value)} onBlur={() => markTouched("minStock")} />
                          {showFieldError("minStock") ? <p className="field-error">{errors.minStock}</p> : null}
                        </div>

                        <div className="modal-grid-full inventory-tracking-grid">
                          <label className="toggle-row">
                            <span>
                              <strong>Track serial numbers</strong>
                              <small>Enable when each unit needs unique serial tracking.</small>
                            </span>
                            <button type="button" className={`toggle-switch ${form.serialTracking ? "active" : ""}`} onClick={() => onFieldChange("serialTracking", String(!form.serialTracking))}>
                              <i />
                            </button>
                          </label>

                          <label className="toggle-row">
                            <span>
                              <strong>Track batch / expiry</strong>
                              <small>Enable for batch-controlled or expiry-sensitive items.</small>
                            </span>
                            <button type="button" className={`toggle-switch ${form.batchTracking ? "active" : ""}`} onClick={() => onFieldChange("batchTracking", String(!form.batchTracking))}>
                              <i />
                            </button>
                          </label>
                        </div>

                        {Number(form.stock || 0) > 0 ? (
                          <div className="modal-grid-full">
                            <label className="toggle-row">
                              <span>
                                <strong>Create opening inventory entry</strong>
                                <small>Opening inventory value: {formatMoney(openingInventoryValue, form.currency)}</small>
                              </span>
                              <button type="button" className={`toggle-switch ${form.createOpeningMovement ? "active" : ""}`} onClick={onToggleOpeningMovement}>
                                <i />
                              </button>
                            </label>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="workflow-inline-note compact">
                        <strong>Inventory is currently off</strong>
                        <span>Opening stock, warehouse, and reorder settings stay hidden until tracking is enabled again.</span>
                      </div>
                    )}
                  </div>
                </section>
              ) : null}

              <section className="product-form-section">
                <div className="section-head">
                  <h3>Supplier linkage</h3>
                  <p>Supplier selection can reduce repeated cost entry by pulling purchasing defaults and prior pricing.</p>
                </div>

                <div className="modal-grid">
                  <div>
                    <label className="modal-label">Preferred Supplier</label>
                    <select className="modal-select" value={form.supplierLink} onChange={(event) => onSupplierChange(event.target.value)}>
                      <option value="">Used for future purchase suggestions</option>
                      {supplierOptions.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="modal-label">Supplier Product Code</label>
                    <input className="modal-input" type="text" placeholder="Optional supplier product code" value={form.supplierSku} onChange={(event) => onFieldChange("supplierSku", event.target.value)} />
                  </div>

                  <div>
                    <label className="modal-label">Last Purchase Cost</label>
                    <input className="modal-input readonly-input" type="text" readOnly value={supplierInsight ? formatMoney(supplierInsight.purchasePrice, supplierInsight.currency) : "No prior supplier match"} />
                  </div>

                  <div>
                    <label className="modal-label">Supplier Lead Time</label>
                    <input className="modal-input" type="number" min="0" step="1" placeholder="Expected lead time in days" value={form.leadTimeDays} onChange={(event) => onFieldChange("leadTimeDays", event.target.value)} />
                  </div>

                  <div>
                    <label className="modal-label">Currency</label>
                    <select className="modal-select" value={form.currency} onChange={(event) => onFieldChange("currency", event.target.value)}>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="ILS">ILS</option>
                    </select>
                  </div>

                  <div>
                    <label className="modal-label">Payment Terms</label>
                    <input className="modal-input" type="text" placeholder="Autofill when supplier is selected" value={form.paymentTerms} onChange={(event) => onFieldChange("paymentTerms", event.target.value)} />
                  </div>
                </div>

                {linkedSupplier ? (
                  <div className="workflow-inline-note">
                    <strong>{linkedSupplier.name}</strong>
                    <span>{supplierInsight ? `Known supplier defaults were found from ${supplierInsight.productName}. Cost, currency, unit, and terms were suggested automatically.` : "Supplier selected. Currency, terms, and purchasing defaults can now stay aligned with this vendor."}</span>
                  </div>
                ) : null}
              </section>

              <section className="product-form-section">
                <div className="section-head">
                  <h3>Media and extras</h3>
                  <p>Keep media lightweight. A missing image never blocks product creation.</p>
                </div>

                <div className="media-grid compact-media-grid">
                  <div className="compact-preview-card">
                    <img src={form.image || PLACEHOLDER_IMAGE} alt={form.name || "Product preview"} className="compact-preview-image clickable-product-image" onClick={() => onPreviewImage(form.image || PLACEHOLDER_IMAGE)} />
                    <div className="media-actions-row">
                      <label className="upload-image-btn compact">
                        <ImagePlus size={15} />
                        Upload image
                        <input hidden type="file" accept="image/*" onChange={(event) => onImageChange(event.target.files?.[0] || null)} />
                      </label>
                      <button type="button" className="remove-image-btn compact" onClick={() => onFieldChange("image", "")}>
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="compact-preview-card secondary">
                    <div className="barcode-preview-card">
                      {form.barcodeImage ? (
                        <img src={form.barcodeImage} alt={form.barcode || "Barcode"} className="barcode-preview-image" />
                      ) : (
                        <div className="barcode-placeholder">
                          <Tag size={18} />
                          <span>Barcode image optional</span>
                        </div>
                      )}
                    </div>
                    <div className="media-actions-row">
                      <label className="upload-image-btn compact">
                        <ImagePlus size={15} />
                        Barcode image
                        <input hidden type="file" accept="image/*" onChange={(event) => onBarcodeImageChange(event.target.files?.[0] || null)} />
                      </label>
                      <button type="button" className="remove-image-btn compact" onClick={() => onFieldChange("barcodeImage", "")}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-grid">
                  <div className="modal-grid-full">
                    <label className="modal-label">Notes</label>
                    <textarea className="modal-input product-textarea" rows={3} placeholder="Optional product notes" value={form.description} onChange={(event) => onFieldChange("description", event.target.value)} />
                  </div>

                  <div className="modal-grid-full">
                    <label className="modal-label">Attachments</label>
                    <label className="attachment-dropzone">
                      <input hidden type="file" multiple onChange={(event) => onAttachmentChange(event.target.files)} />
                      <span>Upload optional attachments</span>
                      <small>{form.attachments.length ? `${form.attachments.length} file(s) selected` : "PDFs, images, or reference files"}</small>
                    </label>
                  </div>
                </div>
              </section>

              <section className="product-form-section">
                <button type="button" className="advanced-toggle" onClick={() => setAdvancedOpen((current) => !current)}>
                  <span>Advanced Options</span>
                  <ChevronDown size={16} className={advancedOpen ? "open" : ""} />
                </button>

                {advancedOpen ? (
                  <div className="advanced-section-body">
                    <div className="modal-grid">
                      <div className="modal-grid-full">
                        <div className="workflow-inline-note compact">
                          <strong>Use advanced details only when needed</strong>
                          <span>These fields support accounting mapping and internal product notes without slowing down the core workflow.</span>
                        </div>
                      </div>

                      <div>
                        <label className="modal-label">Tags</label>
                        <input className="modal-input" type="text" placeholder="Seasonal, Featured, POS" value={form.tags} onChange={(event) => onFieldChange("tags", event.target.value)} />
                      </div>

                      <div>
                        <label className="modal-label">Income Account</label>
                        <input className="modal-input" type="text" placeholder="Suggested from category" value={form.incomeAccount} onChange={(event) => onFieldChange("incomeAccount", event.target.value)} />
                      </div>

                      <div>
                        <label className="modal-label">Expense Account</label>
                        <input className="modal-input" type="text" placeholder="Suggested from category" value={form.expenseAccount} onChange={(event) => onFieldChange("expenseAccount", event.target.value)} />
                      </div>

                      <div className="modal-grid-full">
                        <label className="modal-label">Internal Notes</label>
                        <textarea className="modal-input product-textarea" rows={3} placeholder="Internal operational notes" value={form.internalNotes} onChange={(event) => onFieldChange("internalNotes", event.target.value)} />
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
            </div>

            <aside className="product-workflow-summary">
              <div className="product-summary-strip product-summary-strip-sidebar">
                <div className="summary-inline-item">
                  <span>SKU</span>
                  <strong>{form.code || "Auto-generated"}</strong>
                </div>
                <div className="summary-inline-item">
                  <span>Category</span>
                  <strong>{form.category || "Pending"}</strong>
                </div>
                <div className="summary-inline-item">
                  <span>Sale Price</span>
                  <strong>{formatMoney(salePrice, form.currency)}</strong>
                </div>
                <div className="summary-inline-item">
                  <span>Purchase Price</span>
                  <strong>{formatMoney(purchasePrice, form.currency)}</strong>
                </div>
                <div className="summary-inline-item">
                  <span>Profit</span>
                  <strong>{formatMoney(profit, form.currency)}</strong>
                </div>
                <div className="summary-inline-item">
                  <span>Margin</span>
                  <strong>{margin.toFixed(1)}%</strong>
                </div>
                <div className="summary-inline-item">
                  <span>Opening Stock</span>
                  <strong>{inventoryEnabled ? `${form.stock || "0"} ${form.unit}` : "Not tracked"}</strong>
                </div>
              </div>
            </aside>
          </div>

          <div className="modal-actions modal-sticky-actions product-workflow-footer">
            <button type="button" className="modal-secondary-btn ghost-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="modal-secondary-btn tertiary-btn" onClick={onSaveDraft}>
              Save Draft
            </button>
            <button
              type="button"
              className="modal-secondary-btn"
              onClick={() => {
                setSubmitAttempted(true);
                if (!canSave) return;
                onSaveAndAddAnother();
              }}
            >
              Save & Add Another
            </button>
            <button type="submit" className="modal-primary-btn">
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function ProductCard({
  product,
  onOpenMenu,
  onView,
  onPreviewImage,
}: {
  product: ProductRow;
  onOpenMenu: (productId: string, trigger: HTMLButtonElement) => void;
  onView: (product: ProductRow) => void;
  onPreviewImage: (image: string) => void;
}) {
  return (
    <article className="product-card">
      <div className="product-card-media">
        <img
          src={product.image || PLACEHOLDER_IMAGE}
          alt={product.name}
          className="product-card-image clickable-product-image"
          onClick={(event) => {
            event.stopPropagation();
            onPreviewImage(product.image || PLACEHOLDER_IMAGE);
          }}
        />
        <div className="product-card-topbar">
          <span className={`product-status ${product.statusTone}`}>{product.statusLabel}</span>
          <button
            type="button"
            className="product-menu-btn"
            onClick={(event) => {
              event.stopPropagation();
              onOpenMenu(product.id, event.currentTarget);
            }}
            aria-label="Open product actions"
          >
            ⋯
          </button>
        </div>
      </div>

      <div className="product-card-body" onClick={() => onView(product)}>
        <div className="product-card-head">
          <div>
            <h3>{product.name}</h3>
            <p>{product.code}</p>
          </div>
          <div className="stock-health-pill">
            <Warehouse size={14} />
            <span>{product.available} {product.unit}</span>
          </div>
        </div>

        <div className="product-price-main">
          <strong>{formatMoney(product.salePrice, product.currency)}</strong>
          <span>Sale Price</span>
        </div>

        <div className="product-card-metrics">
          <div>
            <small>Purchase Price</small>
            <strong>{formatMoney(product.purchasePrice, product.currency)}</strong>
          </div>
          <div>
            <small>Profit</small>
            <strong>{formatMoney(product.profit, product.currency)}</strong>
          </div>
          <div>
            <small>Margin %</small>
            <strong>{product.margin.toFixed(1)}%</strong>
          </div>
          <div>
            <small>Category</small>
            <strong>{product.category || "Unassigned"}</strong>
          </div>
        </div>

        <div className="product-card-footer">
          <div className="product-meta-row">
            <span>Current Stock</span>
            <strong>{product.available} {product.unit}</strong>
          </div>
          <button type="button" className="view-inline-btn" onClick={(event) => { event.stopPropagation(); onView(product); }}>
            <Eye size={14} />
            Open
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductTable({
  products,
  onSort,
  onView,
  onOpenMenu,
}: {
  products: ProductRow[];
  onSort: (field: SortField) => void;
  onView: (product: ProductRow) => void;
  onOpenMenu: (productId: string, trigger: HTMLButtonElement) => void;
}) {
  return (
    <div className="products-table-wrap app-table-wrap">
      <table className="products-table app-data-table">
        <thead>
          <tr>
            <th>
              <button type="button" className="table-sort-btn" onClick={() => onSort("name")}>
                Product <ArrowUpDown size={13} />
              </button>
            </th>
            <th>
              <button type="button" className="table-sort-btn" onClick={() => onSort("name")}>
                Code / SKU <ArrowUpDown size={13} />
              </button>
            </th>
            <th>Category</th>
            <th>
              <button type="button" className="table-sort-btn" onClick={() => onSort("purchasePrice")}>
                Purchase Price <ArrowUpDown size={13} />
              </button>
            </th>
            <th>
              <button type="button" className="table-sort-btn" onClick={() => onSort("salePrice")}>
                Sale Price <ArrowUpDown size={13} />
              </button>
            </th>
            <th>
              <button type="button" className="table-sort-btn" onClick={() => onSort("profit")}>
                Profit <ArrowUpDown size={13} />
              </button>
            </th>
            <th>
              <button type="button" className="table-sort-btn" onClick={() => onSort("stock")}>
                Stock <ArrowUpDown size={13} />
              </button>
            </th>
            <th>
              <button type="button" className="table-sort-btn" onClick={() => onSort("status")}>
                Status <ArrowUpDown size={13} />
              </button>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} onClick={() => onView(product)}>
              <td>
                <div className="table-product-cell app-cell-stack">
                  <strong>{product.name}</strong>
                  <OverflowContent
                    preview={product.description || "Operational product record"}
                    title={`${product.name} details`}
                    content={product.description || "No product description added yet."}
                  />
                </div>
              </td>
              <td>
                <div className="app-cell-stack">
                  <strong className="monospace-cell">{product.code}</strong>
                  <small>{product.barcode || "No barcode"}</small>
                </div>
              </td>
              <td>
                <div className="app-cell-stack">
                  <strong>{product.category || "Unassigned"}</strong>
                  <small>{product.supplierLink ? "Linked supplier" : "No supplier link"}</small>
                </div>
              </td>
              <td>{formatMoney(product.purchasePrice, product.currency)}</td>
              <td className="strong-value">{formatMoney(product.salePrice, product.currency)}</td>
              <td>
                <div className="app-cell-stack">
                  <strong>{formatMoney(product.profit, product.currency)}</strong>
                  <small>{product.margin.toFixed(1)}% margin</small>
                </div>
              </td>
              <td className="strong-value">
                <div className="app-cell-stack">
                  <strong>
                    {product.available} {product.unit}
                  </strong>
                  <small>Min {product.minStock}</small>
                </div>
              </td>
              <td>
                <span className={`product-status ${product.statusTone}`}>{product.statusLabel}</span>
              </td>
              <td>
                <div className="row-actions">
                  <button
                    type="button"
                    className="row-view-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      onView(product);
                    }}
                  >
                    <Eye size={14} />
                    Open
                  </button>
                  <button
                    type="button"
                    className="row-menu-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenMenu(product.id, event.currentTarget);
                    }}
                  >
                    ⋯
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryManagerModal({
  open,
  categories,
  onClose,
  onAdd,
  onDelete,
}: {
  open: boolean;
  categories: string[];
  onClose: () => void;
  onAdd: (value: string) => void;
  onDelete: (value: string) => void;
}) {
  const [newCategory, setNewCategory] = useState("");
  const [deleteTarget, setDeleteTarget] = useState("");
  const handleClose = () => {
    setNewCategory("");
    setDeleteTarget("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-card category-manager-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">Category Control</span>
            <h2>Manage Categories</h2>
            <p>Add or remove categories used across product records.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-form">
          <div className="category-manager-layout">
            <section className="product-form-section">
              <div className="section-head">
                <h3>Add Category</h3>
                <p>Create a new category available immediately in product forms.</p>
              </div>
              <input
                className="modal-input"
                type="text"
                placeholder="Enter category name"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
              />
              <button
                type="button"
                className="modal-primary-btn full-width-btn"
                onClick={() => {
                  onAdd(newCategory);
                  setNewCategory("");
                }}
              >
                Add Category
              </button>
            </section>

            <section className="product-form-section">
              <div className="section-head">
                <h3>Current Categories</h3>
                <p>Remove categories that are no longer needed.</p>
              </div>
              <div className="category-list">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`category-item ${deleteTarget === category ? "active" : ""}`}
                    onClick={() => setDeleteTarget(category)}
                  >
                    <span>{category}</span>
                    <FolderTree size={15} />
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="modal-danger-btn full-width-btn"
                disabled={!deleteTarget}
                onClick={() => {
                  if (!deleteTarget) return;
                  onDelete(deleteTarget);
                  setDeleteTarget("");
                }}
              >
                Delete Selected Category
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteProductModal({
  product,
  code,
  error,
  onCodeChange,
  onClose,
  onConfirm,
}: {
  product: ProductRow | null;
  code: string;
  error: string;
  onCodeChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!product) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card compact-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Delete Product</h2>
            <p>Type 123 to confirm deletion of this product record.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-form">
          <div className="delete-warning-box">
            <CircleAlert size={18} />
            <div>
              <strong>{product.name}</strong>
              <p>This action removes the product from the active workspace.</p>
            </div>
          </div>

          <input
            className="modal-input"
            type="text"
            placeholder="Type 123"
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
          />
          {error && <p className="field-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="modal-secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="modal-danger-btn" onClick={onConfirm}>
              Delete Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImagePreviewModal({
  image,
  onClose,
}: {
  image: string | null;
  onClose: () => void;
}) {
  if (!image) return null;

  return (
    <div className="image-lightbox-overlay" onClick={onClose}>
      <div className="image-lightbox-card" onClick={(event) => event.stopPropagation()}>
        <img src={image} alt="Preview" className="image-lightbox-full" />
        <button type="button" className="image-lightbox-close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>(() => normalizeProducts(getProducts()));
  const [categories, setCategories] = useState<string[]>(() => {
    const stored = getProductCategories();
    const derived = normalizeProducts(getProducts())
      .map((product) => normalizeCategoryName(product.category || ""))
      .filter(Boolean);
    return Array.from(new Set([...stored, ...derived])).sort((a, b) => a.localeCompare(b));
  });
  const [suppliers] = useState<Supplier[]>(() => getSuppliers());
>>>>>>> 1c472c9 (26/4/2026)
  const [purchases] = useState<Purchase[]>(() => getPurchases());
  const [invoiceItems] = useState<InvoiceItem[]>(() => getInvoiceItems());
  const [suppliers] = useState<Supplier[]>(() => getSuppliers());

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
<<<<<<< HEAD
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
=======
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("addedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [archivedOnly, setArchivedOnly] = useState(false);

  const [menuState, setMenuState] = useState<ActionMenuState | null>(null);
  const [viewProduct, setViewProduct] = useState<ProductRow | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
>>>>>>> 1c472c9 (26/4/2026)

  const [filterCategory, setFilterCategory] = useState("");
  const [filterStock, setFilterStock] = useState<"" | "in" | "low" | "out" | "">("");
  const [filterSupplier, setFilterSupplier] = useState<string>("");

  // Simple add product modal state
  const [showAddModal, setShowAddModal] = useState(false);
<<<<<<< HEAD
  const [addForm, setAddForm] = useState({
    code: "",
    name: "",
    category: "",
    purchasePrice: "",
    salePrice: "",
    stock: "",
    minStock: "5",
  });

  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  // Keep derived products normalized with additional fields
  const productRows = useMemo(() => {
    return rawProducts
      .map((p) => {
        const receivedQty = purchases
          .filter((pu) => pu.productId === p.id && pu.status === "Received")
          .reduce((s, cur) => s + Number(cur.quantity || 0), 0);

        const soldQty = invoiceItems
          .filter((it) => it.productId === p.id)
          .reduce((s, cur) => s + Number(cur.quantity || 0), 0);

        const available = Math.max(Number(p.stock || 0) + receivedQty - soldQty, 0);
        const salePrice = Number((p as any).salePrice ?? p.price ?? 0);
        const purchasePrice = Number((p as any).purchasePrice ?? Math.max(salePrice * 0.7, 0));
        const minStock = Number((p as any).minStock ?? 5);

        return {
          ...p,
          salePrice,
          purchasePrice,
          available,
          minStock,
          statusLabel: getStatusLabel(available, minStock),
        } as Product & { salePrice: number; purchasePrice: number; available: number; minStock: number; statusLabel: string };
      })
      .filter((p) => (p.name || "").trim() !== "");
  }, [rawProducts, purchases, invoiceItems]);

  // index suppliers map
  const supplierMap = useMemo(() => {
    const m = new Map<string, string>();
    suppliers.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [suppliers]);

  // Apply search + filters
  const filteredProducts = useMemo(() => {
    const term = String(searchTerm || "").trim().toLowerCase();

    return productRows
      .filter((p) => {
        if (filterCategory && normalizeCategoryName(p.category || "").toLowerCase() !== filterCategory.toLowerCase()) return false;
        if (filterSupplier && String((p as any).supplierId || "") !== filterSupplier) return false;
        if (filterStock) {
          if (filterStock === "in" && p.available <= 0) return false;
          if (filterStock === "low" && p.statusLabel !== "Low Stock") return false;
          if (filterStock === "out" && p.statusLabel !== "Out of Stock") return false;
        }

        if (!term) return true;
        const hay = [p.id, (p as any).code, p.name, p.category, p.statusLabel, p.barcode, String(p.salePrice), String(p.purchasePrice)].join(" ").toLowerCase();
        return hay.includes(term);
      })
      .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  }, [productRows, searchTerm, filterCategory, filterStock, filterSupplier]);

  useEffect(() => {
    saveProducts(rawProducts);
  }, [rawProducts]);

  useEffect(() => {
    // keep categories synced
    const derived = Array.from(new Set(rawProducts.map((p) => normalizeCategoryName(p.category || "")).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
    const merged = Array.from(new Set([...(categories || []), ...derived])).sort((a,b)=>a.localeCompare(b));
    if (JSON.stringify(merged) !== JSON.stringify(categories)) {
      setCategories(merged);
      saveProductCategories(merged);
=======
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ProductForm>(EMPTY_FORM);
  const [initialFormState, setInitialFormState] = useState<ProductForm>(EMPTY_FORM);
  const [, setFormErrors] = useState<FormErrors>({});
  const [codeEditedManually, setCodeEditedManually] = useState(false);
  const [barcodeEditedManually, setBarcodeEditedManually] = useState(false);

  const [deleteProduct, setDeleteProduct] = useState<ProductRow | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveProductCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!menuState) return;

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node | null;
      if (actionMenuRef.current?.contains(target)) return;
      setMenuState(null);
    }

    function closeMenu() {
      setMenuState(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuState(null);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [menuState]);

  const categoryOptions = useMemo(
    () =>
      categories
        .map((category) => normalizeCategoryName(category))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [categories]
  );

  const supplierOptions = useMemo(
    () => suppliers.filter((supplier) => !supplier.isDeleted),
    [suppliers]
  );

  const productRows = useMemo<ProductRow[]>(() => {
    return products
      .filter((product) => product.name?.trim() !== "")
      .map((product) => {
        const extended = product as ExtendedProduct;
        const received = purchases
          .filter((purchase) => purchase.productId === product.id && !purchase.isDeleted)
          .reduce((sum, purchase) => sum + Number(purchase.quantity || 0), 0);
        const sold = calculateProductSoldQuantity(product.id, invoiceItems);
        const available = Math.max(Number(product.stock || 0) + received - sold, 0);
        const salePrice = Number(extended.salePrice ?? product.price ?? 0);
        const purchasePrice = Number(extended.purchasePrice ?? Math.max(salePrice * 0.72, 0));
        const minStock = Number(extended.minStock ?? 5);
        const reorderThreshold = Number(extended.reorderThreshold ?? Math.max(minStock + 5, 10));
        const derivedStatus = deriveStatus(available, minStock, reorderThreshold);
        const profit = roundNumber(salePrice - purchasePrice);
        const margin = salePrice > 0 ? roundNumber((profit / salePrice) * 100) : 0;
        const purchaseCount = purchases.filter((purchase) => purchase.productId === product.id && !purchase.isDeleted).length;
        const salesCount = invoiceItems.filter((item) => item.productId === product.id).length;

        return {
          ...extended,
          code: extended.code || product.id || "",
          image: extended.image || "",
          purchasePrice,
          salePrice,
          price: salePrice,
          stock: Number(product.stock || 0),
          sold,
          received,
          available,
          minStock,
          reorderThreshold,
          description: extended.description || "",
          model: extended.model || "",
          barcode: extended.barcode || "",
          barcodeImage: extended.barcodeImage || "",
          statusLabel: derivedStatus.label,
          statusTone: derivedStatus.tone,
          addedAt: Number(extended.addedAt || 0),
          brand: extended.brand || "",
          currency: extended.currency || "USD",
          taxClass: extended.taxClass || getTaxClassFromRate(extended.taxRate),
          taxRate: Number(extended.taxRate ?? 0),
          unit: extended.unit || "pcs",
          purchaseUnit: extended.purchaseUnit || extended.unit || "pcs",
          warehouse: extended.warehouse || "Main Warehouse",
          stockTracking: extended.stockTracking ?? true,
          serialTracking: extended.serialTracking ?? false,
          batchTracking: extended.batchTracking ?? false,
          isActive: extended.isActive ?? true,
          productType: normalizeProductType(extended.productType),
          pricingMode: extended.pricingMode || "fixed-price",
          targetMargin: Number(extended.targetMargin ?? 25),
          tags: Array.isArray(extended.tags) ? extended.tags : [],
          internalNotes: extended.internalNotes || "",
          supplierLink: extended.supplierLink || "",
          supplierSku: extended.supplierSku || "",
          leadTimeDays: Number(extended.leadTimeDays ?? 0),
          paymentTerms: extended.paymentTerms || "",
          incomeAccount: extended.incomeAccount || "",
          expenseAccount: extended.expenseAccount || "",
          attachments: Array.isArray(extended.attachments) ? extended.attachments : [],
          variantAttributes: extended.variantAttributes || "",
          archived: Boolean(extended.archived),
          profit,
          margin,
          purchaseCount,
          salesCount,
          inventoryValue: roundNumber(available * purchasePrice),
        };
      });
  }, [invoiceItems, products, purchases]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const next = productRows.filter((product) => {
      if (archivedOnly && !product.archived) return false;
      if (!archivedOnly && product.archived) return false;
      if (categoryFilter && product.category !== categoryFilter) return false;
      if (statusFilter && product.statusLabel !== statusFilter) return false;
      if (supplierFilter && product.supplierLink !== supplierFilter) return false;
      if (!query) return true;

      return [
        product.id,
        product.code,
        product.name,
        product.category,
        product.description,
        product.barcode,
        product.statusLabel,
        product.supplierLink,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    return next.sort((left, right) => {
      const factor = sortDirection === "asc" ? 1 : -1;
      if (sortField === "addedAt") {
        return (Number(left.addedAt || 0) - Number(right.addedAt || 0)) * factor;
      }
      if (sortField === "salePrice") return (left.salePrice - right.salePrice) * factor;
      if (sortField === "purchasePrice") return (left.purchasePrice - right.purchasePrice) * factor;
      if (sortField === "profit") return (left.profit - right.profit) * factor;
      if (sortField === "margin") return (left.margin - right.margin) * factor;
      if (sortField === "stock") return (left.available - right.available) * factor;
      if (sortField === "status") return left.statusLabel.localeCompare(right.statusLabel) * factor;
      return left.name.localeCompare(right.name) * factor;
    });
  }, [
    archivedOnly,
    categoryFilter,
    productRows,
    searchTerm,
    sortDirection,
    sortField,
    statusFilter,
    supplierFilter,
  ]);

  const kpis = useMemo(() => {
    const activeProducts = productRows.filter((product) => !product.archived);
    const inStock = activeProducts.filter((product) => product.statusLabel === "In Stock").length;
    const lowStock = activeProducts.filter((product) => product.statusLabel === "Low Stock").length;
    const outOfStock = activeProducts.filter((product) => product.statusLabel === "Out of Stock").length;
    const inventoryValue = activeProducts.reduce((sum, product) => sum + product.inventoryValue, 0);
    const highMargin = activeProducts.filter((product) => product.margin >= 25).length;

    return [
      { label: "Total Products", value: String(activeProducts.length), icon: <Boxes size={18} />, tone: "blue" },
      { label: "In Stock", value: String(inStock), icon: <Warehouse size={18} />, tone: "green" },
      { label: "Low Stock", value: String(lowStock), icon: <CircleAlert size={18} />, tone: "amber" },
      { label: "Out of Stock", value: String(outOfStock), icon: <PackagePlus size={18} />, tone: "red" },
      { label: "Inventory Value", value: formatMoney(inventoryValue), icon: <DollarSign size={18} />, tone: "slate" },
      { label: "High Margin Products", value: String(highMargin), icon: <BarChart3 size={18} />, tone: "purple" },
    ];
  }, [productRows]);

  const activeProduct = editingProductId
    ? productRows.find((product) => product.id === editingProductId) || null
    : null;

  const isProductFormDirty = useMemo(
    () => JSON.stringify(formState) !== JSON.stringify(initialFormState),
    [formState, initialFormState]
  );

  const supplierInsight = useMemo<SupplierMatchInsight | null>(() => {
    if (!formState.supplierLink) return null;
    const normalizedName = formState.name.trim().toLowerCase();
    const normalizedCode = formState.code.trim().toLowerCase();
    const normalizedBarcode = formState.barcode.trim().toLowerCase();
    const matchedProduct = productRows.find((product) => {
      if (editingProductId && product.id === editingProductId) return false;
      if (product.supplierLink !== formState.supplierLink) return false;
      return (
        (!!normalizedName && product.name.trim().toLowerCase() === normalizedName) ||
        (!!normalizedCode && product.code.trim().toLowerCase() === normalizedCode) ||
        (!!normalizedBarcode && product.barcode.trim().toLowerCase() === normalizedBarcode)
      );
    });

    if (!matchedProduct) return null;

    return {
      productName: matchedProduct.name,
      purchasePrice: matchedProduct.purchasePrice,
      currency: matchedProduct.currency,
      purchaseUnit: matchedProduct.purchaseUnit,
      supplierSku: matchedProduct.supplierSku,
      leadTimeDays: matchedProduct.leadTimeDays,
      paymentTerms: matchedProduct.paymentTerms || "Net 30",
    };
  }, [editingProductId, formState.barcode, formState.code, formState.name, formState.supplierLink, productRows]);

  const activeFilterCount = [categoryFilter, statusFilter, supplierFilter, archivedOnly ? "archived" : ""].filter(Boolean).length;

  const openMenu = (productId: string, trigger: HTMLButtonElement) => {
    if (menuState?.productId === productId) {
      setMenuState(null);
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 220;
    setMenuState({
      productId,
      left: Math.min(window.innerWidth - menuWidth - 16, Math.max(12, rect.right - menuWidth)),
      top: rect.bottom + 8,
    });
  };

  const menuProduct = menuState
    ? productRows.find((product) => product.id === menuState.productId) || null
    : null;

  const setField = (field: keyof ProductForm, value: string) => {
    setFormState((current) => {
      const normalizedValue =
        field === "isActive" ||
        field === "stockTracking" ||
        field === "serialTracking" ||
        field === "batchTracking"
          ? value === "true"
          : value;
      const next = { ...current, [field]: normalizedValue } as ProductForm;

      if (field === "name" && !codeEditedManually) {
        const categorySeed = current.category ? current.category.slice(0, 3).toUpperCase() : "";
        next.code = `${categorySeed || buildProductCode(value, products.length + 1).split("-")[0]}-${1100 + products.length + 1}`;
      }

      if (field === "name" && !barcodeEditedManually && !current.barcode.trim()) {
        next.barcode = buildBarcodeSeed(products.length + 1);
      }

      if (field === "code") {
        setCodeEditedManually(true);
      }

      if (field === "barcode") {
        setBarcodeEditedManually(true);
      }

      if ((field === "purchasePrice" || field === "targetMargin" || field === "pricingMode") && next.pricingMode !== "fixed-price") {
        const computed = calculateSalePrice(Number(next.purchasePrice || 0), Number(next.targetMargin || 0), next.pricingMode);
        next.salePrice = computed ? roundNumber(computed).toFixed(2) : "";
      }

      if (field === "taxClass") {
        next.taxRate = String(getTaxProfileRate(String(normalizedValue)));
      }

      if (field === "salePrice" && next.pricingMode === "fixed-price" && Number(next.purchasePrice || 0) > 0) {
        const liveMargin = roundNumber(((Number(next.salePrice || 0) - Number(next.purchasePrice || 0)) / Number(next.salePrice || 0 || 1)) * 100);
        next.targetMargin = Number.isFinite(liveMargin) ? String(Math.max(liveMargin, 0)) : next.targetMargin;
      }

      return next;
    });
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  };

  const applyCategoryDefaults = (category: string) => {
    const defaults = getCategoryDefaults(category, formState.productType);
    setFormState((current) => {
      const next = {
        ...current,
        category,
        code: !codeEditedManually && category ? `${category.slice(0, 3).toUpperCase()}-${1100 + products.length + 1}` : current.code,
        taxClass: defaults.taxClass || current.taxClass,
        taxRate: defaults.taxRate !== undefined ? String(defaults.taxRate) : current.taxRate,
        stockTracking: defaults.stockTracking ?? current.stockTracking,
        unit: defaults.unit || current.unit,
        purchaseUnit: defaults.purchaseUnit || current.purchaseUnit,
        reorderThreshold: defaults.reorderThreshold !== undefined ? String(defaults.reorderThreshold) : current.reorderThreshold,
        minStock: defaults.minStock !== undefined ? String(defaults.minStock) : current.minStock,
        targetMargin: defaults.targetMargin !== undefined ? String(defaults.targetMargin) : current.targetMargin,
        warehouse: defaults.warehouse || current.warehouse,
        incomeAccount: defaults.incomeAccount || current.incomeAccount,
        expenseAccount: defaults.expenseAccount || current.expenseAccount,
      };
      if (next.pricingMode !== "fixed-price") {
        next.salePrice = roundNumber(calculateSalePrice(Number(next.purchasePrice || 0), Number(next.targetMargin || 0), next.pricingMode)).toFixed(2);
      }
      return next;
    });
    setFormErrors((current) => ({ ...current, category: undefined }));
  };

  const handleTypeChange = (productType: ProductType) => {
    const defaults = getTypeDefaults(productType);
    setFormState((current) => {
      const next = {
        ...current,
        productType,
        taxClass: defaults.taxClass || current.taxClass,
        stockTracking: defaults.stockTracking ?? current.stockTracking,
        unit: defaults.unit || current.unit,
        purchaseUnit: defaults.purchaseUnit || current.purchaseUnit,
        reorderThreshold: defaults.reorderThreshold !== undefined ? String(defaults.reorderThreshold) : current.reorderThreshold,
        minStock: defaults.minStock !== undefined ? String(defaults.minStock) : current.minStock,
        targetMargin: defaults.targetMargin !== undefined ? String(defaults.targetMargin) : current.targetMargin,
        warehouse: defaults.warehouse || current.warehouse,
        pricingMode: productType === "Service" || productType === "Digital" ? "fixed-price" : current.pricingMode,
        incomeAccount: defaults.incomeAccount || current.incomeAccount,
        expenseAccount: defaults.expenseAccount || current.expenseAccount,
      };
      next.taxRate = String(getTaxProfileRate(next.taxClass));
      if (next.pricingMode !== "fixed-price") {
        next.salePrice = roundNumber(calculateSalePrice(Number(next.purchasePrice || 0), Number(next.targetMargin || 0), next.pricingMode)).toFixed(2);
      }
      return next;
    });
  };

  const handleSupplierChange = (supplierId: string) => {
    setFormState((current) => {
      const next = { ...current, supplierLink: supplierId };
      if (!supplierId) return next;
      const matchedProduct = productRows.find((product) => {
        if (editingProductId && product.id === editingProductId) return false;
        if (product.supplierLink !== supplierId) return false;
        return (
          (!!current.name.trim() && product.name.trim().toLowerCase() === current.name.trim().toLowerCase()) ||
          (!!current.code.trim() && product.code.trim().toLowerCase() === current.code.trim().toLowerCase()) ||
          (!!current.barcode.trim() && product.barcode.trim().toLowerCase() === current.barcode.trim().toLowerCase())
        );
      });

      if (matchedProduct) {
        next.purchasePrice = String(matchedProduct.purchasePrice);
        next.currency = matchedProduct.currency;
        next.purchaseUnit = matchedProduct.purchaseUnit;
        next.supplierSku = matchedProduct.supplierSku;
        next.leadTimeDays = matchedProduct.leadTimeDays ? String(matchedProduct.leadTimeDays) : current.leadTimeDays;
        next.paymentTerms = matchedProduct.paymentTerms || current.paymentTerms || "Net 30";
        if (next.pricingMode !== "fixed-price") {
          next.salePrice = roundNumber(calculateSalePrice(matchedProduct.purchasePrice, Number(next.targetMargin || 0), next.pricingMode)).toFixed(2);
        }
      } else {
        next.paymentTerms = current.paymentTerms || "Net 30";
      }
      return next;
    });
  };

  const handlePricingModeChange = (pricingMode: ProductPricingMode) => {
    setFormState((current) => {
      const next = { ...current, pricingMode };
      if (pricingMode === "fixed-price") return next;
      const inferredTarget =
        pricingMode === "markup"
          ? calculateMarkup(Number(current.purchasePrice || 0), Number(current.salePrice || 0))
          : Number(current.salePrice || 0) > 0
            ? roundNumber(((Number(current.salePrice || 0) - Number(current.purchasePrice || 0)) / Number(current.salePrice || 0)) * 100)
            : Number(current.targetMargin || 25);
      next.targetMargin = String(Number.isFinite(inferredTarget) ? Math.max(inferredTarget, 0) : 25);
      next.salePrice = roundNumber(calculateSalePrice(Number(next.purchasePrice || 0), Number(next.targetMargin || 0), pricingMode)).toFixed(2);
      return next;
    });
  };

  const handleGenerateCode = () => {
    setCodeEditedManually(false);
    setFormState((current) => ({ ...current, code: buildProductCode(current.name, products.length + 1) }));
    setFormErrors((current) => ({ ...current, code: undefined }));
  };

  const handleGenerateBarcode = () => {
    setBarcodeEditedManually(false);
    setFormState((current) => ({ ...current, barcode: buildBarcodeSeed(products.length + 1) }));
    setFormErrors((current) => ({ ...current, barcode: undefined }));
  };

  const handleScanBarcode = () => {
    setToast("Barcode scanner hook is ready for device integration");
  };

  const toggleOpeningMovement = () => {
    setFormState((current) => ({ ...current, createOpeningMovement: !current.createOpeningMovement }));
  };

  const resetForm = () => {
    const freshForm = { ...EMPTY_FORM, code: `PRD-${1100 + products.length + 1}`, barcode: buildBarcodeSeed(products.length + 1) };
    setFormState(freshForm);
    setInitialFormState(freshForm);
    setFormErrors({});
    setEditingProductId(null);
    setCodeEditedManually(false);
    setBarcodeEditedManually(false);
  };

  const openAddModal = () => {
    const savedDraft = localStorage.getItem(PRODUCT_DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = { ...EMPTY_FORM, ...(JSON.parse(savedDraft) as Partial<ProductForm>) } as ProductForm;
        setFormState(parsed);
        setInitialFormState(parsed);
        setFormErrors({});
        setEditingProductId(null);
        setCodeEditedManually(Boolean(parsed.code));
        setBarcodeEditedManually(Boolean(parsed.barcode));
      } catch {
        resetForm();
      }
    } else {
      resetForm();
    }
    setShowAddModal(true);
  };

  const openEditModal = (product: ProductRow) => {
    const editingForm = {
      productType: product.productType,
      code: product.code,
      name: product.name,
      category: product.category,
      brand: product.brand,
      model: product.model,
      barcode: product.barcode,
      purchasePrice: String(product.purchasePrice),
      salePrice: String(product.salePrice),
      pricingMode: product.pricingMode,
      targetMargin: String(product.targetMargin),
      currency: product.currency,
      taxClass: product.taxClass,
      taxRate: String(product.taxRate),
      stock: String(product.stock),
      minStock: String(product.minStock),
      reorderThreshold: String(product.reorderThreshold),
      unit: product.unit,
      warehouse: product.warehouse,
      stockTracking: product.stockTracking,
      serialTracking: product.serialTracking,
      batchTracking: product.batchTracking,
      isActive: product.isActive,
      image: product.image,
      barcodeImage: product.barcodeImage,
      description: product.description,
      tags: product.tags.join(", "),
      internalNotes: product.internalNotes,
      supplierLink: product.supplierLink,
      supplierSku: product.supplierSku,
      purchaseUnit: product.purchaseUnit,
      leadTimeDays: product.leadTimeDays ? String(product.leadTimeDays) : "",
      paymentTerms: product.paymentTerms,
      incomeAccount: product.incomeAccount,
      expenseAccount: product.expenseAccount,
      attachments: product.attachments,
      variantAttributes: product.variantAttributes,
      createOpeningMovement: Number(product.stock) > 0,
    } satisfies ProductForm;
    setEditingProductId(product.id);
    setFormErrors({});
    setCodeEditedManually(true);
    setBarcodeEditedManually(Boolean(product.barcode));
    setFormState(editingForm);
    setInitialFormState(editingForm);
    setShowAddModal(true);
    setMenuState(null);
  };

  const validateForm = (form: ProductForm, currentId?: string | null) => {
    const errors: FormErrors = {};
    const normalizedCode = form.code.trim().toLowerCase();
    const normalizedBarcode = form.barcode.trim().toLowerCase();
    const requiresInventory = requiresInventoryFields(form.productType, form.stockTracking);

    if (!form.name.trim()) errors.name = "Product name is required.";
    if (!form.productType) errors.productType = "Product type is required.";
    if (!form.code.trim()) errors.code = "Product code is required.";
    if (!form.category.trim()) errors.category = "Category is required.";

    if (products.some((product) => product.id !== currentId && ((product as ExtendedProduct).code || "").trim().toLowerCase() === normalizedCode)) {
      errors.code = "Product code must be unique.";
    }

    if (normalizedBarcode && products.some((product) => product.id !== currentId && ((product as ExtendedProduct).barcode || "").trim().toLowerCase() === normalizedBarcode)) {
      errors.barcode = "Barcode must be unique.";
    }

    if (!form.purchasePrice.trim() || Number.isNaN(Number(form.purchasePrice)) || Number(form.purchasePrice) < 0) {
      errors.purchasePrice = "Purchase price must be a valid number.";
>>>>>>> 1c472c9 (26/4/2026)
    }
  }, [rawProducts]);

<<<<<<< HEAD
  // Add product handler
  function handleAddProduct() {
    const errors: string[] = [];
    if (!addForm.code.trim()) errors.push("code");
    if (!addForm.name.trim()) errors.push("name");
    if (!addForm.category.trim()) errors.push("category");
    if (!addForm.salePrice.trim() || Number.isNaN(Number(addForm.salePrice))) errors.push("salePrice");

    if (errors.length) {
      // simple alert behavior for now
      alert(t.common?.save || "Please fill required fields (code, name, category, sale price)");
      return;
    }

    const id = `PROD-${1000 + rawProducts.length + 1}`;
    const newP: Product = {
      id,
      code: addForm.code.trim(),
      name: addForm.name.trim(),
      category: normalizeCategoryName(addForm.category),
      price: Number(addForm.salePrice) || 0,
      salePrice: Number(addForm.salePrice) || 0,
      purchasePrice: Number(addForm.purchasePrice) || (Number(addForm.salePrice) * 0.7) || 0,
      stock: Number(addForm.stock) || 0,
      minStock: Number(addForm.minStock) || 5,
      description: "",
      barcode: "",
      barcodeImage: "",
      image: "",
      isDeleted: false,
      addedAt: Date.now(),
    } as Product;

    setRawProducts((prev) => [newP, ...prev]);
    setShowAddModal(false);
    // reset
    setAddForm({ code: "", name: "", category: "", purchasePrice: "", salePrice: "", stock: "", minStock: "5" });
  }

  // Basic delete
  function handleDeleteProduct(id: string) {
    if (!confirm(t.common?.confirmDelete || "Delete product?")) return;
    setRawProducts((prev) => prev.filter((p) => p.id !== id));
  }

  const productTitle = t.products?.pageTitle || t.common?.product || "Products";
  const addProductLabel = t.products?.addProduct || "Add Product";
  const searchPlaceholder = t.products?.searchPlaceholder || "Search products, SKU, category...";

  return (
    <div className="products-page compact-products-page">
      {/* Header */}
      <div className="products-header compact-header">
        <div className="header-left">
          <h1 className="page-title">{productTitle}</h1>
          <div className="inline-summary" aria-hidden>
            <span className="summary-item">{t.common?.total || "Total"}: {productRows.length}</span>
            <span className="summary-item muted">{t.products?.inStock || "In"}: {productRows.filter(p=>p.available>0).length}</span>
            <span className="summary-item muted">{t.products?.low || "Low"}: {productRows.filter(p=>p.statusLabel==='Low Stock').length}</span>
=======
    if (!form.salePrice.trim() || Number.isNaN(Number(form.salePrice)) || Number(form.salePrice) < 0) {
      errors.salePrice = "Sale price must be a valid number.";
    }

    if (form.pricingMode !== "fixed-price" && (!form.targetMargin.trim() || Number.isNaN(Number(form.targetMargin)) || Number(form.targetMargin) < 0)) {
      errors.targetMargin = "Target margin must be a valid number.";
    }

    if (requiresInventory && (!form.stock.trim() || Number.isNaN(Number(form.stock)) || Number(form.stock) < 0)) {
      errors.stock = "Initial stock must be a valid number.";
    }

    if (requiresInventory && (!form.minStock.trim() || Number.isNaN(Number(form.minStock)) || Number(form.minStock) < 0)) {
      errors.minStock = "Minimum stock alert must be a valid number.";
    }

    if (requiresInventory && (!form.reorderThreshold.trim() || Number.isNaN(Number(form.reorderThreshold)) || Number(form.reorderThreshold) < 0)) {
      errors.reorderThreshold = "Reorder threshold must be a valid number.";
    }

    return errors;
  };

  const liveFormErrors = validateForm(formState, editingProductId);
  const canSaveProduct = Object.keys(liveFormErrors).length === 0;

  const upsertProduct = () => {
    const errors = validateForm(formState, editingProductId);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return false;

    const nextProduct: Product = {
      id: editingProductId || `PROD-${1000 + products.length + 1}`,
      name: formState.name.trim(),
      category: normalizeCategoryName(formState.category),
      price: Number(formState.salePrice),
      stock: !requiresInventoryFields(formState.productType, formState.stockTracking) ? 0 : Number(formState.stock),
      productType: formState.productType,
      brand: formState.brand.trim(),
      model: formState.model.trim(),
      isActive: formState.isActive,
      code: formState.code.trim(),
      image: formState.image.trim(),
      purchasePrice: Number(formState.purchasePrice),
      salePrice: Number(formState.salePrice),
      taxClass: formState.taxClass,
      pricingMode: formState.pricingMode,
      targetMargin: Number(formState.targetMargin || 0),
      minStock: !requiresInventoryFields(formState.productType, formState.stockTracking) ? 0 : Number(formState.minStock),
      reorderThreshold: !requiresInventoryFields(formState.productType, formState.stockTracking) ? 0 : Number(formState.reorderThreshold),
      description: formState.description.trim(),
      barcode: formState.barcode.trim(),
      barcodeImage: formState.barcodeImage.trim(),
      addedAt: editingProductId
        ? activeProduct?.addedAt || Date.now()
        : Date.now(),
      currency: formState.currency,
      taxRate: Number(formState.taxRate || 0),
      unit: formState.unit.trim() || "pcs",
      purchaseUnit: formState.purchaseUnit.trim() || formState.unit.trim() || "pcs",
      warehouse: formState.warehouse,
      stockTracking: formState.stockTracking,
      serialTracking: formState.serialTracking,
      batchTracking: formState.batchTracking,
      tags: formState.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      internalNotes: formState.internalNotes.trim(),
      supplierLink: formState.supplierLink,
      supplierSku: formState.supplierSku.trim(),
      leadTimeDays: formState.leadTimeDays ? Number(formState.leadTimeDays) : 0,
      paymentTerms: formState.paymentTerms.trim(),
      incomeAccount: formState.incomeAccount.trim(),
      expenseAccount: formState.expenseAccount.trim(),
      attachments: formState.attachments,
      variantAttributes: formState.variantAttributes.trim(),
      archived: false,
    } as Product;

    setProducts((current) => {
      const exists = current.some((product) => product.id === nextProduct.id);
      if (exists) {
        return current.map((product) => (product.id === nextProduct.id ? nextProduct : product));
      }
      return [nextProduct, ...current];
    });

    setCategories((current) =>
      Array.from(new Set([...current, normalizeCategoryName(formState.category)])).sort((a, b) => a.localeCompare(b))
    );

    setToast(editingProductId ? "Product updated" : "Product added");
    return true;
  };

  const handleSaveProduct = () => {
    if (!upsertProduct()) return;
    setShowAddModal(false);
    localStorage.removeItem(PRODUCT_DRAFT_STORAGE_KEY);
    resetForm();
  };

  const handleSaveAndAddAnother = () => {
    if (!upsertProduct()) return;
    const nextForm = {
      ...EMPTY_FORM,
      productType: formState.productType,
      code: `PRD-${1100 + products.length + 1}`,
      barcode: buildBarcodeSeed(products.length + 1),
      category: formState.category,
      currency: formState.currency,
      taxClass: formState.taxClass,
      taxRate: formState.taxRate,
      supplierLink: formState.supplierLink,
      paymentTerms: formState.paymentTerms,
      warehouse: formState.warehouse,
      unit: formState.unit,
      purchaseUnit: formState.purchaseUnit,
      stockTracking: formState.stockTracking,
      targetMargin: formState.targetMargin,
      pricingMode: formState.pricingMode,
      incomeAccount: formState.incomeAccount,
      expenseAccount: formState.expenseAccount,
    } satisfies ProductForm;
    setFormState(nextForm);
    setInitialFormState(nextForm);
    setCodeEditedManually(false);
    setBarcodeEditedManually(false);
    localStorage.removeItem(PRODUCT_DRAFT_STORAGE_KEY);
    setFormErrors({});
    setToast("Product saved. Ready for another.");
  };

  const handleSaveDraft = () => {
    localStorage.setItem(PRODUCT_DRAFT_STORAGE_KEY, JSON.stringify(formState));
    setInitialFormState(formState);
    setToast("Product draft saved");
  };

  const handleCloseProductWorkflow = () => {
    if (isProductFormDirty && !window.confirm("Discard unsaved product changes?")) {
      return;
    }
    setShowAddModal(false);
    resetForm();
  };

  const handleDeleteProduct = () => {
    if (!deleteProduct) return;
    if (deleteCode.trim() !== DELETE_CONFIRMATION_CODE) {
      setDeleteError("Incorrect confirmation code. Please type 123.");
      return;
    }

    setProducts((current) => current.filter((product) => product.id !== deleteProduct.id));
    setDeleteProduct(null);
    setDeleteCode("");
    setDeleteError("");
    setToast("Product deleted");
  };

  const toggleArchive = (productId: string) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === productId
          ? ({ ...(product as ExtendedProduct), archived: !(product as ExtendedProduct).archived } as Product)
          : product
      )
    );
    setMenuState(null);
    setToast("Product archive state updated");
  };

  const duplicateProduct = (product: ProductRow) => {
    const nextId = `PROD-${1000 + products.length + 1}`;
    const clone: Product = {
      ...(product as Product),
      id: nextId,
      code: `${product.code}-COPY`,
      name: `${product.name} Copy`,
      addedAt: Date.now(),
    } as Product;
    setProducts((current) => [clone, ...current]);
    setMenuState(null);
    setToast("Product duplicated");
  };

  const adjustStock = (product: ProductRow) => {
    setProducts((current) =>
      current.map((item) =>
        item.id === product.id ? ({ ...(item as ExtendedProduct), stock: Number(item.stock || 0) + 5 } as Product) : item
      )
    );
    setMenuState(null);
    setToast("Stock adjusted by +5");
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection(field === "name" ? "asc" : "desc");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setStatusFilter("");
    setSupplierFilter("");
    setArchivedOnly(false);
  };

  return (
    <>
      <div className="products-page">
        <section className="products-header-card">
          <div className="products-header-copy">
            <span className="products-badge">
              <Box size={15} />
              Product Operations
            </span>
            <h1>Products</h1>
            <p>Manage inventory, pricing, product maintenance, and purchase or sales visibility from one workspace.</p>
          </div>

          <div className="products-header-actions">
            <button type="button" className="products-primary-btn" onClick={openAddModal}>
              <Plus size={16} />
              Add Product
            </button>
>>>>>>> 1c472c9 (26/4/2026)
          </div>
        </section>

<<<<<<< HEAD
        <div className="header-right">
          <div className="search-filter-row">
            <input
              className="compact-search"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <button className="filter-btn" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
              {t.products?.filters || "Filters"}
            </button>

            <button className="add-product-btn primary" onClick={() => setShowAddModal(true)}>
              + {addProductLabel}
            </button>

            <button className="view-toggle-btn" onClick={() => setViewMode((v) => (v === "table" ? "cards" : "table"))}>
              {viewMode === "table" ? (t.products?.viewToggleCards || "Cards") : (t.products?.viewToggleTable || "Table")}
            </button>
          </div>
        </div>
      </div>

      {/* Filters popover */}
      {showFilters && (
        <div className="filters-popover" role="dialog">
          <div className="filters-grid">
            <div className="field">
              <label>{t.products?.category || "Category"}</label>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">{t.common?.all || "All"}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>{t.products?.stock || "Stock"}</label>
              <select value={filterStock} onChange={(e) => setFilterStock(e.target.value as any)}>
                <option value="">{t.common?.all || "Any"}</option>
                <option value="in">{t.products?.inStock || "In stock"}</option>
                <option value="low">{t.products?.low || "Low stock"}</option>
                <option value="out">{t.products?.out || "Out"}</option>
              </select>
            </div>

            <div className="field">
              <label>{t.products?.supplier || "Supplier"}</label>
              <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}>
                <option value="">{t.common?.all || "Any"}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="filters-actions">
              <button onClick={() => { setFilterCategory(""); setFilterStock(""); setFilterSupplier(""); }}>{t.common?.cancel || "Reset"}</button>
              <button className="apply" onClick={() => setShowFilters(false)}>{t.common?.save || "Apply"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Results meta */}
      <div className="dashboard-card products-results-card compact-results">
        <div className="products-results-meta">
          {searchTerm.trim() ? `${filteredProducts.length} ${t.common?.results || "result(s)"}` : `${filteredProducts.length} ${t.products?.noProducts ? t.products.noProducts : t.common?.product || "product(s)"}`}
        </div>

        {/* Main list */}
        {viewMode === "table" ? (
          <div className="table-wrapper compact-table-wrapper">
            <table className="dashboard-table compact-dashboard-table" role="grid" aria-label="Products table">
              <thead>
                <tr>
                  <th className="col-product">{t.common?.product || "Product"}</th>
                  <th className="col-category">{t.products?.category || "Category"}</th>
                  <th className="col-supplier">{t.products?.supplier || "Supplier"}</th>
                  <th className="col-stock">{t.products?.stock || "Stock"}</th>
                  <th className="col-purchase">{t.products?.purchasePrice || "Purchase"}</th>
                  <th className="col-sale">{t.products?.salePrice || "Sale"}</th>
                  <th className="col-margin">{t.products?.margin || "Margin"}</th>
                  <th className="col-status">{t.products?.status || "Status"}</th>
                  <th className="col-actions">{t.products?.actions || t.common?.actions || "Actions"}</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.length > 0 ? filteredProducts.map((p) => {
                  const supplierName = supplierMap.get((p as any).supplierId) || "-";
                  const margin = Math.max((p as any).salePrice - (p as any).purchasePrice, 0);

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="product-cell">
                          <div className="product-title">{p.name}</div>
                          <div className="product-sku muted">{(p as any).code || p.id}</div>
                        </div>
                      </td>

                      <td>{p.category || "—"}</td>
                      <td>{supplierName}</td>

                      <td>
                        <div className="stock-cell">
                          <strong>{(p as any).available}</strong>
                          {(p as any).available <= (p as any).minStock && (p as any).available > 0 ? (
                            <span className="badge low">{t.products?.low || "Low"}</span>
                          ) : (p as any).available <= 0 ? (
                            <span className="badge out">{t.products?.out || "Out"}</span>
                          ) : null}
                        </div>
                      </td>

                      <td style={{ textAlign: "right" }}>{formatMoney((p as any).purchasePrice || 0)}</td>
                      <td style={{ textAlign: "right" }}>{formatMoney((p as any).salePrice || 0)}</td>
                      <td style={{ textAlign: "right" }}>{formatMoney(margin)}</td>

                      <td style={{ textAlign: "center" }}>
                        <span className={`status-pill ${(p as any).statusLabel === 'In Stock' ? 'in' : (p as any).statusLabel === 'Low Stock' ? 'low' : 'out'}`}>
                          {(p as any).statusLabel}
                        </span>
                      </td>

                      <td className="actions-cell">
                        <button className="table-btn" onClick={() => setViewProduct(p)}>{t.common?.add ? t.common.add : 'View'}</button>
                        <button className="table-btn edit" onClick={() => { setAddForm({ ...addForm, code: (p as any).code || p.id, name: p.name, category: p.category, salePrice: String((p as any).salePrice || p.price || 0), purchasePrice: String((p as any).purchasePrice || 0), stock: String(p.stock || 0) }); setShowAddModal(true); }}>{t.common?.edit || 'Edit'}</button>
                        <button className="table-btn delete" onClick={() => handleDeleteProduct(p.id)}>{t.common?.delete || 'Delete'}</button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={9} className="empty-state-cell">{t.products?.noProducts || 'No matching products found.'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="products-grid compact-cards">
            {filteredProducts.map((product) => (
              <div className="product-mini-card" key={product.id}>
                <div className="mini-title">{product.name}</div>
                <div className="mini-sku">{(product as any).code || product.id}</div>
                <div className="mini-meta">{product.category || '—'}</div>
                <div className="mini-stock">{(product as any).available} • <span className={`pill ${(product as any).statusLabel === 'In Stock' ? 'in' : (product as any).statusLabel === 'Low Stock' ? 'low' : 'out'}`}>{(product as any).statusLabel}</span></div>
                <div className="mini-actions">
                  <button onClick={() => setViewProduct(product)}>{t.common?.actions || 'View'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit modal (simple) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div>
                <h2>{addForm.name ? (t.common?.edit || 'Edit Product') : addProductLabel}</h2>
                <p>{t.products?.addProduct ? t.products.addProduct : 'Enter product details.'}</p>
              </div>

              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <div className="modal-form">
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label className="modal-label">{t.common?.product || 'Product Code'}</label>
                  <input className="modal-input" value={addForm.code} onChange={(e)=>setAddForm({...addForm, code: e.target.value})} />
                </div>

                <div>
                  <label className="modal-label">{t.common?.name || 'Name'}</label>
                  <input className="modal-input" value={addForm.name} onChange={(e)=>setAddForm({...addForm, name: e.target.value})} />
                </div>

                <div>
                  <label className="modal-label">{t.products?.category || 'Category'}</label>
                  <input className="modal-input" value={addForm.category} onChange={(e)=>setAddForm({...addForm, category: e.target.value})} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="modal-label">{t.products?.purchasePrice || 'Purchase Price'}</label>
                    <input className="modal-input" value={addForm.purchasePrice} onChange={(e)=>setAddForm({...addForm, purchasePrice: e.target.value})} />
                  </div>

                  <div>
                    <label className="modal-label">{t.products?.salePrice || 'Sale Price'}</label>
                    <input className="modal-input" value={addForm.salePrice} onChange={(e)=>setAddForm({...addForm, salePrice: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="modal-label">{t.products?.stock || 'Stock'}</label>
                    <input className="modal-input" value={addForm.stock} onChange={(e)=>setAddForm({...addForm, stock: e.target.value})} />
                  </div>

                  <div>
                    <label className="modal-label">{t.products?.low || 'Min Stock'}</label>
                    <input className="modal-input" value={addForm.minStock} onChange={(e)=>setAddForm({...addForm, minStock: e.target.value})} />
                  </div>
                </div>

              </div>

              <div className="modal-actions" style={{ marginTop: 12 }}>
                <button className="modal-secondary-btn" onClick={()=>setShowAddModal(false)}>{t.common?.cancel || 'Cancel'}</button>
                <button className="modal-primary-btn" onClick={handleAddProduct}>{t.common?.save || 'Save Product'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View product modal */}
      {viewProduct && (
        <div className="modal-overlay" onClick={() => setViewProduct(null)}>
          <div className="modal-card product-view-modal" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{viewProduct.name}</h2>
                <p>{t.products?.viewToggleTable || 'Product details'}</p>
              </div>
              <button className="modal-close-btn" onClick={()=>setViewProduct(null)}>×</button>
            </div>

            <div className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="modal-label">{t.common?.product || 'Code'}</label>
                  <div>{(viewProduct as any).code || viewProduct.id}</div>
                </div>
                <div>
                  <label className="modal-label">{t.products?.category || 'Category'}</label>
                  <div>{viewProduct.category || '—'}</div>
                </div>

                <div>
                  <label className="modal-label">{t.products?.purchasePrice || 'Purchase'}</label>
                  <div>{formatMoney((viewProduct as any).purchasePrice || 0)}</div>
                </div>
                <div>
                  <label className="modal-label">{t.products?.salePrice || 'Sale'}</label>
                  <div>{formatMoney((viewProduct as any).salePrice || viewProduct.price || 0)}</div>
                </div>

                <div>
                  <label className="modal-label">{t.products?.stock || 'Available'}</label>
                  <div>{(viewProduct as any).available}</div>
                </div>
                <div>
                  <label className="modal-label">{t.products?.status || 'Status'}</label>
                  <div>{getStatusLabel((viewProduct as any).available || 0, (viewProduct as any).minStock || 5)}</div>
                </div>

              </div>

              <div style={{ marginTop: 12 }}>
                <button className="modal-primary-btn" onClick={() => setViewProduct(null)}>{t.common?.close || 'Close'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
=======
        <section className="products-kpi-grid">
          {kpis.map((item) => (
            <article key={item.label} className="products-kpi-card">
              <div className={`kpi-icon ${item.tone}`}>{item.icon}</div>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </article>
          ))}
        </section>

        <section className={`products-toolbar-card ${moreFiltersOpen ? "filters-open" : ""}`}>
          <div className="products-toolbar">
            <label className="products-search-field">
              <Search size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, code, category, barcode, or description"
              />
            </label>

            <div className="products-toolbar-actions">
              <button
                type="button"
                className={`toolbar-btn ${moreFiltersOpen ? "active" : ""}`}
                onClick={() => setMoreFiltersOpen((current) => !current)}
                aria-expanded={moreFiltersOpen}
              >
                <ShoppingBag size={15} />
                Filters
              </button>
              <button
                type="button"
                className={`toolbar-btn subtle ${moreFiltersOpen ? "active" : ""}`}
                onClick={() => setMoreFiltersOpen((current) => !current)}
                aria-expanded={moreFiltersOpen}
              >
                More Filters
                {activeFilterCount > 0 && <span className="toolbar-count">{activeFilterCount}</span>}
                <ChevronDown size={15} />
              </button>
              <div className="view-toggle">
                <button type="button" className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}>
                  <Boxes size={15} />
                </button>
                <button type="button" className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}>
                  <BarChart3 size={15} />
                </button>
              </div>
            </div>
          </div>

          <div className="products-filter-grid">
            <label className="toolbar-field">
              <span>Category</span>
              <select
                className="app-select-control"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="">All categories</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="toolbar-field">
              <span>Stock Status</span>
              <select
                className="app-select-control"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Reorder Soon">Reorder Soon</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </label>

            <label className="toolbar-field">
              <span>Supplier</span>
              <select
                className="app-select-control"
                value={supplierFilter}
                onChange={(event) => setSupplierFilter(event.target.value)}
              >
                <option value="">All suppliers</option>
                {supplierOptions.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="toolbar-field">
              <span>Sort By</span>
              <select
                className="app-select-control"
                value={sortField}
                onChange={(event) => setSortField(event.target.value as SortField)}
              >
                <option value="addedAt">Newest</option>
                <option value="name">Name</option>
                <option value="salePrice">Sale Price</option>
                <option value="purchasePrice">Purchase Price</option>
                <option value="profit">Profit</option>
                <option value="margin">Margin</option>
                <option value="stock">Stock</option>
                <option value="status">Status</option>
              </select>
            </label>
          </div>

          {moreFiltersOpen && (
            <div className="products-more-filters">
              <label className="toolbar-field">
                <span>Archived</span>
                <select
                  className="app-select-control"
                  value={archivedOnly ? "yes" : ""}
                  onChange={(event) => setArchivedOnly(event.target.value === "yes")}
                >
                  <option value="">Active only</option>
                  <option value="yes">Archived only</option>
                </select>
              </label>

              <label className="toolbar-field">
                <span>Order</span>
                <select
                  className="app-select-control"
                  value={sortDirection}
                  onChange={(event) => setSortDirection(event.target.value as "asc" | "desc")}
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </label>

              <button type="button" className="clear-inline-btn" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          )}
        </section>

        <section className="products-results-card app-subtle-card">
          <div className="results-header">
            <div>
              <h2>{viewMode === "grid" ? "Product Cards" : "Product List"}</h2>
              <p>{filteredProducts.length} records in this view</p>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="empty-products-state">
              <h3>No matching products found.</h3>
              <p>Try adjusting filters, or add a new product to start managing inventory.</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={`${product.id}-${product.addedAt}`}
                  product={product}
                  onOpenMenu={openMenu}
                  onView={setViewProduct}
                  onPreviewImage={setPreviewImage}
                />
              ))}
            </div>
          ) : (
            <ProductTable
              products={filteredProducts}
              onSort={handleSort}
              onView={setViewProduct}
              onOpenMenu={openMenu}
            />
          )}
        </section>
      </div>

      {menuState && menuProduct &&
        createPortal(
          <div ref={actionMenuRef} className="product-action-menu" style={{ top: menuState.top, left: menuState.left }}>
            <button type="button" onClick={() => { setViewProduct(menuProduct); setMenuState(null); }}>
              <Eye size={15} />
              Open
            </button>
            <button type="button" onClick={() => openEditModal(menuProduct)}>
              <PencilLine size={15} />
              Edit Product
            </button>
            <button type="button" onClick={() => adjustStock(menuProduct)}>
              <Warehouse size={15} />
              Adjust Stock
            </button>
            <button type="button" onClick={() => duplicateProduct(menuProduct)}>
              <Copy size={15} />
              Duplicate Product
            </button>
            <button type="button" onClick={() => { setToast(`Linked purchases: ${menuProduct.purchaseCount}`); setMenuState(null); }}>
              <ShoppingCart size={15} />
              View Purchases
            </button>
            <button type="button" onClick={() => { setToast(`Linked sales lines: ${menuProduct.salesCount}`); setMenuState(null); }}>
              <ShoppingBag size={15} />
              View Sales
            </button>
            <button type="button" onClick={() => toggleArchive(menuProduct.id)}>
              <Archive size={15} />
              {menuProduct.archived ? "Restore Product" : "Archive Product"}
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => {
                setDeleteProduct(menuProduct);
                setDeleteCode("");
                setDeleteError("");
                setMenuState(null);
              }}
            >
              <Trash2 size={15} />
              Delete Product
            </button>
          </div>,
          document.body
        )}

      {showAddModal && (
        <ProductWorkflowModal
          title={editingProductId ? "Edit Product" : "Add Product"}
          description="Create or update a product record through a guided workflow with category defaults, supplier context, and pricing automation."
          form={formState}
          errors={liveFormErrors}
          isDirty={isProductFormDirty}
          canSave={canSaveProduct}
          categoryOptions={categoryOptions}
          supplierOptions={supplierOptions}
          supplierInsight={supplierInsight}
          onClose={handleCloseProductWorkflow}
          onOpenCategoryManager={() => setShowCategoryManager(true)}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSaveProduct}
          onSaveAndAddAnother={handleSaveAndAddAnother}
          onFieldChange={setField}
          onTypeChange={handleTypeChange}
          onCategoryChange={applyCategoryDefaults}
          onSupplierChange={handleSupplierChange}
          onPricingModeChange={handlePricingModeChange}
          onGenerateCode={handleGenerateCode}
          onGenerateBarcode={handleGenerateBarcode}
          onScanBarcode={handleScanBarcode}
          onToggleStockTracking={() => setFormState((current) => ({ ...current, stockTracking: !current.stockTracking }))}
          onToggleOpeningMovement={toggleOpeningMovement}
          onImageChange={async (file) => {
            if (!file) return;
            const image = await readFileAsDataURL(file);
            setField("image", image);
          }}
          onAttachmentChange={(files) => {
            const nextAttachments = Array.from(files || []).map((file) => file.name);
            setFormState((current) => ({ ...current, attachments: nextAttachments }));
          }}
          onBarcodeImageChange={async (file) => {
            if (!file) return;
            const image = await readFileAsDataURL(file);
            setField("barcodeImage", image);
          }}
          onPreviewImage={setPreviewImage}
        />
      )}

      <CategoryManagerModal
        open={showCategoryManager}
        categories={categoryOptions}
        onClose={() => setShowCategoryManager(false)}
        onAdd={(value) => {
          const normalized = normalizeCategoryName(value);
          if (!normalized) return;
          setCategories((current) => Array.from(new Set([...current, normalized])).sort((a, b) => a.localeCompare(b)));
          setToast("Category added");
        }}
        onDelete={(value) => {
          setCategories((current) => current.filter((item) => item !== value));
          setProducts((current) =>
            current.map((product) =>
              normalizeCategoryName(product.category || "") === value ? ({ ...(product as ExtendedProduct), category: "" } as Product) : product
            )
          );
          setToast("Category removed");
        }}
      />

      <ProductDetailsModal
        product={viewProduct}
        supplierName={supplierOptions.find((supplier) => supplier.id === viewProduct?.supplierLink)?.name || ""}
        onClose={() => setViewProduct(null)}
        onPreviewImage={setPreviewImage}
      />

      <DeleteProductModal
        product={deleteProduct}
        code={deleteCode}
        error={deleteError}
        onCodeChange={(value) => {
          setDeleteCode(value);
          setDeleteError("");
        }}
        onClose={() => {
          setDeleteProduct(null);
          setDeleteCode("");
          setDeleteError("");
        }}
        onConfirm={handleDeleteProduct}
      />

      <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />

      {toast && (
        <div className="product-toast">
          <PackagePlus size={16} />
          <span>{toast}</span>
        </div>
      )}
    </>
  );
}

>>>>>>> 1c472c9 (26/4/2026)
