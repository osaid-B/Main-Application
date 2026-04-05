import { useEffect, useMemo, useState } from "react";
import {
  type Purchase,
  getCustomers,
  getProducts,
  getPurchases,
  savePurchases,
} from "../data/storage";

type SortKey =
  | "id"
  | "customer"
  | "product"
  | "quantity"
  | "totalCost"
  | "paidAmount"
  | "remainingDebt"
  | "date"
  | "status";

type SortDirection = "asc" | "desc";

function getPurchaseStatus(totalCost: number, paidAmount: number): Purchase["status"] {
  if (paidAmount >= totalCost) return "Paid";
  if (paidAmount > 0) return "Partial";
  return "Debt";
}

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>(() => getPurchases());
  const [customers] = useState(() => getCustomers());
  const [products] = useState(() => getProducts());
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: "date",
    direction: "desc",
  });

  const [form, setForm] = useState({
    customer: "",
    product: "",
    quantity: "",
    totalCost: "",
    paidAmount: "",
  });

  useEffect(() => {
    savePurchases(purchases);
  }, [purchases]);

  const customerCurrentDebt = useMemo(() => {
    if (!form.customer) return 0;

    return purchases
      .filter((purchase) => purchase.customer === form.customer)
      .reduce((sum, purchase) => sum + purchase.remainingDebt, 0);
  }, [form.customer, purchases]);

  const requestSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredPurchases = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();

    const filtered = purchases.filter((purchase) =>
      [
        purchase.id,
        purchase.customer,
        purchase.product,
        purchase.quantity,
        purchase.totalCost,
        purchase.paidAmount,
        purchase.remainingDebt,
        purchase.date,
        purchase.status,
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
  }, [purchases, searchTerm, sortConfig]);

  const paidCount = purchases.filter((purchase) => purchase.status === "Paid").length;
  const partialCount = purchases.filter((purchase) => purchase.status === "Partial").length;
  const debtCount = purchases.filter((purchase) => purchase.status === "Debt").length;
  const totalCostValue = purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
  const totalQuantity = purchases.reduce((sum, purchase) => sum + purchase.quantity, 0);
  const totalDebt = purchases.reduce((sum, purchase) => sum + purchase.remainingDebt, 0);

  const closeModal = () => {
    setShowModal(false);
    setForm({
      customer: "",
      product: "",
      quantity: "",
      totalCost: "",
      paidAmount: "",
    });
  };

  const handleProductChange = (productName: string) => {
    const selectedProduct = products.find((product) => product.name === productName);

    setForm((prev) => ({
      ...prev,
      product: productName,
      totalCost: selectedProduct ? String(selectedProduct.price) : prev.totalCost,
    }));
  };

  const handleAddPurchase = () => {
    if (!form.customer || !form.product || !form.quantity || !form.totalCost) return;

    const quantityNumber = Number(form.quantity);
    const totalCostNumber = Number(form.totalCost);
    const paidAmountNumber = Number(form.paidAmount || "0");

    if (
      Number.isNaN(quantityNumber) ||
      Number.isNaN(totalCostNumber) ||
      Number.isNaN(paidAmountNumber)
    ) {
      return;
    }

    const remainingDebt = Math.max(totalCostNumber - paidAmountNumber, 0);
    const status = getPurchaseStatus(totalCostNumber, paidAmountNumber);

    const newPurchase: Purchase = {
      id: `PUR-${3000 + purchases.length + 1}`,
      customer: form.customer,
      product: form.product,
      quantity: quantityNumber,
      totalCost: totalCostNumber,
      paidAmount: paidAmountNumber,
      remainingDebt,
      date: new Date().toISOString().split("T")[0],
      status,
    };

    setPurchases((prev) => [newPurchase, ...prev]);
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
      <div className="purchases-page">
        <div className="purchases-header">
          <div>
            <p className="dashboard-badge">Purchase Management</p>
            <h1 className="dashboard-title">Purchases</h1>
            <p className="dashboard-subtitle">
              Track customer purchases, calculate debt automatically, and organize purchase records.
            </p>
          </div>

          <button className="quick-action-btn" onClick={() => setShowModal(true)}>
            + Add Purchase
          </button>
        </div>

        <div className="purchases-stats-grid">
          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">🛒</span>
              <span className="stat-title">Total Purchases</span>
            </div>
            <h3 className="stat-value">{purchases.length}</h3>
            <p className="stat-change">All purchase records</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">📦</span>
              <span className="stat-title">Total Quantity</span>
            </div>
            <h3 className="stat-value">{totalQuantity}</h3>
            <p className="stat-change">Items purchased</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">✅</span>
              <span className="stat-title">Paid</span>
            </div>
            <h3 className="stat-value">{paidCount}</h3>
            <p className="stat-change">Fully paid purchases</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">🟡</span>
              <span className="stat-title">Partial</span>
            </div>
            <h3 className="stat-value">{partialCount}</h3>
            <p className="stat-change">Partially paid</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">🔴</span>
              <span className="stat-title">Debt</span>
            </div>
            <h3 className="stat-value">{debtCount}</h3>
            <p className="stat-change">${totalDebt} outstanding</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">💵</span>
              <span className="stat-title">Total Cost</span>
            </div>
            <h3 className="stat-value">${totalCostValue}</h3>
            <p className="stat-change">All recorded purchases</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="purchases-toolbar">
            <div className="dashboard-search-box purchases-search-box">
              <label className="dashboard-search-label">Search purchases</label>
              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Search by customer, product, quantity, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="dashboard-search-meta">
                {searchTerm.trim()
                  ? `${filteredPurchases.length} result(s)`
                  : "Search all purchases"}
              </span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  {sortableHeader("ID", "id")}
                  {sortableHeader("Customer", "customer")}
                  {sortableHeader("Product", "product")}
                  {sortableHeader("Quantity", "quantity")}
                  {sortableHeader("Total Cost", "totalCost")}
                  {sortableHeader("Paid", "paidAmount")}
                  {sortableHeader("Debt", "remainingDebt")}
                  {sortableHeader("Date", "date")}
                  {sortableHeader("Status", "status")}
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length > 0 ? (
                  filteredPurchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td>{purchase.id}</td>
                      <td>{purchase.customer}</td>
                      <td>{purchase.product}</td>
                      <td>{purchase.quantity}</td>
                      <td>${purchase.totalCost}</td>
                      <td>${purchase.paidAmount}</td>
                      <td>${purchase.remainingDebt}</td>
                      <td>{purchase.date}</td>
                      <td>
                        <span
                          className={
                            purchase.status === "Paid"
                              ? "status-badge status-paid"
                              : purchase.status === "Partial"
                              ? "status-badge status-pending"
                              : "status-badge status-out"
                          }
                        >
                          {purchase.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="empty-state-cell">
                      No matching purchases found.
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
                <h2>Add Purchase</h2>
                <p>Enter the new purchase information.</p>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                ×
              </button>
            </div>

            <form className="modal-form">
              <div>
                <label className="modal-label">Customer</label>
                <select
                  className="modal-input"
                  value={form.customer}
                  onChange={(e) => setForm((prev) => ({ ...prev, customer: e.target.value }))}
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.name}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              {form.customer ? (
                <div>
                  <label className="modal-label">Current Debt</label>
                  <input
                    className="modal-input"
                    type="text"
                    value={`$${customerCurrentDebt}`}
                    readOnly
                  />
                </div>
              ) : null}

              <div>
                <label className="modal-label">Product</label>
                <select
                  className="modal-input"
                  value={form.product}
                  onChange={(e) => handleProductChange(e.target.value)}
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="modal-label">Quantity</label>
                <input
                  className="modal-input"
                  type="number"
                  placeholder="Enter quantity"
                  value={form.quantity}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                />
              </div>

              <div>
                <label className="modal-label">Total Cost</label>
                <input
                  className="modal-input"
                  type="number"
                  placeholder="Enter total cost"
                  value={form.totalCost}
                  onChange={(e) => setForm((prev) => ({ ...prev, totalCost: e.target.value }))}
                />
              </div>

              <div>
                <label className="modal-label">Paid Amount</label>
                <input
                  className="modal-input"
                  type="number"
                  placeholder="Enter paid amount"
                  value={form.paidAmount}
                  onChange={(e) => setForm((prev) => ({ ...prev, paidAmount: e.target.value }))}
                />
              </div>

              {form.totalCost ? (
                <div>
                  <label className="modal-label">Calculated Status</label>
                  <input
                    className="modal-input"
                    type="text"
                    readOnly
                    value={getPurchaseStatus(
                      Number(form.totalCost || 0),
                      Number(form.paidAmount || 0)
                    )}
                  />
                </div>
              ) : null}

              <div className="modal-actions">
                <button type="button" className="modal-secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="button" className="modal-primary-btn" onClick={handleAddPurchase}>
                  Save Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}