import "./Products.css";
import { useEffect, useMemo, useRef, useState } from "react";
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
  name: string;
  category: string;
  price: string;
  stock: string;
};

type FormErrors = {
  name?: string;
  category?: string;
  price?: string;
  stock?: string;
};

type SortKey =
  | "id"
  | "name"
  | "category"
  | "price"
  | "stock"
  | "sold"
  | "available"
  | "status";

type SortMode = "added" | "desc" | "asc";
type PendingCloseTarget = "add" | "edit" | null;

type ProductRow = Product & {
  price: number;
  stock: number;
  sold: number;
  available: number;
  statusLabel: "Out of Stock" | "Low Stock" | "In Stock";
  addedAt: number;
};

const emptyForm: ProductForm = {
  name: "",
  category: "",
  price: "",
  stock: "",
};

const DELETE_CONFIRMATION_CODE = "123";

function normalizeProducts(products: Product[]): Product[] {
  return products.map((product, index) => ({
    ...product,
    id: product.id || `PROD-${1000 + index + 1}`,
    name: product.name || "",
    category: product.category || "",
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    addedAt: Number((product as Product & { addedAt?: number }).addedAt || 0),
  }));
}

function getStatusLabel(available: number): ProductRow["statusLabel"] {
  if (available <= 0) return "Out of Stock";
  if (available <= 5) return "Low Stock";
  return "In Stock";
}

