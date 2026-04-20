import "./Products.css";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  getInvoiceItems,
  getProductCategories,
  getProducts,
  getPurchases,
  saveProductCategories,
  saveProducts,
} from "../data/storage";
import { calculateProductSoldQuantity } from "../data/relations";
import type { InvoiceItem, Product, Purchase } from "../data/types";

type ProductForm = {
  code: string;
  name: string;
  category: string;
  image: string;
  purchasePrice: string;
  salePrice: string;
  stock: string;
  minStock: string;
  description: string;
  barcode: string;
  barcodeImage: string;
};

type FormErrors = {
  code?: string;
  name?: string;
  category?: string;
  purchasePrice?: string;
  salePrice?: string;
  stock?: string;
  minStock?: string;
};

type PendingCloseTarget = "add" | "edit" | null;

type ProductRow = Product & {
  code: string;
  image: string;
  purchasePrice: number;
  salePrice: number;
  price: number;
  stock: number;
  sold: number;
  available: number;
  minStock: number;
  description: string;
  barcode: string;
  barcodeImage: string;
  statusLabel: "Out of Stock" | "Low Stock" | "In Stock";
  addedAt: number;
};

const emptyForm: ProductForm = {
  code: "",
  name: "",
  category: "",
  image: "",
  purchasePrice: "",
  salePrice: "",
  stock: "",
  minStock: "5",
  description: "",
  barcode: "",
  barcodeImage: "",
};

const DELETE_CONFIRMATION_CODE = "123";
const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&w=900&q=80";

