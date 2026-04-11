import { useEffect, useMemo, useState } from "react";
import {
  getInvoiceItems,
  getProducts,
  getPurchases,
  saveProducts,
} from "../data/storage";
import {
  calculateProductSoldQuantity,
  
} from "../data/relations";
import type {
  InvoiceItem,
  Product,
  ProductStatus,
  Purchase,
} from "../data/types";

type ExtendedProduct = Product & {
  purchasedQuantity: number;
  soldQuantity: number;
  calculatedStock: number;
  calculatedStatus: ProductStatus;
};

type ProductForm = {
  name: string;
  category: string;
  price: string;
  stock: string;
};

type ProductFormErrors = {
  name?: string;
  category?: string;
  price?: string;
  stock?: string;
};

const EMPTY_FORM: ProductForm = {
  name: "",
  category: "",
  price: "",
  stock: "",
};

function getCalculatedProductStatus(stock: number): ProductStatus {
  if (stock <= 0) return "Out of Stock";
  if (stock <= 15) return "Low Stock";
  return "In Stock";
}

function calculatePurchasedQuantity(productId: string, purchases: Purchase[]) {
  return purchases
    .filter((purchase) => purchase.productId === productId)
    .filter((purchase) => purchase.status === "Received")
    .reduce((sum, purchase) => sum + Number(purchase.quantity || 0), 0);
}

function buildProductsWithRelations(
  products: Product[],
  purchases: Purchase[],
  invoiceItems: InvoiceItem[]
): ExtendedProduct[] {
  return products.map((product) => {
    const purchasedQuantity = calculatePurchasedQuantity(product.id, purchases);
    const soldQuantity = calculateProductSoldQuantity(product.id, invoiceItems);

    const baseStock = Number(product.stock || 0);
    const calculatedStock = Math.max(baseStock + purchasedQuantity - soldQuantity, 0);
    const calculatedStatus = getCalculatedProductStatus(calculatedStock);

    return {
      ...product,
      purchasedQuantity,
      soldQuantity,
      calculatedStock,
      calculatedStatus,
    };
  });
}

