import { useEffect, useMemo, useState } from "react";
import "./Products.css";

import {
  getInvoiceItems,
  getProductCategories,
  getProducts,
  getPurchases,
  getSuppliers,
  saveProductCategories,
  saveProducts,
} from "../data/storage";

import type { InvoiceItem, Product, Purchase, Supplier } from "../data/types";
import { useSettings } from "../context/SettingsContext";

type StockFilter = "" | "in" | "low" | "out";
type ViewMode = "table" | "cards";

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

function getStatusClass(status: string) {
  if (status === "In Stock") return "in";
  if (status === "Low Stock") return "low";
  return "out";
}

function getNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

export default function Products() {
  const { t } = useSettings();

  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [categories, setCategories] = useState<string[]>(() => getProductCategories());
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

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    const derivedCategories = products
      .map((product) => normalizeCategoryName(product.category || ""))
      .filter(Boolean);

    const merged = Array.from(new Set([...categories, ...derivedCategories])).sort((a, b) =>
      a.localeCompare(b)
    );

    if (JSON.stringify(merged) !== JSON.stringify(categories)) {
      setCategories(merged);
      saveProductCategories(merged);
    }
  }, [products, categories]);

  const supplierMap = useMemo(() => {
    const map = new Map<string, string>();
    suppliers.forEach((supplier) => {
      map.set(supplier.id, supplier.name);
    });
    return map;
  }, [suppliers]);

  const productRows = useMemo<ProductRow[]>(() => {
    return products
      .filter((product) => !(product as any).isDeleted)
      .filter((product) => String(product.name || "").trim() !== "")
      .map((product, index) => {
        const productAny = product as any;

        const receivedQuantity = purchases
          .filter((purchase) => purchase.productId === product.id && !(purchase as any).isDeleted)
          .reduce((sum, purchase) => sum + getNumber(purchase.quantity), 0);

        const soldQuantity = invoiceItems
          .filter((item) => item.productId === product.id)
          .reduce((sum, item) => sum + getNumber(item.quantity), 0);

        const baseStock = getNumber(product.stock);
        const available = Math.max(baseStock + receivedQuantity - soldQuantity, 0);

        const salePrice = getNumber(productAny.salePrice ?? product.price);
        const purchasePrice = getNumber(productAny.purchasePrice, salePrice * 0.7);
        const minStock = getNumber(productAny.minStock, 5);

        return {
          ...product,
          code: String(productAny.code || product.id || `SKU-${1000 + index + 1}`),
          salePrice,
          purchasePrice,
          available,
          minStock,
          statusLabel: getStatusLabel(available, minStock),
          supplierId: String(productAny.supplierId || productAny.supplierLink || ""),
          barcode: String(productAny.barcode || ""),
          description: String(productAny.description || ""),
          image: String(productAny.image || ""),
          addedAt: getNumber(productAny.addedAt, Date.now() - index),
        };
      })
      .sort((a, b) => b.addedAt - a.addedAt);
  }, [products, purchases, invoiceItems]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return productRows.filter((product) => {
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

      if (!term) {
        return true;
      }

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
  }, [productRows, searchTerm, filterCategory, filterStock, filterSupplier]);

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

  function openAddModal() {
    resetForm();
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
    resetForm();
  }

  function handleSaveProduct() {
    const code = form.code.trim();
    const name = form.name.trim();
    const category = normalizeCategoryName(form.category);
    const salePrice = Number(form.salePrice);
    const purchasePrice = Number(form.purchasePrice || 0);
    const stock = Number(form.stock || 0);
    const minStock = Number(form.minStock || 5);

    if (!code || !name || !category || Number.isNaN(salePrice)) {
      alert("Please fill code, name, category, and sale price.");
      return;
    }

    const duplicatedCode = products.some((product) => {
      const productAny = product as any;
      return product.id !== form.id && String(productAny.code || "").trim() === code;
    });

    if (duplicatedCode) {
      alert("Product code already exists.");
      return;
    }

    const productToSave: Product = {
      id: form.id || `PROD-${1000 + products.length + 1}`,
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
        ? getNumber((products.find((product) => product.id === form.id) as any)?.addedAt, Date.now())
        : Date.now(),
      isDeleted: false,
    } as Product;

    setProducts((currentProducts) => {
      const exists = currentProducts.some((product) => product.id === productToSave.id);

      if (exists) {
        return currentProducts.map((product) =>
          product.id === productToSave.id ? productToSave : product
        );
      }

      return [productToSave, ...currentProducts];
    });

    setCategories((currentCategories) => {
      const merged = Array.from(new Set([...currentCategories, category])).sort((a, b) =>
        a.localeCompare(b)
      );

      saveProductCategories(merged);
      return merged;
    });

    closeProductModal();
  }

  function handleDeleteProduct(productId: string) {
    const shouldDelete = window.confirm("Delete product?");
    if (!shouldDelete) return;

    setProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== productId)
    );

    setViewProduct(null);
  }

  function clearFilters() {
    setSearchTerm("");
    setFilterCategory("");
    setFilterStock("");
    setFilterSupplier("");
  }

  const productTitle = t.products?.pageTitle || "Products";
  const addProductLabel = t.products?.addProduct || "Add Product";
  const searchPlaceholder =
    t.products?.searchPlaceholder || "Search products, SKU, category...";

  return (
    <div className="products-page compact-products-page">
      <div className="products-header compact-header">
        <div className="header-left">
          <h1 className="page-title">{productTitle}</h1>

          <div className="inline-summary" aria-hidden>
            <span className="summary-item">
              {t.common?.total || "Total"}: {stats.total}
            </span>
            <span className="summary-item muted">
              {t.products?.inStock || "In Stock"}: {stats.inStock}
            </span>
            <span className="summary-item muted">
              {t.products?.low || "Low"}: {stats.lowStock}
            </span>
            <span className="summary-item muted">
              {t.products?.out || "Out"}: {stats.outOfStock}
            </span>
          </div>
        </div>

        <div className="header-right">
          <div className="search-filter-row">
            <input
              className="compact-search"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <button
              type="button"
              className="filter-btn"
              onClick={() => setShowFilters((current) => !current)}
              aria-expanded={showFilters}
            >
              {t.products?.filters || "Filters"}
            </button>

            <button type="button" className="add-product-btn primary" onClick={openAddModal}>
              + {addProductLabel}
            </button>

            <button
              type="button"
              className="view-toggle-btn"
              onClick={() =>
                setViewMode((current) => (current === "table" ? "cards" : "table"))
              }
            >
              {viewMode === "table"
                ? t.products?.viewToggleCards || "Cards"
                : t.products?.viewToggleTable || "Table"}
            </button>
          </div>
        </div>
      </div>

      {showFilters ? (
        <div className="filters-popover" role="dialog">
          <div className="filters-grid">
            <div className="field">
              <label>{t.products?.category || "Category"}</label>
              <select
                value={filterCategory}
                onChange={(event) => setFilterCategory(event.target.value)}
              >
                <option value="">All</option>
                {categories.map((category) => (
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
                onChange={(event) => setFilterStock(event.target.value as StockFilter)}
              >
                <option value="">Any</option>
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
                <option value="">Any</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filters-actions">
              <button type="button" onClick={clearFilters}>
                Reset
              </button>
              <button type="button" className="apply" onClick={() => setShowFilters(false)}>
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="dashboard-card products-results-card compact-results">
        <div className="products-results-meta">
          {filteredProducts.length} record(s)
        </div>

        {viewMode === "table" ? (
          <div className="table-wrapper compact-table-wrapper">
            <table className="dashboard-table compact-dashboard-table" role="grid">
              <thead>
                <tr>
                  <th className="col-product">{t.common?.product || "Product"}</th>
                  <th className="col-category">{t.products?.category || "Category"}</th>
                  <th className="col-supplier">{t.products?.supplier || "Supplier"}</th>
                  <th className="col-stock">{t.products?.stock || "Stock"}</th>
                  <th className="col-purchase">
                    {t.products?.purchasePrice || "Purchase"}
                  </th>
                  <th className="col-sale">{t.products?.salePrice || "Sale"}</th>
                  <th className="col-margin">{t.products?.margin || "Margin"}</th>
                  <th className="col-status">{t.products?.status || "Status"}</th>
                  <th className="col-actions">
                    {t.products?.actions || t.common?.actions || "Actions"}
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const margin = Math.max(product.salePrice - product.purchasePrice, 0);
                    const supplierName = supplierMap.get(product.supplierId) || "—";

                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="product-cell">
                            <div className="product-title">{product.name}</div>
                            <div className="product-sku muted">{product.code}</div>
                          </div>
                        </td>

                        <td>{product.category || "—"}</td>
                        <td>{supplierName}</td>

                        <td>
                          <div className="stock-cell">
                            <strong>{product.available}</strong>
                            {product.statusLabel !== "In Stock" ? (
                              <span className={`badge ${getStatusClass(product.statusLabel)}`}>
                                {product.statusLabel}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td style={{ textAlign: "right" }}>
                          {formatMoney(product.purchasePrice)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {formatMoney(product.salePrice)}
                        </td>
                        <td style={{ textAlign: "right" }}>{formatMoney(margin)}</td>

                        <td style={{ textAlign: "center" }}>
                          <span className={`status-pill ${getStatusClass(product.statusLabel)}`}>
                            {product.statusLabel}
                          </span>
                        </td>

                        <td className="actions-cell">
                          <button
                            type="button"
                            className="table-btn"
                            onClick={() => setViewProduct(product)}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="table-btn edit"
                            onClick={() => openEditModal(product)}
                          >
                            {t.common?.edit || "Edit"}
                          </button>

                          <button
                            type="button"
                            className="table-btn delete"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            {t.common?.delete || "Delete"}
                          </button>
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
        ) : (
          <div className="products-grid compact-cards">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div className="product-mini-card" key={product.id}>
                  <div className="mini-title">{product.name}</div>
                  <div className="mini-sku">{product.code}</div>
                  <div className="mini-meta">{product.category || "—"}</div>

                  <div className="mini-stock">
                    {product.available}{" "}
                    <span className={`pill ${getStatusClass(product.statusLabel)}`}>
                      {product.statusLabel}
                    </span>
                  </div>

                  <div className="mini-meta">
                    {formatMoney(product.salePrice)} / {formatMoney(product.purchasePrice)}
                  </div>

                  <div className="mini-actions">
                    <button type="button" onClick={() => setViewProduct(product)}>
                      View
                    </button>
                    <button type="button" onClick={() => openEditModal(product)}>
                      Edit
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state-box">
                {t.products?.noProducts || "No matching products found."}
              </div>
            )}
          </div>
        )}
      </div>

      {showProductModal ? (
        <div className="modal-overlay" onClick={closeProductModal}>
          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: 720 }}
          >
            <div className="modal-header">
              <div>
                <h2>{form.id ? t.common?.edit || "Edit Product" : addProductLabel}</h2>
                <p>Enter product details.</p>
              </div>

              <button type="button" className="modal-close-btn" onClick={closeProductModal}>
                ×
              </button>
            </div>

            <div className="modal-form">
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <label className="modal-label">Product Code</label>
                  <input
                    className="modal-input"
                    value={form.code}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, code: event.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="modal-label">{t.common?.name || "Name"}</label>
                  <input
                    className="modal-input"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="modal-label">{t.products?.category || "Category"}</label>
                  <input
                    className="modal-input"
                    list="product-categories"
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, category: event.target.value }))
                    }
                  />

                  <datalist id="product-categories">
                    {categories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="modal-label">{t.products?.supplier || "Supplier"}</label>
                  <select
                    className="modal-input"
                    value={form.supplierId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, supplierId: event.target.value }))
                    }
                  >
                    <option value="">No supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="modal-label">
                      {t.products?.purchasePrice || "Purchase Price"}
                    </label>
                    <input
                      className="modal-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.purchasePrice}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          purchasePrice: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="modal-label">
                      {t.products?.salePrice || "Sale Price"}
                    </label>
                    <input
                      className="modal-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.salePrice}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, salePrice: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="modal-label">{t.products?.stock || "Stock"}</label>
                    <input
                      className="modal-input"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, stock: event.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="modal-label">Min Stock</label>
                    <input
                      className="modal-input"
                      type="number"
                      min="0"
                      value={form.minStock}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, minStock: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="modal-label">Barcode</label>
                  <input
                    className="modal-input"
                    value={form.barcode}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, barcode: event.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="modal-label">Description</label>
                  <textarea
                    className="modal-input"
                    rows={3}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="modal-secondary-btn"
                  onClick={closeProductModal}
                >
                  {t.common?.cancel || "Cancel"}
                </button>

                <button
                  type="button"
                  className="modal-primary-btn"
                  onClick={handleSaveProduct}
                >
                  {t.common?.save || "Save Product"}
                </button>
              </div>
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

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewProduct(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-form">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="modal-label">Code</label>
                  <div>{viewProduct.code}</div>
                </div>

                <div>
                  <label className="modal-label">{t.products?.category || "Category"}</label>
                  <div>{viewProduct.category || "—"}</div>
                </div>

                <div>
                  <label className="modal-label">
                    {t.products?.purchasePrice || "Purchase"}
                  </label>
                  <div>{formatMoney(viewProduct.purchasePrice)}</div>
                </div>

                <div>
                  <label className="modal-label">{t.products?.salePrice || "Sale"}</label>
                  <div>{formatMoney(viewProduct.salePrice)}</div>
                </div>

                <div>
                  <label className="modal-label">{t.products?.stock || "Available"}</label>
                  <div>{viewProduct.available}</div>
                </div>

                <div>
                  <label className="modal-label">{t.products?.status || "Status"}</label>
                  <div>{viewProduct.statusLabel}</div>
                </div>

                <div>
                  <label className="modal-label">{t.products?.supplier || "Supplier"}</label>
                  <div>{supplierMap.get(viewProduct.supplierId) || "—"}</div>
                </div>

                <div>
                  <label className="modal-label">Barcode</label>
                  <div>{viewProduct.barcode || "—"}</div>
                </div>
              </div>

              {viewProduct.description ? (
                <div style={{ marginTop: 16 }}>
                  <label className="modal-label">Description</label>
                  <p>{viewProduct.description}</p>
                </div>
              ) : null}

              <div className="modal-actions" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="modal-secondary-btn"
                  onClick={() => openEditModal(viewProduct)}
                >
                  {t.common?.edit || "Edit"}
                </button>

                <button
                  type="button"
                  className="modal-danger-btn"
                  onClick={() => handleDeleteProduct(viewProduct.id)}
                >
                  {t.common?.delete || "Delete"}
                </button>

                <button
                  type="button"
                  className="modal-primary-btn"
                  onClick={() => setViewProduct(null)}
                >
                  {t.common?.close || "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}