function normalizeCategoryName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function readFileAsDataURL(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function normalizeProducts(products: Product[]): Product[] {
  return products.map((product, index) => {
    const extended = product as Product & {
      addedAt?: number;
      code?: string;
      image?: string;
      purchasePrice?: number;
      salePrice?: number;
      minStock?: number;
      description?: string;
      barcode?: string;
      barcodeImage?: string;
    };

    const salePrice = Number(
      extended.salePrice ?? extended.price ?? product.price ?? 0
    );
    const purchasePrice = Number(
      extended.purchasePrice ?? Math.max(salePrice * 0.7, 0)
    );

    return {
      ...product,
      id: product.id || `PROD-${1000 + index + 1}`,
      name: product.name || "",
      category: product.category || "",
      price: salePrice,
      stock: Number(product.stock || 0),
      addedAt: Number(extended.addedAt || 0),
      code: extended.code || product.id || `SKU-${1000 + index + 1}`,
      image: extended.image || "",
      purchasePrice,
      salePrice,
      minStock: Number(extended.minStock ?? 5),
      description: extended.description || "",
      barcode: extended.barcode || "",
      barcodeImage: extended.barcodeImage || "",
    } as Product;
  });
}

function getStatusLabel(
  available: number,
  minStock: number
): ProductRow["statusLabel"] {
  if (available <= 0) return "Out of Stock";
  if (available <= minStock) return "Low Stock";
  return "In Stock";
}

function statusClassName(status: ProductRow["statusLabel"]) {
  if (status === "Out of Stock") return "product-status out";
  if (status === "Low Stock") return "product-status low";
  return "product-status in";
}

function ConfirmCloseModal({
  open,
  onKeepEditing,
  onDiscard,
  title,
  description,
  discardLabel = "Discard Changes",
}: {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
  title: string;
  description: string;
  discardLabel?: string;
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
            {discardLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchableCategoryDropdown({
  value,
  options,
  placeholder,
  onChange,
  emptyText = "No matching categories found.",
}: {
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const menuHeight = Math.min(320, viewportHeight - rect.bottom - 20);
      const fallbackUpHeight = Math.min(320, rect.top - 20);

      const shouldOpenUp =
        rect.bottom + 320 > viewportHeight && fallbackUpHeight > 180;

      setMenuStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        top: shouldOpenUp ? undefined : rect.bottom + 8,
        bottom: shouldOpenUp ? viewportHeight - rect.top + 8 : undefined,
        zIndex: 9999,
        maxHeight: shouldOpenUp ? fallbackUpHeight : menuHeight,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        !(target instanceof HTMLElement &&
          target.closest(".floating-category-menu"))
      ) {
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
    return options.filter((option) => option.toLowerCase().includes(term));
  }, [options, search]);

  return (
    <>
      <div ref={wrapperRef} style={{ position: "relative" }}>
        <button
          ref={triggerRef}
          type="button"
          className="modal-select"
          onClick={() => setOpen((prev) => !prev)}
          style={{
            width: "100%",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            background: "#fff",
          }}
        >
          <span style={{ color: value ? "#0f172a" : "#7b8794" }}>
            {value || placeholder}
          </span>
          <span style={{ marginLeft: "10px", color: "#64748b", fontSize: "13px" }}>
            ▼
          </span>
        </button>
      </div>

      {open && (
        <div
          className="floating-category-menu"
          style={{
            ...menuStyle,
            background: "#fff",
            border: "1px solid #dbe7f3",
            borderRadius: "18px",
            boxShadow: "0 24px 48px rgba(15, 23, 42, 0.18)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px",
              borderBottom: "1px solid #edf2f7",
              background: "#f8fbff",
            }}
          >
            <input
              className="modal-input"
              type="text"
              placeholder="Search category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ margin: 0 }}
              autoFocus
            />
          </div>

          <div
            style={{
              maxHeight: "inherit",
              overflowY: "auto",
              padding: "8px",
            }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                    setSearch("");
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: value === option ? "#eff6ff" : "transparent",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    color: "#1e293b",
                    fontSize: "14px",
                    fontWeight: value === option ? 700 : 600,
                    marginBottom: "4px",
                  }}
                >
                  {option}
                </button>
              ))
            ) : (
              <div
                style={{
                  padding: "14px",
                  color: "#64748b",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {emptyText}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function CategoryManagerModal({
  open,
  categories,
  products,
  selectedCategory,
  onClose,
  onSelectCategory,
  onAddCategory,
  onRenameCategory,
  onRequestDeleteCategory,
}: {
  open: boolean;
  categories: string[];
  products: Product[];
  selectedCategory: string;
  onClose: () => void;
  onSelectCategory: (value: string) => void;
  onAddCategory: (value: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onRequestDeleteCategory: (category: string) => void;
}) {
  const [newCategory, setNewCategory] = useState("");
  const [renameTarget, setRenameTarget] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setNewCategory("");
      setRenameTarget("");
      setRenameValue("");
      setDeleteTarget("");
      setError("");
    }
  }, [open]);

  const getCategoryUsageCount = (category: string) =>
    products.filter(
      (product) =>
        normalizeCategoryName(product.category || "").toLowerCase() ===
        normalizeCategoryName(category).toLowerCase()
    ).length;

  const renameTargetUsage = useMemo(() => {
    if (!renameTarget) return 0;
    return getCategoryUsageCount(renameTarget);
  }, [renameTarget, products]);

  const deleteTargetUsage = useMemo(() => {
    if (!deleteTarget) return 0;
    return getCategoryUsageCount(deleteTarget);
  }, [deleteTarget, products]);

  if (!open) return null;

  const handleAdd = () => {
    const value = normalizeCategoryName(newCategory);

    if (!value) {
      setError("Please enter a category name.");
      return;
    }

    if (categories.some((category) => category.toLowerCase() === value.toLowerCase())) {
      setError("This category already exists.");
      return;
    }

    onAddCategory(value);
    onSelectCategory(value);
    setNewCategory("");
    setError("");
  };

  const handleRename = () => {
    const oldValue = normalizeCategoryName(renameTarget);
    const newValue = normalizeCategoryName(renameValue);

    if (!oldValue) {
      setError("Please select a category to edit.");
      return;
    }

    if (!newValue) {
      setError("Please enter the new category name.");
      return;
    }

    if (
      categories.some(
        (category) =>
          category.toLowerCase() === newValue.toLowerCase() &&
          category.toLowerCase() !== oldValue.toLowerCase()
      )
    ) {
      setError("Another category already has this name.");
      return;
    }

    onRenameCategory(oldValue, newValue);
    onSelectCategory(newValue);
    setRenameTarget("");
    setRenameValue("");
    setError("");
  };

  const handleDeleteRequest = () => {
    const value = normalizeCategoryName(deleteTarget);

    if (!value) {
      setError("Please select a category to delete.");
      return;
    }

    onRequestDeleteCategory(value);
    setDeleteTarget("");
    setError("");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card category-manager-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div className="mini-badge">Category Control</div>
            <h2>Manage Categories</h2>
            <p>
              Add, rename, and delete categories from one cleaner and more
              compact workspace.
            </p>
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="category-manager-scroll">
          <div className="modal-form category-manager-form">
            <div className="category-manager-layout">
              <div className="category-panel">
                <div className="category-section">
                  <label className="modal-label">Add New Category</label>
                  <p className="category-helper-text">
                    Create a new category and make it available immediately in
                    your product forms.
                  </p>

                  <input
                    className="modal-input"
                    type="text"
                    placeholder="Enter new category name"
                    value={newCategory}
                    onChange={(e) => {
                      setNewCategory(e.target.value);
                      setError("");
                    }}
                  />

                  <button
                    type="button"
                    className="modal-primary-btn full-width-btn"
                    onClick={handleAdd}
                  >
                    Add Category
                  </button>
                </div>
              </div>

              <div className="category-panel">
                <div className="category-section">
                  <label className="modal-label">Rename Category</label>
                  <p className="category-helper-text">
                    Pick a category, edit its name, and update all linked
                    products automatically.
                  </p>

                  <SearchableCategoryDropdown
                    value={renameTarget}
                    options={categories}
                    placeholder="Select category to rename"
                    onChange={(value) => {
                      setRenameTarget(value);
                      setRenameValue(value);
                      setError("");
                    }}
                  />

                  {renameTarget && (
                    <div className="info-chip-box">
                      Linked products: {renameTargetUsage}
                    </div>
                  )}

                  <input
                    className="modal-input"
                    type="text"
                    placeholder="Enter new category name"
                    value={renameValue}
                    onChange={(e) => {
                      setRenameValue(e.target.value);
                      setError("");
                    }}
                  />

                  <button
                    type="button"
                    className="modal-secondary-btn full-width-btn"
                    onClick={handleRename}
                  >
                    Save Category Changes
                  </button>
                </div>
              </div>

              <div className="category-panel danger-panel">
                <div className="category-section">
                  <label className="modal-label danger-text">Delete Category</label>
                  <p className="category-helper-text danger-help">
                    Select the category you want to remove. If it is linked to
                    products, a warning and confirmation step will appear before
                    deletion.
                  </p>

                  <SearchableCategoryDropdown
                    value={deleteTarget}
                    options={categories}
                    placeholder="Select category to delete"
                    onChange={(value) => {
                      setDeleteTarget(value);
                      setError("");
                    }}
                    emptyText="No categories available."
                  />

                  {deleteTarget && (
                    <div className="delete-usage-chip">
                      This category is linked to {deleteTargetUsage} product(s).
                    </div>
                  )}

                  <button
                    type="button"
                    className="modal-danger-btn full-width-btn"
                    onClick={handleDeleteRequest}
                  >
                    Continue to Delete
                  </button>
                </div>
              </div>
            </div>

            {selectedCategory && (
              <div className="active-category-box">
                Active form category: <strong>{selectedCategory}</strong>
              </div>
            )}

            {error && <p className="field-error">{error}</p>}
          </div>
        </div>

        <div className="category-manager-footer">
          <button
            type="button"
            className="modal-secondary-btn"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteCategoryModal({
  open,
  category,
  usageCount,
  code,
  error,
  onChangeCode,
  onClose,
  onConfirm,
}: {
  open: boolean;
  category: string | null;
  usageCount: number;
  code: string;
  error: string;
  onChangeCode: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open || !category) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card delete-category-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Delete Category</h2>
            <p>This action needs confirmation.</p>
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-form">
          <p className="delete-warning">
            You are about to delete category <strong>{category}</strong>.
          </p>

          <p className="delete-help">
            This category is currently used by <strong>{usageCount}</strong>{" "}
            product(s).
            {usageCount > 0
              ? " Products using this category will be moved to an empty category until reassigned."
              : " It is not linked to any product."}
          </p>

          <p className="delete-help">
            To confirm deletion, type exactly <strong>123</strong>.
          </p>

          <div style={{ marginTop: "16px" }}>
            <input
              className="modal-input"
              type="text"
              placeholder="Type 123"
              value={code}
              onChange={(e) => onChangeCode(e.target.value)}
            />
            {error && <p className="field-error">{error}</p>}
          </div>

          <div className="modal-actions" style={{ marginTop: "20px" }}>
            <button
              type="button"
              className="modal-secondary-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="modal-danger-btn"
              onClick={onConfirm}
            >
              Delete Category
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
      <div
        className="image-lightbox-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="image-lightbox-close"
          onClick={onClose}
          aria-label="Close image preview"
        >
          ×
        </button>

        <img
          src={image}
          alt="Product preview"
          className="image-lightbox-full"
        />
      </div>
    </div>
  );
}

function ProductDetailsModal({
  product,
  onClose,
  onPreviewImage,
}: {
  product: ProductRow | null;
  onClose: () => void;
  onPreviewImage: (image: string) => void;
}) {
  if (!product) return null;

  const profit = Math.max(product.salePrice - product.purchasePrice, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card product-view-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{product.name}</h2>
            <p>Detailed product overview with pricing and stock information.</p>
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
                <span>Product ID</span>
                <strong>{product.id}</strong>
              </div>
              <div className="view-stat-card">
                <span>Product Code</span>
                <strong>{product.code}</strong>
              </div>
              <div className="view-stat-card">
                <span>Category</span>
                <strong>{product.category || "Unassigned"}</strong>
              </div>
              <div className="view-stat-card">
                <span>Status</span>
                <strong>{product.statusLabel}</strong>
              </div>
              <div className="view-stat-card">
                <span>Purchase Price</span>
                <strong>{formatMoney(product.purchasePrice)}</strong>
              </div>
              <div className="view-stat-card">
                <span>Sale Price</span>
                <strong>{formatMoney(product.salePrice)}</strong>
              </div>
              <div className="view-stat-card">
                <span>Profit / Unit</span>
                <strong>{formatMoney(profit)}</strong>
              </div>
              <div className="view-stat-card">
                <span>Available Stock</span>
                <strong>{product.available}</strong>
              </div>
            </div>

            {product.barcode || product.barcodeImage ? (
              <div className="view-description-box">
                <h4>Barcode</h4>

                {product.barcodeImage ? (
                  <img
                    src={product.barcodeImage}
                    alt={product.barcode || "Barcode"}
                    className="barcode-preview-image"
                  />
                ) : null}

                {product.barcode ? (
                  <p className="barcode-value">{product.barcode}</p>
                ) : (
                  <p className="barcode-value muted">No barcode number added.</p>
                )}
              </div>
            ) : null}

            <div className="view-description-box">
              <h4>Description</h4>
              <p>{product.description || "No description added yet."}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductFormModal({
  title,
  description,
  form,
  errors,
  categoryOptions,
  selectedCategory,
  onClose,
  onOpenCategoryManager,
  onSubmit,
  onFieldChange,
  onImageChange,
  onBarcodeImageChange,
  onPreviewImage,
}: {
  title: string;
  description: string;
  form: ProductForm;
  errors: FormErrors;
  categoryOptions: string[];
  selectedCategory: string;
  onClose: () => void;
  onOpenCategoryManager: () => void;
  onSubmit: () => void;
  onFieldChange: (field: keyof ProductForm, value: string) => void;
  onImageChange: (file: File | null) => void;
  onBarcodeImageChange: (file: File | null) => void;
  onPreviewImage: (image: string) => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card product-form-modal modal-scroll-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header modal-sticky-header">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form
          className="modal-form modal-form-scroll"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="product-form-layout">
            <div className="image-upload-panel">
              <div className="image-preview-card">
                <img
                  src={form.image || PLACEHOLDER_IMAGE}
                  alt={form.name || "Preview"}
                  className="image-preview clickable-product-image"
                  onClick={() => onPreviewImage(form.image || PLACEHOLDER_IMAGE)}
                />
              </div>

              <label className="upload-image-btn">
                Upload Product Image
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => onImageChange(e.target.files?.[0] || null)}
                />
              </label>

              <button
                type="button"
                className="remove-image-btn"
                onClick={() => onFieldChange("image", "")}
              >
                Remove Product Image
              </button>
            </div>

            <div className="modal-grid">
              <div>
                <label className="modal-label">Product Code</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Enter product code"
                  value={form.code}
                  onChange={(e) => onFieldChange("code", e.target.value)}
                />
                {errors.code && <p className="field-error">{errors.code}</p>}
              </div>

              <div>
                <label className="modal-label">Name</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Enter product name"
                  value={form.name}
                  onChange={(e) => onFieldChange("name", e.target.value)}
                />
                {errors.name && <p className="field-error">{errors.name}</p>}
              </div>

              <div className="category-field">
                <label className="modal-label">Category</label>

                <div className="category-select-row">
                  <select
                    className="modal-select"
                    value={form.category}
                    onChange={(e) => onFieldChange("category", e.target.value)}
                  >
                    <option value="">Select category</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="category-manage-btn"
                    onClick={onOpenCategoryManager}
                  >
                    Manage
                  </button>
                </div>

                {selectedCategory && (
                  <div className="selected-category-chip">
                    Selected: {selectedCategory}
                  </div>
                )}

                {errors.category && (
                  <p className="field-error">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="modal-label">Minimum Stock Alert</label>
                <input
                  className="modal-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="5"
                  value={form.minStock}
                  onChange={(e) => onFieldChange("minStock", e.target.value)}
                />
                {errors.minStock && (
                  <p className="field-error">{errors.minStock}</p>
                )}
              </div>

              <div>
                <label className="modal-label">Purchase Price</label>
                <input
                  className="modal-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter purchase price"
                  value={form.purchasePrice}
                  onChange={(e) => onFieldChange("purchasePrice", e.target.value)}
                />
                {errors.purchasePrice && (
                  <p className="field-error">{errors.purchasePrice}</p>
                )}
              </div>

              <div>
                <label className="modal-label">Sale Price</label>
                <input
                  className="modal-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter sale price"
                  value={form.salePrice}
                  onChange={(e) => onFieldChange("salePrice", e.target.value)}
                />
                {errors.salePrice && (
                  <p className="field-error">{errors.salePrice}</p>
                )}
              </div>

              <div>
                <label className="modal-label">Base Stock</label>
                <input
                  className="modal-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Enter initial stock"
                  value={form.stock}
                  onChange={(e) => onFieldChange("stock", e.target.value)}
                />
                {errors.stock && <p className="field-error">{errors.stock}</p>}
              </div>

              <div>
                <label className="modal-label">Barcode Number (Optional)</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Enter barcode number"
                  value={form.barcode}
                  onChange={(e) => onFieldChange("barcode", e.target.value)}
                />
              </div>

              <div>
                <label className="modal-label">Barcode Image (Optional)</label>
                <div className="barcode-upload-row">
                  <label className="barcode-upload-btn">
                    Upload Barcode
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        onBarcodeImageChange(e.target.files?.[0] || null)
                      }
                    />
                  </label>

                  <button
                    type="button"
                    className="barcode-clear-btn"
                    onClick={() => onFieldChange("barcodeImage", "")}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {(form.barcodeImage || form.barcode) && (
                <div className="modal-grid-full">
                  <div className="barcode-preview-box">
                    <h4>Barcode Preview</h4>

                    {form.barcodeImage ? (
                      <img
                        src={form.barcodeImage}
                        alt={form.barcode || "Barcode Preview"}
                        className="barcode-preview-image"
                      />
                    ) : null}

                    <p className="barcode-value">
                      {form.barcode || "No barcode number entered"}
                    </p>
                  </div>
                </div>
              )}

              <div className="modal-grid-full">
                <label className="modal-label">Description</label>
                <textarea
                  className="modal-input product-textarea"
                  rows={4}
                  placeholder="Enter product description"
                  value={form.description}
                  onChange={(e) => onFieldChange("description", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-actions modal-sticky-actions">
            <button
              type="button"
              className="modal-secondary-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="modal-primary-btn">
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  menuOpenId,
  onToggleMenu,
  onView,
  onEdit,
  onDelete,
  onPreviewImage,
}: {
  product: ProductRow;
  menuOpenId: string | null;
  onToggleMenu: (productId: string) => void;
  onView: (product: ProductRow) => void;
  onEdit: (product: ProductRow) => void;
  onDelete: (product: ProductRow) => void;
  onPreviewImage: (image: string) => void;
}) {
  const menuOpen = menuOpenId === product.id;
  const profit = Math.max(product.salePrice - product.purchasePrice, 0);

  return (
    <div className="product-card">
      <div className="product-card-media">
        <img
          src={product.image || PLACEHOLDER_IMAGE}
          alt={product.name}
          className="product-card-image clickable-product-image"
          onClick={(e) => {
            e.stopPropagation();
            onPreviewImage(product.image || PLACEHOLDER_IMAGE);
          }}
        />

        <div className="product-card-topbar">
          <div className="product-icon-badge">◫</div>

          <div className="product-menu-wrap">
            <button
              type="button"
              className="product-menu-btn settings-emoji-btn"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu(product.id);
              }}
              aria-label="Product settings"
              title="Product settings"
            >
              ⚙️
            </button>

            {menuOpen && (
              <div
                className="product-menu-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <button type="button" onClick={() => onView(product)}>
                  View
                </button>
                <button type="button" onClick={() => onEdit(product)}>
                  Edit
                </button>
                <button type="button" className="danger" onClick={() => onDelete(product)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="product-card-body">
        <div className="product-card-title">
          <h3>{product.name}</h3>
          <p>{product.code}</p>
        </div>

        <div className="product-card-price">{formatMoney(product.salePrice)}</div>

        <div className="product-mini-meta">
          <span>{product.category || "Unassigned"}</span>
          <span className={statusClassName(product.statusLabel)}>{product.statusLabel}</span>
        </div>

        <div className="product-inline-stats">
          <div>
            <small>Buy</small>
            <strong>{formatMoney(product.purchasePrice)}</strong>
          </div>
          <div>
            <small>Sell</small>
            <strong>{formatMoney(product.salePrice)}</strong>
          </div>
          <div>
            <small>Profit</small>
            <strong>{formatMoney(profit)}</strong>
          </div>
          <div>
            <small>Stock</small>
            <strong>{product.available}</strong>
          </div>
        </div>

        {product.barcode ? (
          <div className="product-barcode-chip">Barcode: {product.barcode}</div>
        ) : null}
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>(() => {
    const normalized = normalizeProducts(getProducts());

    return normalized.map((product, index) => ({
      ...product,
      addedAt:
        Number((product as Product & { addedAt?: number }).addedAt || 0) ||
        Date.now() - index,
    }));
  });

  const [categories, setCategories] = useState<string[]>(() =>
    getProductCategories()
  );

  const [purchases] = useState<Purchase[]>(() => getPurchases());
  const [invoiceItems] = useState<InvoiceItem[]>(() => getInvoiceItems());

  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<ProductForm>(emptyForm);
  const [addErrors, setAddErrors] = useState<FormErrors>({});

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<ProductForm>(emptyForm);
  const [editErrors, setEditErrors] = useState<FormErrors>({});

  const [viewProduct, setViewProduct] = useState<ProductRow | null>(null);

  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [pendingCloseTarget, setPendingCloseTarget] =
    useState<PendingCloseTarget>(null);

  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<string | null>(null);
  const [deleteCategoryCode, setDeleteCategoryCode] = useState("");
  const [deleteCategoryError, setDeleteCategoryError] = useState("");

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    const derivedCategories = Array.from(
      new Set(
        products
          .map((product) => normalizeCategoryName(product.category || ""))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    setCategories((prev) =>
      Array.from(new Set([...prev, ...derivedCategories])).sort((a, b) =>
        a.localeCompare(b)
      )
    );
  }, [products]);

  useEffect(() => {
    saveProductCategories(categories);
  }, [categories]);

  useEffect(() => {
    const closeMenu = () => setMenuOpenId(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const categoryOptions = useMemo(() => {
    return categories
      .map((category) => normalizeCategoryName(category))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [categories]);

  const hasAddUnsavedChanges = useMemo(() => {
    return Object.values(addForm).some((value) => value.trim() !== "");
  }, [addForm]);

  const hasEditUnsavedChanges = useMemo(() => {
    if (!editingProduct) return false;

    const extended = editingProduct as Product & {
      code?: string;
      image?: string;
      purchasePrice?: number;
      salePrice?: number;
      minStock?: number;
      description?: string;
      barcode?: string;
      barcodeImage?: string;
    };

    return (
      editForm.code.trim() !== String(extended.code || "") ||
      editForm.name.trim() !== (editingProduct.name || "") ||
      editForm.category.trim() !== (editingProduct.category || "") ||
      editForm.image.trim() !== String(extended.image || "") ||
      editForm.purchasePrice.trim() !== String(extended.purchasePrice ?? "") ||
      editForm.salePrice.trim() !== String(extended.salePrice ?? editingProduct.price ?? "") ||
      editForm.stock.trim() !== String(editingProduct.stock ?? "") ||
      editForm.minStock.trim() !== String(extended.minStock ?? 5) ||
      editForm.description.trim() !== String(extended.description || "") ||
      editForm.barcode.trim() !== String(extended.barcode || "") ||
      editForm.barcodeImage.trim() !== String(extended.barcodeImage || "")
    );
  }, [editForm, editingProduct]);

  const productRows = useMemo<ProductRow[]>(() => {
    return products
      .filter((product) => product.name?.trim() !== "")
      .map((product) => {
        const extended = product as Product & {
          code?: string;
          image?: string;
          purchasePrice?: number;
          salePrice?: number;
          minStock?: number;
          description?: string;
          barcode?: string;
          barcodeImage?: string;
          addedAt?: number;
        };

        const receivedQty = purchases
          .filter(
            (purchase) =>
              purchase.productId === product.id &&
              purchase.status === "Received"
          )
          .reduce((sum, purchase) => sum + Number(purchase.quantity || 0), 0);

        const soldQty = calculateProductSoldQuantity(product.id, invoiceItems);
        const available = Math.max(
          Number(product.stock || 0) + receivedQty - soldQty,
          0
        );

        const salePrice = Number(extended.salePrice ?? product.price ?? 0);
        const purchasePrice = Number(
          extended.purchasePrice ?? Math.max(salePrice * 0.7, 0)
        );
        const minStock = Number(extended.minStock ?? 5);

        return {
          ...product,
          code: extended.code || product.id || "",
          image: extended.image || "",
          purchasePrice,
          salePrice,
          price: salePrice,
          stock: Number(product.stock || 0),
          sold: soldQty,
          available,
          minStock,
          description: extended.description || "",
          barcode: extended.barcode || "",
          barcodeImage: extended.barcodeImage || "",
          statusLabel: getStatusLabel(available, minStock),
          addedAt: Number(extended.addedAt || 0),
        };
      });
  }, [products, purchases, invoiceItems]);

  const filteredProducts = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();

    return [...productRows]
      .filter((product) => {
        if (!value) return true;

        return [
          product.id,
          product.code,
          product.name,
          product.category,
          product.salePrice,
          product.purchasePrice,
          product.stock,
          product.available,
          product.statusLabel,
          product.description,
          product.barcode,
        ]
          .join(" ")
          .toLowerCase()
          .includes(value);
      })
      .sort((a, b) => b.addedAt - a.addedAt);
  }, [productRows, searchTerm]);

  const validateForm = (form: ProductForm): FormErrors => {
    const errors: FormErrors = {};

    if (!form.code.trim()) errors.code = "Product code is required.";
    if (!form.name.trim()) errors.name = "Product name is required.";
    if (!form.category.trim()) errors.category = "Category is required.";

    if (!form.purchasePrice.trim()) {
      errors.purchasePrice = "Purchase price is required.";
    } else if (Number.isNaN(Number(form.purchasePrice))) {
      errors.purchasePrice = "Purchase price must be a valid number.";
    } else if (Number(form.purchasePrice) < 0) {
      errors.purchasePrice = "Purchase price cannot be negative.";
    }

    if (!form.salePrice.trim()) {
      errors.salePrice = "Sale price is required.";
    } else if (Number.isNaN(Number(form.salePrice))) {
      errors.salePrice = "Sale price must be a valid number.";
    } else if (Number(form.salePrice) < 0) {
      errors.salePrice = "Sale price cannot be negative.";
    }

    if (!form.stock.trim()) {
      errors.stock = "Base stock is required.";
    } else if (Number.isNaN(Number(form.stock))) {
      errors.stock = "Base stock must be a valid number.";
    } else if (Number(form.stock) < 0) {
      errors.stock = "Base stock cannot be negative.";
    }

    if (!form.minStock.trim()) {
      errors.minStock = "Minimum stock is required.";
    } else if (Number.isNaN(Number(form.minStock))) {
      errors.minStock = "Minimum stock must be a valid number.";
    } else if (Number(form.minStock) < 0) {
      errors.minStock = "Minimum stock cannot be negative.";
    }

    return errors;
  };

  const setAddField = (field: keyof ProductForm, value: string) => {
    setAddForm((prev) => ({ ...prev, [field]: value }));
    setAddErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const setEditField = (field: keyof ProductForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    setEditErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddForm(emptyForm);
    setAddErrors({});
  };

  const closeEditModal = () => {
    setEditingProduct(null);
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
    if (pendingCloseTarget === "add") closeAddModal();
    if (pendingCloseTarget === "edit") closeEditModal();
    setPendingCloseTarget(null);
  };

  const openEditModal = (product: ProductRow) => {
    setEditingProduct(product);
    setEditForm({
      code: product.code || "",
      name: product.name || "",
      category: product.category || "",
      image: product.image || "",
      purchasePrice: String(product.purchasePrice ?? ""),
      salePrice: String(product.salePrice ?? ""),
      stock: String(product.stock ?? ""),
      minStock: String(product.minStock ?? 5),
      description: product.description || "",
      barcode: product.barcode || "",
      barcodeImage: product.barcodeImage || "",
    });
    setEditErrors({});
  };

  const requestDeleteProduct = (product: Product) => {
    setDeleteProduct(product);
    setDeleteCode("");
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    setDeleteProduct(null);
    setDeleteCode("");
    setDeleteError("");
  };

  const handleAddProduct = () => {
    const errors = validateForm(addForm);
    setAddErrors(errors);

    if (Object.keys(errors).length > 0) return;

    const newProduct: Product = {
      id: `PROD-${1000 + products.length + 1}`,
      code: addForm.code.trim(),
      name: addForm.name.trim(),
      category: normalizeCategoryName(addForm.category),
      image: addForm.image.trim(),
      purchasePrice: Number(addForm.purchasePrice),
      salePrice: Number(addForm.salePrice),
      price: Number(addForm.salePrice),
      stock: Number(addForm.stock),
      minStock: Number(addForm.minStock),
      description: addForm.description.trim(),
      barcode: addForm.barcode.trim(),
      barcodeImage: addForm.barcodeImage.trim(),
      addedAt: Date.now(),
    } as Product;

    setProducts((prev) => [newProduct, ...prev]);
    setCategories((prev) =>
      Array.from(new Set([...prev, normalizeCategoryName(addForm.category)])).sort(
        (a, b) => a.localeCompare(b)
      )
    );
    closeAddModal();
  };

  const handleEditProduct = () => {
    if (!editingProduct) return;

    const errors = validateForm(editForm);
    setEditErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setProducts((prev) =>
      prev.map((product) =>
        product.id === editingProduct.id
          ? ({
              ...product,
              code: editForm.code.trim(),
              name: editForm.name.trim(),
              category: normalizeCategoryName(editForm.category),
              image: editForm.image.trim(),
              purchasePrice: Number(editForm.purchasePrice),
              salePrice: Number(editForm.salePrice),
              price: Number(editForm.salePrice),
              stock: Number(editForm.stock),
              minStock: Number(editForm.minStock),
              description: editForm.description.trim(),
              barcode: editForm.barcode.trim(),
              barcodeImage: editForm.barcodeImage.trim(),
            } as Product)
          : product
      )
    );

    setCategories((prev) =>
      Array.from(new Set([...prev, normalizeCategoryName(editForm.category)])).sort(
        (a, b) => a.localeCompare(b)
      )
    );

    closeEditModal();
  };

  const handleConfirmDelete = () => {
    if (deleteCode.trim() !== DELETE_CONFIRMATION_CODE) {
      setDeleteError("Incorrect confirmation code. Please type 123.");
      return;
    }

    setProducts((prev) =>
      prev.filter((product) => product.id !== deleteProduct?.id)
    );
    closeDeleteModal();
  };

  const handleAddCategory = (categoryName: string) => {
    const value = normalizeCategoryName(categoryName);
    if (!value) return;

    setCategories((prev) => {
      if (prev.some((item) => item.toLowerCase() === value.toLowerCase())) {
        return prev;
      }
      return [...prev, value].sort((a, b) => a.localeCompare(b));
    });
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    const oldValue = normalizeCategoryName(oldName);
    const newValue = normalizeCategoryName(newName);

    if (!oldValue || !newValue) return;

    setCategories((prev) =>
      prev
        .map((category) =>
          category.toLowerCase() === oldValue.toLowerCase() ? newValue : category
        )
        .filter(Boolean)
        .filter(
          (value, index, arr) =>
            arr.findIndex((item) => item.toLowerCase() === value.toLowerCase()) ===
            index
        )
        .sort((a, b) => a.localeCompare(b))
    );

    setProducts((prev) =>
      prev.map((product) =>
        normalizeCategoryName(product.category || "").toLowerCase() ===
        oldValue.toLowerCase()
          ? ({ ...product, category: newValue } as Product)
          : product
      )
    );

    setAddForm((prev) => ({
      ...prev,
      category:
        prev.category.toLowerCase() === oldValue.toLowerCase()
          ? newValue
          : prev.category,
    }));

    setEditForm((prev) => ({
      ...prev,
      category:
        prev.category.toLowerCase() === oldValue.toLowerCase()
          ? newValue
          : prev.category,
    }));
  };

  const requestDeleteCategory = (category: string) => {
    setDeleteCategoryTarget(category);
    setDeleteCategoryCode("");
    setDeleteCategoryError("");
  };

  const closeDeleteCategoryModal = () => {
    setDeleteCategoryTarget(null);
    setDeleteCategoryCode("");
    setDeleteCategoryError("");
  };

  const deleteCategoryUsageCount = useMemo(() => {
    if (!deleteCategoryTarget) return 0;

    return products.filter(
      (product) =>
        normalizeCategoryName(product.category || "").toLowerCase() ===
        normalizeCategoryName(deleteCategoryTarget).toLowerCase()
    ).length;
  }, [deleteCategoryTarget, products]);

  const handleConfirmDeleteCategory = () => {
    if (!deleteCategoryTarget) return;

    if (deleteCategoryCode.trim() !== DELETE_CONFIRMATION_CODE) {
      setDeleteCategoryError("Incorrect confirmation code. Please type 123.");
      return;
    }

    const target = normalizeCategoryName(deleteCategoryTarget);

    setCategories((prev) =>
      prev.filter((category) => category.toLowerCase() !== target.toLowerCase())
    );

    setProducts((prev) =>
      prev.map((product) =>
        normalizeCategoryName(product.category || "").toLowerCase() ===
        target.toLowerCase()
          ? ({ ...product, category: "" } as Product)
          : product
      )
    );

    setAddForm((prev) => ({
      ...prev,
      category:
        prev.category.toLowerCase() === target.toLowerCase() ? "" : prev.category,
    }));

    setEditForm((prev) => ({
      ...prev,
      category:
        prev.category.toLowerCase() === target.toLowerCase() ? "" : prev.category,
    }));

    closeDeleteCategoryModal();
  };

  const activeFormCategory = editingProduct ? editForm.category : addForm.category;

  return (
    <>
      <div className="products-page">
        <div className="products-header customers-like-header">
          <div className="products-header-copy">
            <p className="dashboard-badge">Product Management</p>
            <h1 className="dashboard-title">Products</h1>
            <p className="dashboard-subtitle">
              Monitor product pricing, purchases, sales, and calculated stock levels.
            </p>
          </div>

          <div className="products-header-actions">
            <div className="customers-search-shell">
              <span className="customers-search-icon">⌕</span>
              <input
                type="text"
                className="customers-search-input"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="quick-action-btn"
              onClick={() => setShowAddModal(true)}
            >
              + Add Product
            </button>
          </div>
        </div>

        <div className="dashboard-card products-results-card">
          <div className="products-results-meta">
            {searchTerm.trim()
              ? `${filteredProducts.length} result(s)`
              : `${filteredProducts.length} product(s)`}
          </div>

          <div className="products-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard
                  key={`${product.id}-${product.addedAt}`}
                  product={product}
                  menuOpenId={menuOpenId}
                  onToggleMenu={(productId) =>
                    setMenuOpenId((prev) => (prev === productId ? null : productId))
                  }
                  onView={(item) => {
                    setMenuOpenId(null);
                    setViewProduct(item);
                  }}
                  onEdit={(item) => {
                    setMenuOpenId(null);
                    openEditModal(item);
                  }}
                  onDelete={(item) => {
                    setMenuOpenId(null);
                    requestDeleteProduct(item);
                  }}
                  onPreviewImage={(image) => {
                    setMenuOpenId(null);
                    setPreviewImage(image);
                  }}
                />
              ))
            ) : (
              <div className="empty-products-state">
                <h3>No matching products found.</h3>
                <p>Try another search term or add a new product.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <ProductFormModal
          title="Add Product"
          description="Enter the new product information."
          form={addForm}
          errors={addErrors}
          categoryOptions={categoryOptions}
          selectedCategory={addForm.category}
          onClose={attemptCloseAddModal}
          onOpenCategoryManager={() => setShowCategoryManager(true)}
          onSubmit={handleAddProduct}
          onFieldChange={setAddField}
          onImageChange={async (file) => {
            if (!file) return;
            const image = await readFileAsDataURL(file);
            setAddField("image", image);
          }}
          onBarcodeImageChange={async (file) => {
            if (!file) return;
            const image = await readFileAsDataURL(file);
            setAddField("barcodeImage", image);
          }}
          onPreviewImage={(image) => setPreviewImage(image)}
        />
      )}

      {editingProduct && (
        <ProductFormModal
          title="Edit Product"
          description="Update the selected product information."
          form={editForm}
          errors={editErrors}
          categoryOptions={categoryOptions}
          selectedCategory={editForm.category}
          onClose={attemptCloseEditModal}
          onOpenCategoryManager={() => setShowCategoryManager(true)}
          onSubmit={handleEditProduct}
          onFieldChange={setEditField}
          onImageChange={async (file) => {
            if (!file) return;
            const image = await readFileAsDataURL(file);
            setEditField("image", image);
          }}
          onBarcodeImageChange={async (file) => {
            if (!file) return;
            const image = await readFileAsDataURL(file);
            setEditField("barcodeImage", image);
          }}
          onPreviewImage={(image) => setPreviewImage(image)}
        />
      )}

      {viewProduct && (
        <ProductDetailsModal
          product={viewProduct}
          onClose={() => setViewProduct(null)}
          onPreviewImage={(image) => setPreviewImage(image)}
        />
      )}

      {deleteProduct && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Delete Product</h2>
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
                You are about to permanently delete product {deleteProduct.name}
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

      <CategoryManagerModal
        open={showCategoryManager}
        categories={categoryOptions}
        products={productRows}
        selectedCategory={activeFormCategory}
        onClose={() => setShowCategoryManager(false)}
        onSelectCategory={(value) => {
          if (editingProduct) {
            setEditField("category", value);
          } else {
            setAddField("category", value);
          }
        }}
        onAddCategory={handleAddCategory}
        onRenameCategory={handleRenameCategory}
        onRequestDeleteCategory={requestDeleteCategory}
      />

      <DeleteCategoryModal
        open={!!deleteCategoryTarget}
        category={deleteCategoryTarget}
        usageCount={deleteCategoryUsageCount}
        code={deleteCategoryCode}
        error={deleteCategoryError}
        onChangeCode={(value) => {
          setDeleteCategoryCode(value);
          setDeleteCategoryError("");
        }}
        onClose={closeDeleteCategoryModal}
        onConfirm={handleConfirmDeleteCategory}
      />

      <ConfirmCloseModal
        open={pendingCloseTarget !== null}
        title="Unsaved Changes"
        description="Please confirm before closing this form."
        onKeepEditing={() => setPendingCloseTarget(null)}
        onDiscard={discardPendingChanges}
      />

      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
}