export default function Products() {
  const [purchases] = useState<Purchase[]>(() => getPurchases());
  const [invoiceItems] = useState<InvoiceItem[]>(() => getInvoiceItems());

  const [products, setProducts] = useState<ExtendedProduct[]>(() =>
    buildProductsWithRelations(getProducts(), getPurchases(), getInvoiceItems())
  );

  const [searchTerm, setSearchTerm] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<ExtendedProduct | null>(null);

  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<ProductFormErrors>({});
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

  const filteredProducts = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();
    if (!value) return products;

    return products.filter((product) =>
      [
        product.id,
        product.name,
        product.category,
        product.price,
        product.stock,
        product.calculatedStock,
        product.calculatedStatus,
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [products, searchTerm]);

  const validateForm = (data: ProductForm) => {
    const nextErrors: ProductFormErrors = {};

    if (!data.name.trim()) {
      nextErrors.name = "Product name is required.";
    }

    if (!data.category.trim()) {
      nextErrors.category = "Category is required.";
    }

    if (data.price.trim() === "") {
      nextErrors.price = "Price is required.";
    } else if (Number.isNaN(Number(data.price))) {
      nextErrors.price = "Price must be a valid number.";
    } else if (Number(data.price) < 0) {
      nextErrors.price = "Price cannot be negative.";
    }

    if (data.stock.trim() === "") {
      nextErrors.stock = "Initial stock is required.";
    } else if (Number.isNaN(Number(data.stock))) {
      nextErrors.stock = "Stock must be a valid number.";
    } else if (Number(data.stock) < 0) {
      nextErrors.stock = "Stock cannot be negative.";
    }

    return nextErrors;
  };

  const refreshProducts = (updatedProducts: Product[]) => {
    saveProducts(updatedProducts);
    setProducts(buildProductsWithRelations(updatedProducts, purchases, invoiceItems));
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
    setSelectedProduct(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedProduct(null);
    setDeleteConfirmText("");
  };

  const handleFormFieldChange = (field: keyof ProductForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    setErrors((prev) => {
      const next = { ...prev };

      if (field === "name") {
        if (!value.trim()) next.name = "Product name is required.";
        else delete next.name;
      }

      if (field === "category") {
        if (!value.trim()) next.category = "Category is required.";
        else delete next.category;
      }

      if (field === "price") {
        if (value.trim() === "") next.price = "Price is required.";
        else if (Number.isNaN(Number(value))) next.price = "Price must be a valid number.";
        else if (Number(value) < 0) next.price = "Price cannot be negative.";
        else delete next.price;
      }

      if (field === "stock") {
        if (value.trim() === "") next.stock = "Initial stock is required.";
        else if (Number.isNaN(Number(value))) next.stock = "Stock must be a valid number.";
        else if (Number(value) < 0) next.stock = "Stock cannot be negative.";
        else delete next.stock;
      }

      return next;
    });
  };

  const handleAddProduct = () => {
    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    const currentProducts = getProducts();

    const initialStock = Number(form.stock);
    const newProduct: Product = {
      id: `PROD-${1000 + currentProducts.length + 1}`,
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      stock: initialStock,
      status: getCalculatedProductStatus(initialStock),
      createdAt: new Date().toISOString().split("T")[0],
      isDeleted: false,
    };

    const updatedProducts = [newProduct, ...currentProducts];
    refreshProducts(updatedProducts);

    closeAddModal();
    showSuccessToast("Product added successfully.");
  };

  const openEditModal = (product: ExtendedProduct) => {
    setSelectedProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
    });
    setErrors({});
    setShowEditModal(true);
  };

  const handleConfirmEdit = () => {
    if (!selectedProduct) return;

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    const updatedProducts = getProducts().map((product) =>
      product.id === selectedProduct.id
        ? {
            ...product,
            name: form.name.trim(),
            category: form.category.trim(),
            price: Number(form.price),
            stock: Number(form.stock),
            status: getCalculatedProductStatus(Number(form.stock)),
          }
        : product
    );

    refreshProducts(updatedProducts);
    closeEditModal();
    showSuccessToast("Product updated successfully.");
  };

  const openDeleteModal = (product: ExtendedProduct) => {
    setSelectedProduct(product);
    setDeleteConfirmText("");
    setShowDeleteModal(true);
  };

  const handleDeleteProduct = () => {
    if (!selectedProduct || deleteConfirmText !== "DELETE") return;

    const linkedInvoiceItems = invoiceItems.some(
      (item) => item.productId === selectedProduct.id
    );

    const linkedPurchases = purchases.some(
      (purchase) => purchase.productId === selectedProduct.id
    );

    if (linkedInvoiceItems || linkedPurchases) {
      showSuccessToast("Cannot delete product because it is linked to purchases or invoices.");
      closeDeleteModal();
      return;
    }

    const updatedProducts = getProducts().filter(
      (product) => product.id !== selectedProduct.id
    );

    refreshProducts(updatedProducts);
    closeDeleteModal();
    showSuccessToast("Product deleted successfully.");
  };

  const deleteEnabled = deleteConfirmText === "DELETE";

  const priceInvalid =
    form.price.trim() === "" ||
    Number.isNaN(Number(form.price)) ||
    Number(form.price) < 0;

  const stockInvalid =
    form.stock.trim() === "" ||
    Number.isNaN(Number(form.stock)) ||
    Number(form.stock) < 0;

  return (
    <>
      <style>{`
        .products-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .products-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }

        .products-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
        }

        .products-search-box {
          flex: 1;
          min-width: 260px;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .dashboard-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1240px;
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
          min-width: 90px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .status-in-stock {
          background: rgba(34, 197, 94, 0.12);
          color: #15803d;
        }

        .status-low-stock {
          background: rgba(245, 158, 11, 0.14);
          color: #b45309;
        }

        .status-out-of-stock {
          background: rgba(239, 68, 68, 0.12);
          color: #b91c1c;
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
        .modal-secondary-btn:disabled,
        .modal-danger-btn:disabled {
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

      <div className="products-page">
        <div className="products-header">
          <div>
            <p className="dashboard-badge">Product Management</p>
            <h1 className="dashboard-title">Products</h1>
            <p className="dashboard-subtitle">
              Monitor product pricing, purchases, sales, and calculated stock levels.
            </p>
          </div>

          <button className="quick-action-btn" onClick={() => setShowAddModal(true)}>
            + Add Product
          </button>
        </div>

        <div className="dashboard-card">
          <div className="products-toolbar">
            <div className="dashboard-search-box products-search-box">
              <label className="dashboard-search-label">Search products</label>
              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Search by product name, category, price, stock, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="dashboard-search-meta">
                {searchTerm.trim()
                  ? `${filteredProducts.length} result(s)`
                  : "Search all products"}
              </span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Base Stock</th>
                  <th>Purchased</th>
                  <th>Sold</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>${product.price}</td>
                      <td>{product.stock}</td>
                      <td>{product.purchasedQuantity}</td>
                      <td>{product.soldQuantity}</td>
                      <td>{product.calculatedStock}</td>
                      <td>
                        <span
                          className={
                            product.calculatedStatus === "In Stock"
                              ? "status-badge status-in-stock"
                              : product.calculatedStatus === "Low Stock"
                              ? "status-badge status-low-stock"
                              : "status-badge status-out-of-stock"
                          }
                        >
                          {product.calculatedStatus}
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
                            onClick={() => openDeleteModal(product)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="empty-state-cell">
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
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Add Product</h2>
                <p>Enter the new product information.</p>
              </div>
              <button className="modal-close-btn" onClick={closeAddModal}>
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
              <div className="modal-grid">
                <div>
                  <label className="modal-label">Name</label>
                  <input
                    className="modal-input"
                    type="text"
                    placeholder="Enter product name"
                    value={form.name}
                    onChange={(e) => handleFormFieldChange("name", e.target.value)}
                  />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </div>

                <div>
                  <label className="modal-label">Category</label>
                  <input
                    className="modal-input"
                    type="text"
                    placeholder="Enter category"
                    value={form.category}
                    onChange={(e) => handleFormFieldChange("category", e.target.value)}
                  />
                  {errors.category && (
                    <span className="field-error">{errors.category}</span>
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
                    value={form.price}
                    onChange={(e) => handleFormFieldChange("price", e.target.value)}
                  />
                  {errors.price && <span className="field-error">{errors.price}</span>}
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
                    onChange={(e) => handleFormFieldChange("stock", e.target.value)}
                  />
                  {errors.stock && <span className="field-error">{errors.stock}</span>}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-secondary-btn" onClick={closeAddModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="modal-primary-btn"
                  onClick={handleAddProduct}
                  disabled={priceInvalid || stockInvalid}
                >
                  Save Product
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
                <h2>Edit Product</h2>
                <p>Update the product details below.</p>
              </div>
              <button className="modal-close-btn" onClick={closeEditModal}>
                ×
              </button>
            </div>

            <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
              <div className="modal-grid">
                <div>
                  <label className="modal-label">Name</label>
                  <input
                    className="modal-input"
                    type="text"
                    placeholder="Enter product name"
                    value={form.name}
                    onChange={(e) => handleFormFieldChange("name", e.target.value)}
                  />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </div>

                <div>
                  <label className="modal-label">Category</label>
                  <input
                    className="modal-input"
                    type="text"
                    placeholder="Enter category"
                    value={form.category}
                    onChange={(e) => handleFormFieldChange("category", e.target.value)}
                  />
                  {errors.category && (
                    <span className="field-error">{errors.category}</span>
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
                    value={form.price}
                    onChange={(e) => handleFormFieldChange("price", e.target.value)}
                  />
                  {errors.price && <span className="field-error">{errors.price}</span>}
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
                    onChange={(e) => handleFormFieldChange("stock", e.target.value)}
                  />
                  {errors.stock && <span className="field-error">{errors.stock}</span>}
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
                  disabled={priceInvalid || stockInvalid}
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
                <h2>Delete Product</h2>
                <p>This action cannot be undone.</p>
              </div>
              <button className="modal-close-btn" onClick={closeDeleteModal}>
                ×
              </button>
            </div>

            <div className="modal-content">
              <p className="danger-text">
                You are about to permanently delete product {selectedProduct?.name}.
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
                  onClick={handleDeleteProduct}
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