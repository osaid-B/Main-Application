import { useEffect, useMemo, useState } from "react";
import {
  type Product,
  getProducts,
  saveProducts,
} from "../data/storage";

type SortKey = "id" | "name" | "category" | "price" | "stock" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

const productOptions = ["Laptop", "Phone", "Monitor", "Keyboard"];
const categoryOptions = ["Electronics", "Accessories", "Furniture"];

function getProductStatus(stock: number): Product["status"] {
  if (stock <= 0) return "Out of Stock";
  if (stock <= 15) return "Low Stock";
  return "In Stock";
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: "createdAt",
    direction: "desc",
  });

  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
  });

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

  const closeModal = () => {
    setShowModal(false);
    setForm({
      name: "",
      category: "",
      price: "",
      stock: "",
    });
  };

  const handleAddProduct = () => {
    if (!form.name || !form.category || !form.price || !form.stock) return;

    const stockNumber = Number(form.stock);
    const priceNumber = Number(form.price);

    if (Number.isNaN(stockNumber) || Number.isNaN(priceNumber)) return;

    const newProduct: Product = {
      id: `PROD-${1000 + products.length + 1}`,
      name: form.name,
      category: form.category,
      price: priceNumber,
      stock: stockNumber,
      status: getProductStatus(stockNumber),
      createdAt: new Date().toISOString().split("T")[0],
    };

    setProducts((prev) => [newProduct, ...prev]);
    closeModal();
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
      <div className="products-page">
        <div className="products-header">
          <div>
            <p className="dashboard-badge">Product Management</p>
            <h1 className="dashboard-title">Products</h1>
            <p className="dashboard-subtitle">
              Manage your inventory, search products quickly, and add new items easily.
            </p>
          </div>

          <button className="quick-action-btn" onClick={() => setShowModal(true)}>
            + Add Product
          </button>
        </div>

        <div className="products-stats-grid">
          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">📦</span>
              <span className="stat-title">Total Products</span>
            </div>
            <h3 className="stat-value">{products.length}</h3>
            <p className="stat-change">All inventory items</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">✅</span>
              <span className="stat-title">In Stock</span>
            </div>
            <h3 className="stat-value">{inStockCount}</h3>
            <p className="stat-change">Available now</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">⚠️</span>
              <span className="stat-title">Low Stock</span>
            </div>
            <h3 className="stat-value">{lowStockCount}</h3>
            <p className="stat-change">Need attention</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">❌</span>
              <span className="stat-title">Out of Stock</span>
            </div>
            <h3 className="stat-value">{outOfStockCount}</h3>
            <p className="stat-change">Unavailable items</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">💵</span>
              <span className="stat-title">Inventory Value</span>
            </div>
            <h3 className="stat-value">${totalInventoryValue}</h3>
            <p className="stat-change">Based on stock × price</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="products-toolbar">
            <div className="dashboard-search-box products-search-box">
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
            <table className="dashboard-table">
              <thead>
                <tr>
                  {sortableHeader("ID", "id")}
                  {sortableHeader("Name", "name")}
                  {sortableHeader("Category", "category")}
                  {sortableHeader("Price", "price")}
                  {sortableHeader("Stock", "stock")}
                  {sortableHeader("Status", "status")}
                  {sortableHeader("Created", "createdAt")}
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="empty-state-cell">
                      No matching products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Add Product</h2>
                <p>Enter the new product information.</p>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
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

              <div className="modal-actions">
                <button type="button" className="modal-secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="button" className="modal-primary-btn" onClick={handleAddProduct}>
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}