import { useEffect, useMemo, useState } from "react";
import {
  type Purchase,
  getPurchases,
  resetPurchases,
  savePurchases,
} from "../data/storage";

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>(() => getPurchases());
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    supplier: "",
    product: "",
    quantity: "",
    totalCost: "",
    status: "Received" as Purchase["status"],
  });

  useEffect(() => {
    savePurchases(purchases);
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();
    if (!value) return purchases;

    return purchases.filter((purchase) =>
      [
        purchase.id,
        purchase.supplier,
        purchase.product,
        purchase.quantity,
        purchase.totalCost,
        purchase.date,
        purchase.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [purchases, searchTerm]);

  const receivedCount = purchases.filter((purchase) => purchase.status === "Received").length;
  const pendingCount = purchases.filter((purchase) => purchase.status === "Pending").length;
  const totalCostValue = purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);
  const totalQuantity = purchases.reduce((sum, purchase) => sum + purchase.quantity, 0);

  const closeModal = () => {
    setShowModal(false);
    setForm({
      supplier: "",
      product: "",
      quantity: "",
      totalCost: "",
      status: "Received",
    });
  };

  const handleAddPurchase = () => {
    if (!form.supplier || !form.product || !form.quantity || !form.totalCost) return;

    const quantityNumber = Number(form.quantity);
    const totalCostNumber = Number(form.totalCost);

    if (Number.isNaN(quantityNumber) || Number.isNaN(totalCostNumber)) return;

    const newPurchase: Purchase = {
      id: `PUR-${3000 + purchases.length + 1}`,
      supplier: form.supplier,
      product: form.product,
      quantity: quantityNumber,
      totalCost: totalCostNumber,
      date: new Date().toISOString().split("T")[0],
      status: form.status,
    };

    setPurchases((prev) => [newPurchase, ...prev]);
    closeModal();
  };

  const handleReset = () => {
    resetPurchases();
    setPurchases(getPurchases());
  };

  return (
    <>
      <div className="purchases-page">
        <div className="purchases-header">
          <div>
            <p className="dashboard-badge">Purchase Management</p>
            <h1 className="dashboard-title">Purchases</h1>
            <p className="dashboard-subtitle">
              Track supplier purchases, manage stock intake, and organize purchase records.
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
              <span className="stat-title">Received</span>
            </div>
            <h3 className="stat-value">{receivedCount}</h3>
            <p className="stat-change">Completed purchases</p>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-icon">💵</span>
              <span className="stat-title">Total Cost</span>
            </div>
            <h3 className="stat-value">${totalCostValue}</h3>
            <p className="stat-change">{pendingCount} pending orders</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="purchases-toolbar">
            <div className="dashboard-search-box purchases-search-box">
              <label className="dashboard-search-label">Search purchases</label>
              <input
                type="text"
                className="dashboard-search-input"
                placeholder="Search by supplier, product, quantity, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="dashboard-search-meta">
                {searchTerm.trim()
                  ? `${filteredPurchases.length} result(s)`
                  : "Search all purchases"}
              </span>
            </div>

            <button className="quick-action-btn secondary" onClick={handleReset}>
              Reset Data
            </button>
          </div>

          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Supplier</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Total Cost</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length > 0 ? (
                  filteredPurchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td>{purchase.id}</td>
                      <td>{purchase.supplier}</td>
                      <td>{purchase.product}</td>
                      <td>{purchase.quantity}</td>
                      <td>${purchase.totalCost}</td>
                      <td>{purchase.date}</td>
                      <td>
                        <span
                          className={
                            purchase.status === "Received"
                              ? "status-badge status-paid"
                              : "status-badge status-pending"
                          }
                        >
                          {purchase.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="empty-state-cell">
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
                <label className="modal-label">Supplier</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Enter supplier name"
                  value={form.supplier}
                  onChange={(e) => setForm((prev) => ({ ...prev, supplier: e.target.value }))}
                />
              </div>

              <div>
                <label className="modal-label">Product</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Enter product name"
                  value={form.product}
                  onChange={(e) => setForm((prev) => ({ ...prev, product: e.target.value }))}
                />
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
                <label className="modal-label">Status</label>
                <select
                  className="modal-input"
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value as Purchase["status"],
                    }))
                  }
                >
                  <option>Received</option>
                  <option>Pending</option>
                </select>
              </div>

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