function normalizeCategoryName(value: string) {
  return value.trim().replace(/\s+/g, " ");
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
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
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
        !(target instanceof HTMLElement && target.closest(".floating-category-menu"))
      ) {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
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

  const getCategoryUsageCount = (category: string) => {
    return products.filter(
      (product) =>
        normalizeCategoryName(product.category || "").toLowerCase() ===
        normalizeCategoryName(category).toLowerCase()
    ).length;
  };

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

    if (
      categories.some(
        (category) => category.toLowerCase() === value.toLowerCase()
      )
    ) {
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
        style={{
          width: "min(900px, calc(100vw - 28px))",
          maxHeight: "calc(100vh - 28px)",
          padding: 0,
          overflow: "hidden",
          borderRadius: "28px",
        }}
      >
        <div
          className="modal-header"
          style={{
            padding: "28px 28px 20px",
            borderBottom: "1px solid #e8eef5",
            background:
              "linear-gradient(180deg, rgba(246,250,255,0.95) 0%, rgba(255,255,255,0.98) 100%)",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "999px",
                background: "#eff6ff",
                color: "#2563eb",
                fontSize: "12px",
                fontWeight: 800,
                marginBottom: "12px",
              }}
            >
              Category Control
            </div>
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

        <div
          className="category-manager-scroll"
          style={{
            maxHeight: "calc(100vh - 180px)",
            overflowY: "auto",
            padding: "24px 28px 28px",
          }}
        >
          <div
            className="modal-form category-manager-form"
            style={{ gap: "18px" }}
          >
            <div
              className="category-manager-layout"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "18px",
              }}
            >
              <div
                className="category-panel"
                style={{
                  background: "#fbfdff",
                  border: "1px solid #dfeaf5",
                  borderRadius: "22px",
                  padding: "20px",
                }}
              >
                <div className="category-section">
                  <label className="modal-label">Add New Category</label>
                  <p
                    style={{
                      margin: "0 0 14px",
                      color: "#6b7f95",
                      fontSize: "14px",
                      lineHeight: 1.7,
                    }}
                  >
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

              <div
                className="category-panel"
                style={{
                  background: "#fbfdff",
                  border: "1px solid #dfeaf5",
                  borderRadius: "22px",
                  padding: "20px",
                }}
              >
                <div className="category-section">
                  <label className="modal-label">Rename Category</label>
                  <p
                    style={{
                      margin: "0 0 14px",
                      color: "#6b7f95",
                      fontSize: "14px",
                      lineHeight: 1.7,
                    }}
                  >
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
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "10px 12px",
                        borderRadius: "14px",
                        background: "#f8fbff",
                        border: "1px solid #dbe7f3",
                        color: "#4b6580",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
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

              <div
                className="category-panel"
                style={{
                  background: "#fffaf9",
                  border: "1px solid #f3d5cf",
                  borderRadius: "22px",
                  padding: "20px",
                  gridColumn: "1 / -1",
                }}
              >
                <div className="category-section">
                  <label className="modal-label" style={{ color: "#9f1239" }}>
                    Delete Category
                  </label>
                  <p
                    className="category-helper-text"
                    style={{
                      margin: "0 0 14px",
                      color: "#7c5e57",
                      fontSize: "14px",
                      lineHeight: 1.7,
                    }}
                  >
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
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "10px 12px",
                        borderRadius: "14px",
                        background: "#fff1f2",
                        border: "1px solid #fecdd3",
                        color: "#9f1239",
                        fontSize: "13px",
                        fontWeight: 700,
                      }}
                    >
                      This category is linked to {deleteTargetUsage} product(s).
                    </div>
                  )}

                  <button
                    type="button"
                    className="modal-danger-btn full-width-btn"
                    onClick={handleDeleteRequest}
                    style={{ marginTop: "14px" }}
                  >
                    Continue to Delete
                  </button>
                </div>
              </div>
            </div>

            {selectedCategory && (
              <div
                style={{
                  background: "#f8fbff",
                  border: "1px solid #dbe7f3",
                  borderRadius: "18px",
                  padding: "14px 16px",
                  color: "#4b6580",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Active form category: <strong>{selectedCategory}</strong>
              </div>
            )}

            {error && <p className="field-error">{error}</p>}
          </div>
        </div>

        <div
          className="category-manager-footer"
          style={{
            padding: "18px 28px 24px",
            borderTop: "1px solid #e8eef5",
            background: "#fff",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
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

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<ProductForm>(emptyForm);
  const [addErrors, setAddErrors] = useState<FormErrors>({});

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<ProductForm>(emptyForm);
  const [editErrors, setEditErrors] = useState<FormErrors>({});

  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("added");

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

  const categoryOptions = useMemo(() => {
    return categories
      .map((category) => normalizeCategoryName(category))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [categories]);

  const hasAddUnsavedChanges = useMemo(() => {
    return (
      addForm.name.trim() !== "" ||
      addForm.category.trim() !== "" ||
      addForm.price.trim() !== "" ||
      addForm.stock.trim() !== ""
    );
  }, [addForm]);

  const hasEditUnsavedChanges = useMemo(() => {
    if (!editingProduct) return false;

    return (
      editForm.name.trim() !== (editingProduct.name || "") ||
      editForm.category.trim() !== (editingProduct.category || "") ||
      editForm.price.trim() !== String(editingProduct.price ?? "") ||
      editForm.stock.trim() !== String(editingProduct.stock ?? "")
    );
  }, [editForm, editingProduct]);

  const productRows = useMemo<ProductRow[]>(() => {
    return products
      .filter((product) => product.name?.trim() !== "")
      .map((product) => {
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

        return {
          ...product,
          price: Number(product.price || 0),
          stock: Number(product.stock || 0),
          sold: soldQty,
          available,
          statusLabel: getStatusLabel(available),
          addedAt: Number((product as Product & { addedAt?: number }).addedAt || 0),
        };
      });
  }, [products, purchases, invoiceItems]);

  const filteredAndSortedProducts = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();

    const filtered = productRows.filter((product) => {
      if (!value) return true;

      return [
        product.id,
        product.name,
        product.category,
        product.price,
        product.stock,
        product.sold,
        product.available,
        product.statusLabel,
      ]
        .join(" ")
        .toLowerCase()
        .includes(value);
    });

    if (!sortKey || sortMode === "added") {
      return [...filtered].sort((a, b) => b.addedAt - a.addedAt);
    }

    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      switch (sortKey) {
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "category":
          aValue = a.category;
          bValue = b.category;
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "stock":
          aValue = a.stock;
          bValue = b.stock;
          break;
        case "sold":
          aValue = a.sold;
          bValue = b.sold;
          break;
        case "available":
          aValue = a.available;
          bValue = b.available;
          break;
        case "status":
          aValue = a.statusLabel;
          bValue = b.statusLabel;
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
  }, [productRows, searchTerm, sortKey, sortMode]);

  const validateForm = (form: ProductForm): FormErrors => {
    const errors: FormErrors = {};

    if (!form.name.trim()) {
      errors.name = "Product name is required.";
    }

    if (!form.category.trim()) {
      errors.category = "Category is required.";
    }

    if (!form.price.trim()) {
      errors.price = "Price is required.";
    } else if (Number.isNaN(Number(form.price))) {
      errors.price = "Price must be a valid number.";
    } else if (Number(form.price) < 0) {
      errors.price = "Price cannot be negative.";
    }

    if (!form.stock.trim()) {
      errors.stock = "Base stock is required.";
    } else if (Number.isNaN(Number(form.stock))) {
      errors.stock = "Base stock must be a valid number.";
    } else if (Number(form.stock) < 0) {
      errors.stock = "Base stock cannot be negative.";
    }

    return errors;
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

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name || "",
      category: product.category || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
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
    setSortMode("added");
  };

  const getSortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    if (sortMode === "desc") return "↓";
    if (sortMode === "asc") return "↑";
    return "";
  };

  const handleAddProduct = () => {
    const errors = validateForm(addForm);
    setAddErrors(errors);

    if (Object.keys(errors).length > 0) return;

    const newProduct: Product = {
      id: `PROD-${1000 + products.length + 1}`,
      name: addForm.name.trim(),
      category: normalizeCategoryName(addForm.category),
      price: Number(addForm.price),
      stock: Number(addForm.stock),
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
          ? {
              ...product,
              name: editForm.name.trim(),
              category: normalizeCategoryName(editForm.category),
              price: Number(editForm.price),
              stock: Number(editForm.stock),
            }
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
          ? { ...product, category: newValue }
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
          ? { ...product, category: "" }
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
        <div className="products-header">
          <div>
            <p className="dashboard-badge">Product Management</p>
            <h1 className="dashboard-title">Products</h1>
            <p className="dashboard-subtitle">
              Monitor product pricing, purchases, sales, and calculated stock levels.
            </p>
          </div>

          <button
            type="button"
            className="quick-action-btn"
            onClick={() => setShowAddModal(true)}
          >
            + Add Product
          </button>
        </div>

        <div className="dashboard-card">
          <div className="products-toolbar">
            <div className="dashboard-search-box">
              <label className="dashboard-search-label">Search products</label>
              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Search by product name, category, price, stock, or status."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="dashboard-search-meta">
                {searchTerm.trim()
                  ? `${filteredAndSortedProducts.length} result(s)`
                  : "Search all products"}
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
                  <th className="sortable" onClick={() => handleSort("name")}>
                    <span className="sort-label">Name {getSortIndicator("name")}</span>
                  </th>
                  <th className="sortable" onClick={() => handleSort("category")}>
                    <span className="sort-label">Category {getSortIndicator("category")}</span>
                  </th>
                  <th className="sortable" onClick={() => handleSort("price")}>
                    <span className="sort-label">Price {getSortIndicator("price")}</span>
                  </th>
                  <th className="sortable" onClick={() => handleSort("stock")}>
                    <span className="sort-label">Base Stock {getSortIndicator("stock")}</span>
                  </th>
                  <th className="sortable" onClick={() => handleSort("sold")}>
                    <span className="sort-label">Sold {getSortIndicator("sold")}</span>
                  </th>
                  <th className="sortable" onClick={() => handleSort("available")}>
                    <span className="sort-label">Available {getSortIndicator("available")}</span>
                  </th>
                  <th className="sortable" onClick={() => handleSort("status")}>
                    <span className="sort-label">Status {getSortIndicator("status")}</span>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAndSortedProducts.length > 0 ? (
                  filteredAndSortedProducts.map((product) => (
                    <tr key={`${product.id}-${product.addedAt}`}>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td>{product.category || "Unassigned"}</td>
                      <td>${product.price}</td>
                      <td>{product.stock}</td>
                      <td>{product.sold}</td>
                      <td>{product.available}</td>
                      <td>
                        <span
                          className={
                            product.statusLabel === "Out of Stock"
                              ? "status-badge status-out-of-stock"
                              : product.statusLabel === "Low Stock"
                              ? "status-badge status-low-stock"
                              : "status-badge status-in-stock"
                          }
                        >
                          {product.statusLabel}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="table-btn edit"
                            onClick={() => openEditModal(product)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="table-btn delete"
                            onClick={() => requestDeleteProduct(product)}
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
                      No matching products found.
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
                <h2>Add Product</h2>
                <p>Enter the new product information.</p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={attemptCloseAddModal}
              >
                ×
              </button>
            </div>

            <form className="modal-form">
              <div className="modal-grid">
                <div>
                  <label className="modal-label">Name</label>
                  <input
                    className="modal-input"
                    type="text"
                    placeholder="Enter product name"
                    value={addForm.name}
                    onChange={(e) => {
                      setAddForm((prev) => ({ ...prev, name: e.target.value }));
                      setAddErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                  />
                  {addErrors.name && <p className="field-error">{addErrors.name}</p>}
                </div>

                <div className="category-field">
                  <label className="modal-label">Category</label>

                  <div className="category-select-row">
                    <select
                      className="modal-select"
                      value={addForm.category}
                      onChange={(e) => {
                        setAddForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }));
                        setAddErrors((prev) => ({
                          ...prev,
                          category: undefined,
                        }));
                      }}
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
                      onClick={() => setShowCategoryManager(true)}
                    >
                      Manage
                    </button>
                  </div>

                  {addForm.category && (
                    <div className="selected-category-chip">
                      Selected: {addForm.category}
                    </div>
                  )}

                  {addErrors.category && (
                    <p className="field-error">{addErrors.category}</p>
                  )}
                </div>

                <div>
                  <label className="modal-label">Price</label>
                  <input
                    className="modal-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter price"
                    value={addForm.price}
                    onChange={(e) => {
                      setAddForm((prev) => ({ ...prev, price: e.target.value }));
                      setAddErrors((prev) => ({ ...prev, price: undefined }));
                    }}
                  />
                  {addErrors.price && <p className="field-error">{addErrors.price}</p>}
                </div>

                <div>
                  <label className="modal-label">Base Stock</label>
                  <input
                    className="modal-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Enter initial stock"
                    value={addForm.stock}
                    onChange={(e) => {
                      setAddForm((prev) => ({ ...prev, stock: e.target.value }));
                      setAddErrors((prev) => ({ ...prev, stock: undefined }));
                    }}
                  />
                  {addErrors.stock && <p className="field-error">{addErrors.stock}</p>}
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
                  onClick={handleAddProduct}
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="modal-overlay" onClick={attemptCloseEditModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Edit Product</h2>
                <p>Update the selected product information.</p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={attemptCloseEditModal}
              >
                ×
              </button>
            </div>

            <form className="modal-form">
              <div className="modal-grid">
                <div>
                  <label className="modal-label">Name</label>
                  <input
                    className="modal-input"
                    type="text"
                    placeholder="Enter product name"
                    value={editForm.name}
                    onChange={(e) => {
                      setEditForm((prev) => ({ ...prev, name: e.target.value }));
                      setEditErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                  />
                  {editErrors.name && <p className="field-error">{editErrors.name}</p>}
                </div>

                <div className="category-field">
                  <label className="modal-label">Category</label>

                  <div className="category-select-row">
                    <select
                      className="modal-select"
                      value={editForm.category}
                      onChange={(e) => {
                        setEditForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }));
                        setEditErrors((prev) => ({
                          ...prev,
                          category: undefined,
                        }));
                      }}
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
                      onClick={() => setShowCategoryManager(true)}
                    >
                      Manage
                    </button>
                  </div>

                  {editForm.category && (
                    <div className="selected-category-chip">
                      Selected: {editForm.category}
                    </div>
                  )}

                  {editErrors.category && (
                    <p className="field-error">{editErrors.category}</p>
                  )}
                </div>

                <div>
                  <label className="modal-label">Price</label>
                  <input
                    className="modal-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter price"
                    value={editForm.price}
                    onChange={(e) => {
                      setEditForm((prev) => ({ ...prev, price: e.target.value }));
                      setEditErrors((prev) => ({ ...prev, price: undefined }));
                    }}
                  />
                  {editErrors.price && <p className="field-error">{editErrors.price}</p>}
                </div>

                <div>
                  <label className="modal-label">Base Stock</label>
                  <input
                    className="modal-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Enter initial stock"
                    value={editForm.stock}
                    onChange={(e) => {
                      setEditForm((prev) => ({ ...prev, stock: e.target.value }));
                      setEditErrors((prev) => ({ ...prev, stock: undefined }));
                    }}
                  />
                  {editErrors.stock && <p className="field-error">{editErrors.stock}</p>}
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
                  onClick={handleEditProduct}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
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
            setEditForm((prev) => ({ ...prev, category: value }));
            setEditErrors((prev) => ({ ...prev, category: undefined }));
          } else {
            setAddForm((prev) => ({ ...prev, category: value }));
            setAddErrors((prev) => ({ ...prev, category: undefined }));
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
    </>
  );
}