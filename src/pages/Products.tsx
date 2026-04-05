import { useEffect, useMemo, useState } from "react";
import {
  type Product,
  getProducts,
  saveProducts,
} from "../data/storage";

type SortKey =
  | "id"
  | "name"
  | "category"
  | "price"
  | "stock"
  | "status"
  | "createdAt";

type SortDirection = "asc" | "desc";

const productOptions = ["Laptop", "Phone", "Monitor", "Keyboard"];
const categoryOptions = ["Electronics", "Accessories", "Furniture"];

type ProductForm = {
  name: string;
  category: string;
  price: string;
  stock: string;
  imageUrl: string;
};

const initialForm: ProductForm = {
  name: "",
  category: "",
  price: "",
  stock: "",
  imageUrl: "",
};

function getProductStatus(stock: number): Product["status"] {
  if (stock <= 0) return "Out of Stock";
  if (stock <= 15) return "Low Stock";
  return "In Stock";
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [searchTerm, setSearchTerm] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: "createdAt",
    direction: "desc",
  });

  const [form, setForm] = useState<ProductForm>(initialForm);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmValue, setDeleteConfirmValue] = useState("");

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  const requestSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredProducts = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();

    const filtered = products.filter((product) =>
      [
        product.id,
        product.name,
        product.category,
        product.price,
        product.stock,
        product.status,
        product.createdAt,
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );

    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, searchTerm, sortConfig]);

  const inStockCount = products.filter((product) => product.status === "In Stock").length;
  const lowStockCount = products.filter((product) => product.status === "Low Stock").length;
  const outOfStockCount = products.filter((product) => product.status === "Out of Stock").length;

  const totalInventoryValue = products.reduce(
    (sum, product) => sum + product.price * product.stock,
    0
  );

  const resetFormState = () => {
    setForm(initialForm);
    setSelectedProduct(null);
    setIsEditing(false);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    resetFormState();
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedProduct(null);
    setDeleteConfirmValue("");
  };

  const openAddModal = () => {
    resetFormState();
    setShowFormModal(true);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setIsEditing(true);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      imageUrl: product.imageUrl || "",
    });
    setShowFormModal(true);
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setDeleteConfirmValue("");
    setShowDeleteModal(true);
  };

  const handleImageUpload = (file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        imageUrl: String(reader.result || ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = () => {
    if (!form.name || !form.category || !form.price || !form.stock) return;

    const stockNumber = Number(form.stock);
    const priceNumber = Number(form.price);

    if (Number.isNaN(stockNumber) || Number.isNaN(priceNumber)) return;

    const payload: Omit<Product, "id" | "createdAt"> = {
      name: form.name,
      category: form.category,
      price: priceNumber,
      stock: stockNumber,
      status: getProductStatus(stockNumber),
      imageUrl: form.imageUrl.trim() || undefined,
    };

    if (isEditing && selectedProduct) {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === selectedProduct.id
            ? {
                ...product,
                ...payload,
              }
            : product
        )
      );
    } else {
      const newProduct: Product = {
        id: `PROD-${1000 + products.length + 1}`,
        createdAt: new Date().toISOString().split("T")[0],
        ...payload,
      };

      setProducts((prev) => [newProduct, ...prev]);
    }

    closeFormModal();
  };

  const handleDeleteProduct = () => {
    if (!selectedProduct) return;
    if (deleteConfirmValue.trim() !== selectedProduct.id) return;

    setProducts((prev) =>
      prev.filter((product) => product.id !== selectedProduct.id)
    );

    closeDeleteModal();
  };

  const sortableHeader = (label: string, key: SortKey) => (
    <th
      style={{ cursor: "pointer" }}
      onClick={() => requestSort(key)}
      title={`Sort by ${label}`}
    >
      {label} {sortConfig.key === key ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <>
      <div className="products-page products-enhanced-page">
        <div className="products-header enhanced-page-header">
          <div>
            <p className="dashboard-badge">Product Management</p>
            <h1 className="dashboard-title">Products</h1>
            <p className="dashboard-subtitle">
              Manage your inventory, upload product images, edit items, and delete them safely.
            </p>
          </div>

          <button className="quick-action-btn" onClick={openAddModal}>
            + Add Product
          </button>
        </div>

        <div className="products-hero-grid">
          <div className="product-hero-card product-hero-primary">
            <div className="product-hero-top">
              <span className="product-hero-icon">📦</span>
              <div>
                <h3>Total Products</h3>
                <p>All inventory items</p>
              </div>
            </div>
            <strong>{products.length}</strong>
          </div>

          <div className="product-hero-card">
            <div className="product-hero-top">
              <span className="product-hero-icon">✅</span>
              <div>
                <h3>In Stock</h3>
                <p>Available now</p>
              </div>
            </div>
            <strong>{inStockCount}</strong>
          </div>

          <div className="product-hero-card">
            <div className="product-hero-top">
              <span className="product-hero-icon">⚠️</span>
              <div>
                <h3>Low Stock</h3>
                <p>Need attention</p>
              </div>
            </div>
            <strong>{lowStockCount}</strong>
          </div>

          <div className="product-hero-card">
            <div className="product-hero-top">
              <span className="product-hero-icon">❌</span>
              <div>
                <h3>Out of Stock</h3>
                <p>Unavailable items</p>
              </div>
            </div>
            <strong>{outOfStockCount}</strong>
          </div>

          <div className="product-hero-card">
            <div className="product-hero-top">
              <span className="product-hero-icon">💵</span>
              <div>
                <h3>Inventory Value</h3>
                <p>Based on stock × price</p>
              </div>
            </div>
            <strong>${totalInventoryValue}</strong>
          </div>
        </div>

        <div className="dashboard-card products-table-card">
          <div className="products-toolbar enhanced-toolbar">
            <div className="dashboard-search-box products-search-box enhanced-search-box">
              <label className="dashboard-search-label">Search products</label>
              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Search by name, category, stock, status..."
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
            <table className="dashboard-table products-enhanced-table">
              <thead>
                <tr>
                  <th>Image</th>
                  {sortableHeader("ID", "id")}
                  {sortableHeader("Name", "name")}
                  {sortableHeader("Category", "category")}
                  {sortableHeader("Price", "price")}
                  {sortableHeader("Stock", "stock")}
                  {sortableHeader("Status", "status")}
                  {sortableHeader("Created", "createdAt")}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-image-cell">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="product-thumb"
                            />
                          ) : (
                            <div className="product-thumb placeholder-thumb">No Image</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="product-id-badge">{product.id}</span>
                      </td>
                      <td>
                        <div className="product-main-cell">
                          <strong>{product.name}</strong>
                          <span>Inventory item</span>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td>${product.price}</td>
                      <td>{product.stock}</td>
                      <td>
                        <span
                          className={
                            product.status === "In Stock"
                              ? "status-badge status-paid"
                              : product.status === "Low Stock"
                              ? "status-badge status-pending"
                              : "status-badge status-out"
                          }
                        >
                          {product.status}
                        </span>
                      </td>
                      <td>{product.createdAt}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="table-action-btn edit-btn"
                            onClick={() => openEditModal(product)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="table-action-btn delete-btn"
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

      {showFormModal && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-card enhanced-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{isEditing ? "Edit Product" : "Add Product"}</h2>
                <p>
                  {isEditing
                    ? "Update product information and image."
                    : "Enter the new product information and upload an image."}
                </p>
              </div>
              <button className="modal-close-btn" onClick={closeFormModal}>
                ×
              </button>
            </div>

            <form className="modal-form">
              <div>
                <label className="modal-label">Product Name</label>
                <select
                  className="modal-input"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                >
                  <option value="">Select product</option>
                  {productOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="modal-label">Category</label>
                <select
                  className="modal-input"
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="modal-label">Price</label>
                <input
                  className="modal-input"
                  type="number"
                  placeholder="Enter price"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>

              <div>
                <label className="modal-label">Stock</label>
                <input
                  className="modal-input"
                  type="number"
                  placeholder="Enter stock quantity"
                  value={form.stock}
                  onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                />
              </div>

              <div>
                <label className="modal-label">Image URL</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Paste image URL"
                  value={form.imageUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                />
              </div>

              <div>
                <label className="modal-label">Upload Image</label>
                <input
                  className="modal-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files?.[0] || null)}
                />
              </div>

              {form.imageUrl ? (
                <div className="product-preview-box">
                  <label className="modal-label">Preview</label>
                  <img src={form.imageUrl} alt="Preview" className="product-preview-image" />
                </div>
              ) : null}

              <div className="modal-actions">
                <button type="button" className="modal-secondary-btn" onClick={closeFormModal}>
                  Cancel
                </button>
                <button type="button" className="modal-primary-btn" onClick={handleSaveProduct}>
                  {isEditing ? "Save Changes" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedProduct && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-card delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Delete Product</h2>
                <p>
                  This action cannot be undone. Type the product ID exactly to confirm deletion.
                </p>
              </div>
              <button className="modal-close-btn" onClick={closeDeleteModal}>
                ×
              </button>
            </div>

            <div className="delete-confirm-box">
              <div className="delete-warning-card">
                <strong>{selectedProduct.name}</strong>
                <p>{selectedProduct.category}</p>
                <span className="delete-id-tag">{selectedProduct.id}</span>
              </div>

              <label className="modal-label">
                Type this ID to confirm: <strong>{selectedProduct.id}</strong>
              </label>
              <input
                className="modal-input"
                type="text"
                placeholder={`Type ${selectedProduct.id}`}
                value={deleteConfirmValue}
                onChange={(e) => setDeleteConfirmValue(e.target.value)}
              />

              <div className="modal-actions">
                <button type="button" className="modal-secondary-btn" onClick={closeDeleteModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="modal-danger-btn"
                  onClick={handleDeleteProduct}
                  disabled={deleteConfirmValue.trim() !== selectedProduct.id}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}