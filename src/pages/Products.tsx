import "./Products.css";
import React, { useEffect, useMemo, useState } from "react";
import {
  getInvoiceItems,
  getProductCategories,
  getProducts,
  getPurchases,
  saveProducts,
  getSuppliers,
  saveProductCategories,
} from "../data/storage";
import type { Product, Purchase, InvoiceItem, Supplier } from "../data/types";

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
  // Data sources
  const [rawProducts, setRawProducts] = useState<Product[]>(() => getProducts());
  const [categories, setCategories] = useState<string[]>(() => getProductCategories());
  const [purchases] = useState<Purchase[]>(() => getPurchases());
  const [invoiceItems] = useState<InvoiceItem[]>(() => getInvoiceItems());
  const [suppliers] = useState<Supplier[]>(() => getSuppliers());

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const [filterCategory, setFilterCategory] = useState("");
  const [filterStock, setFilterStock] = useState<"" | "in" | "low" | "out" | "">("");
  const [filterSupplier, setFilterSupplier] = useState<string>("");

  // Simple add product modal state
  const [showAddModal, setShowAddModal] = useState(false);
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
    }
  }, [rawProducts]);

  // Add product handler
  function handleAddProduct() {
    const errors: string[] = [];
    if (!addForm.code.trim()) errors.push("code");
    if (!addForm.name.trim()) errors.push("name");
    if (!addForm.category.trim()) errors.push("category");
    if (!addForm.salePrice.trim() || Number.isNaN(Number(addForm.salePrice))) errors.push("salePrice");

    if (errors.length) {
      // simple alert behavior for now
      alert("Please fill required fields (code, name, category, sale price)");
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
    if (!confirm("Delete product?")) return;
    setRawProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="products-page compact-products-page">
      {/* Header */}
      <div className="products-header compact-header">
        <div className="header-left">
          <h1 className="page-title">Products</h1>
          <div className="inline-summary" aria-hidden>
            <span className="summary-item">Total: {productRows.length}</span>
            <span className="summary-item muted">In: {productRows.filter(p=>p.available>0).length}</span>
            <span className="summary-item muted">Low: {productRows.filter(p=>p.statusLabel==='Low Stock').length}</span>
          </div>
        </div>

        <div className="header-right">
          <div className="search-filter-row">
            <input
              className="compact-search"
              placeholder="Search products, SKU, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <button className="filter-btn" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
              Filters
            </button>

            <button className="add-product-btn primary" onClick={() => setShowAddModal(true)}>
              + Add Product
            </button>

            <button className="view-toggle-btn" onClick={() => setViewMode((v) => (v === "table" ? "cards" : "table"))}>
              {viewMode === "table" ? "Cards" : "Table"}
            </button>
          </div>
        </div>
      </div>

      {/* Filters popover */}
      {showFilters && (
        <div className="filters-popover" role="dialog">
          <div className="filters-grid">
            <div className="field">
              <label>Category</label>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Stock</label>
              <select value={filterStock} onChange={(e) => setFilterStock(e.target.value as any)}>
                <option value="">Any</option>
                <option value="in">In stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out</option>
              </select>
            </div>

            <div className="field">
              <label>Supplier</label>
              <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}>
                <option value="">Any</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="filters-actions">
              <button onClick={() => { setFilterCategory(""); setFilterStock(""); setFilterSupplier(""); }}>Reset</button>
              <button className="apply" onClick={() => setShowFilters(false)}>Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Results meta */}
      <div className="dashboard-card products-results-card compact-results">
        <div className="products-results-meta">
          {searchTerm.trim() ? `${filteredProducts.length} result(s)` : `${filteredProducts.length} product(s)`}
        </div>

        {/* Main list */}
        {viewMode === "table" ? (
          <div className="table-wrapper compact-table-wrapper">
            <table className="dashboard-table compact-dashboard-table" role="grid" aria-label="Products table">
              <thead>
                <tr>
                  <th className="col-product">Product</th>
                  <th className="col-category">Category</th>
                  <th className="col-supplier">Supplier</th>
                  <th className="col-stock">Stock</th>
                  <th className="col-purchase">Purchase</th>
                  <th className="col-sale">Sale</th>
                  <th className="col-margin">Margin</th>
                  <th className="col-status">Status</th>
                  <th className="col-actions">Actions</th>
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
                            <span className="badge low">Low</span>
                          ) : (p as any).available <= 0 ? (
                            <span className="badge out">Out</span>
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
                        <button className="table-btn" onClick={() => setViewProduct(p)}>View</button>
                        <button className="table-btn edit" onClick={() => { setAddForm({ ...addForm, code: (p as any).code || p.id, name: p.name, category: p.category, salePrice: String((p as any).salePrice || p.price || 0), purchasePrice: String((p as any).purchasePrice || 0), stock: String(p.stock || 0) }); setShowAddModal(true); }}>Edit</button>
                        <button className="table-btn delete" onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={9} className="empty-state-cell">No matching products found.</td>
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
                  <button onClick={() => setViewProduct(product)}>View</button>
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
                <h2>{addForm.name ? "Edit Product" : "Add Product"}</h2>
                <p>Enter product details.</p>
              </div>

              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <div className="modal-form">
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label className="modal-label">Product Code</label>
                  <input className="modal-input" value={addForm.code} onChange={(e)=>setAddForm({...addForm, code: e.target.value})} />
                </div>

                <div>
                  <label className="modal-label">Name</label>
                  <input className="modal-input" value={addForm.name} onChange={(e)=>setAddForm({...addForm, name: e.target.value})} />
                </div>

                <div>
                  <label className="modal-label">Category</label>
                  <input className="modal-input" value={addForm.category} onChange={(e)=>setAddForm({...addForm, category: e.target.value})} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="modal-label">Purchase Price</label>
                    <input className="modal-input" value={addForm.purchasePrice} onChange={(e)=>setAddForm({...addForm, purchasePrice: e.target.value})} />
                  </div>

                  <div>
                    <label className="modal-label">Sale Price</label>
                    <input className="modal-input" value={addForm.salePrice} onChange={(e)=>setAddForm({...addForm, salePrice: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="modal-label">Stock</label>
                    <input className="modal-input" value={addForm.stock} onChange={(e)=>setAddForm({...addForm, stock: e.target.value})} />
                  </div>

                  <div>
                    <label className="modal-label">Min Stock</label>
                    <input className="modal-input" value={addForm.minStock} onChange={(e)=>setAddForm({...addForm, minStock: e.target.value})} />
                  </div>
                </div>

              </div>

              <div className="modal-actions" style={{ marginTop: 12 }}>
                <button className="modal-secondary-btn" onClick={()=>setShowAddModal(false)}>Cancel</button>
                <button className="modal-primary-btn" onClick={handleAddProduct}>Save Product</button>
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
                <p>Product details</p>
              </div>
              <button className="modal-close-btn" onClick={()=>setViewProduct(null)}>×</button>
            </div>

            <div className="modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="modal-label">Code</label>
                  <div>{(viewProduct as any).code || viewProduct.id}</div>
                </div>
                <div>
                  <label className="modal-label">Category</label>
                  <div>{viewProduct.category || '—'}</div>
                </div>

                <div>
                  <label className="modal-label">Purchase</label>
                  <div>{formatMoney((viewProduct as any).purchasePrice || 0)}</div>
                </div>
                <div>
                  <label className="modal-label">Sale</label>
                  <div>{formatMoney((viewProduct as any).salePrice || viewProduct.price || 0)}</div>
                </div>

                <div>
                  <label className="modal-label">Available</label>
                  <div>{(viewProduct as any).available}</div>
                </div>
                <div>
                  <label className="modal-label">Status</label>
                  <div>{getStatusLabel((viewProduct as any).available || 0, (viewProduct as any).minStock || 5)}</div>
                </div>

              </div>

              <div style={{ marginTop: 12 }}>
                <button className="modal-primary-btn" onClick={() => setViewProduct(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
