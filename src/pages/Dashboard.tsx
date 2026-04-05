import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCustomers,
  getInvoices,
  getPayments,
  getProducts,
  getPurchases,
} from "../data/storage";

type ActivityItem = {
  title: string;
  date: string;
};

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const customers = getCustomers();
  const products = getProducts();
  const invoices = getInvoices();
  const purchases = getPurchases();
  const payments = getPayments();

  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalInvoicesValue = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalPurchaseCost = purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);

  const pendingInvoices = invoices.filter((invoice) => invoice.status === "Pending").length;
  const partialInvoices = invoices.filter((invoice) => invoice.status === "Partial").length;
  const paidInvoices = invoices.filter((invoice) => invoice.status === "Paid").length;

  const lowStockProducts = products.filter(
    (product) => product.status === "Low Stock" || product.status === "Out of Stock"
  );

  const outOfStockProducts = products.filter(
    (product) => product.status === "Out of Stock"
  ).length;

  const totalDebt = purchases.reduce((sum, purchase) => sum + purchase.remainingDebt, 0);

  const quickCards = [
    {
      title: "Customers",
      value: customers.length,
      note: "Registered clients",
      icon: "👥",
      onClick: () => navigate("/customers"),
    },
    {
      title: "Products",
      value: products.length,
      note: `${lowStockProducts.length} need attention`,
      icon: "📦",
      onClick: () => navigate("/products"),
    },
    {
      title: "Invoices",
      value: invoices.length,
      note: `${pendingInvoices + partialInvoices} unpaid / partial`,
      icon: "🧾",
      onClick: () => navigate("/invoices"),
    },
    {
      title: "Revenue",
      value: formatCurrency(totalRevenue),
      note: "From payments",
      icon: "💰",
      onClick: () => navigate("/payments"),
    },
  ];

  const recentInvoices = [...invoices]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  const recentPayments = [...payments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  const recentPurchases = [...purchases]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  const activityTimeline = useMemo(() => {
    const customerActivity: ActivityItem[] = customers.slice(0, 3).map((customer) => ({
      title: `Customer added: ${customer.name}`,
      date: customer.joinedAt,
    }));

    const invoiceActivity: ActivityItem[] = invoices.slice(0, 3).map((invoice) => ({
      title: `Invoice ${invoice.id} for ${invoice.customer}`,
      date: invoice.date,
    }));

    const paymentActivity: ActivityItem[] = payments.slice(0, 3).map((payment) => ({
      title: `Payment received from ${payment.customer}`,
      date: payment.date,
    }));

    const purchaseActivity: ActivityItem[] = purchases.slice(0, 3).map((purchase) => ({
      title: `${purchase.customer} purchased ${purchase.product}`,
      date: purchase.date,
    }));

    return [
      ...customerActivity,
      ...invoiceActivity,
      ...paymentActivity,
      ...purchaseActivity,
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  }, [customers, invoices, payments, purchases]);

  const filteredSections = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      return {
        invoices: recentInvoices,
        payments: recentPayments,
        products: lowStockProducts.slice(0, 4),
        purchases: recentPurchases,
        activity: activityTimeline,
      };
    }

    return {
      invoices: recentInvoices.filter((item) =>
        [item.id, item.customer, item.status, item.date, item.amount]
          .join(" ")
          .toLowerCase()
          .includes(q)
      ),
      payments: recentPayments.filter((item) =>
        [item.customer, item.method, item.date, item.amount]
          .join(" ")
          .toLowerCase()
          .includes(q)
      ),
      products: lowStockProducts.filter((item) =>
        [item.name, item.category, item.status, item.stock]
          .join(" ")
          .toLowerCase()
          .includes(q)
      ),
      purchases: recentPurchases.filter((item) =>
        [item.customer, item.product, item.status, item.date, item.totalCost]
          .join(" ")
          .toLowerCase()
          .includes(q)
      ),
      activity: activityTimeline.filter((item) =>
        [item.title, item.date].join(" ").toLowerCase().includes(q)
      ),
    };
  }, [
    searchTerm,
    recentInvoices,
    recentPayments,
    lowStockProducts,
    recentPurchases,
    activityTimeline,
  ]);

  const alerts = [
    {
      title: "Pending invoices",
      value: pendingInvoices,
      desc: "Need collection follow-up",
      onClick: () => navigate("/invoices"),
    },
    {
      title: "Partial invoices",
      value: partialInvoices,
      desc: "Need remaining payment",
      onClick: () => navigate("/invoices"),
    },
    {
      title: "Customer debt",
      value: formatCurrency(totalDebt),
      desc: "Outstanding purchase balances",
      onClick: () => navigate("/purchases"),
    },
    {
      title: "Out of stock",
      value: outOfStockProducts,
      desc: "Products needing refill",
      onClick: () => navigate("/products"),
    },
  ];

  return (
    <div className="compact-dashboard-page">
      <div className="compact-dashboard-top">
        <div className="compact-hero-card">
          <p className="dashboard-badge">Business Control Center</p>
          <h1 className="dashboard-title">Dashboard Overview</h1>
          <p className="dashboard-subtitle compact-subtitle">
            A practical overview of customers, products, invoices, payments, and
            purchases with quick access to the actions you use most.
          </p>

          <div className="compact-dashboard-actions">
            <button className="quick-action-btn" onClick={() => navigate("/customers")}>
              + Add Customer
            </button>
            <button className="quick-action-btn secondary" onClick={() => navigate("/products")}>
              Products
            </button>
            <button className="quick-action-btn secondary" onClick={() => navigate("/purchases")}>
              Purchases
            </button>
            <button className="quick-action-btn secondary" onClick={() => navigate("/invoices")}>
              Invoices
            </button>
          </div>

          <div className="dashboard-search-box compact-search-box">
            <label className="dashboard-search-label">Search dashboard data</label>
            <input
              type="text"
              className="dashboard-search-input"
              placeholder="Search customers, products, invoices, payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="dashboard-search-meta">
              {searchTerm.trim() ? "Filtered dashboard results" : "Search all sections"}
            </span>
          </div>
        </div>

        <div className="compact-summary-panel">
          <div className="summary-highlight-card">
            <span className="summary-label">Live Revenue</span>
            <h2>{formatCurrency(totalRevenue)}</h2>
            <p>Updated from payments page</p>
          </div>

          <div className="summary-mini-grid">
            <div className="summary-mini-card">
              <span>Total Invoices Value</span>
              <strong>{formatCurrency(totalInvoicesValue)}</strong>
            </div>
            <div className="summary-mini-card">
              <span>Purchase Cost</span>
              <strong>{formatCurrency(totalPurchaseCost)}</strong>
            </div>
            <div className="summary-mini-card">
              <span>Paid Invoices</span>
              <strong>{paidInvoices}</strong>
            </div>
            <div className="summary-mini-card">
              <span>Customer Debt</span>
              <strong>{formatCurrency(totalDebt)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="compact-stats-grid">
        {quickCards.map((card) => (
          <button
            key={card.title}
            className="compact-stat-card clickable-card"
            onClick={card.onClick}
            type="button"
          >
            <div className="compact-stat-top">
              <span className="compact-stat-icon">{card.icon}</span>
              <span className="compact-stat-title">{card.title}</span>
            </div>
            <h3 className="compact-stat-value">{card.value}</h3>
            <p className="compact-stat-note">{card.note}</p>
          </button>
        ))}
      </div>

      <div className="compact-main-grid">
        <section className="dashboard-card compact-section">
          <div className="compact-section-header">
            <div>
              <h2>Invoices Overview</h2>
              <p>Latest invoices from shared storage</p>
            </div>
            <button className="section-link-btn" onClick={() => navigate("/invoices")}>
              View all
            </button>
          </div>

          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSections.invoices.length > 0 ? (
                  filteredSections.invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.id}</td>
                      <td>{invoice.customer}</td>
                      <td>{invoice.date}</td>
                      <td>{formatCurrency(invoice.amount)}</td>
                      <td>
                        <span
                          className={
                            invoice.status === "Paid"
                              ? "status-badge status-paid"
                              : invoice.status === "Partial"
                              ? "status-badge status-pending"
                              : "status-badge status-out"
                          }
                        >
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty-state-cell">
                      No matching invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-card compact-section">
          <div className="compact-section-header">
            <div>
              <h2>Quick Metrics</h2>
              <p>Main operational indicators</p>
            </div>
          </div>

          <div className="alerts-list">
            {alerts.map((alert) => (
              <button
                type="button"
                key={alert.title}
                className="alert-card clickable-card"
                onClick={alert.onClick}
              >
                <div>
                  <strong>{alert.title}</strong>
                  <p>{alert.desc}</p>
                </div>
                <span className="alert-value">{alert.value}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="dashboard-card compact-section">
          <div className="compact-section-header">
            <div>
              <h2>Payments</h2>
              <p>Recent payment activity</p>
            </div>
            <button className="section-link-btn" onClick={() => navigate("/payments")}>
              View all
            </button>
          </div>

          <div className="stack-list">
            {filteredSections.payments.length > 0 ? (
              filteredSections.payments.map((payment, index) => (
                <div key={`${payment.customer}-${payment.date}-${index}`} className="stack-item">
                  <div>
                    <strong>{payment.customer}</strong>
                    <p>{payment.method}</p>
                  </div>
                  <span>{formatCurrency(payment.amount)}</span>
                </div>
              ))
            ) : (
              <div className="empty-stack-state">No matching payments found.</div>
            )}
          </div>
        </section>

        <section className="dashboard-card compact-section">
          <div className="compact-section-header">
            <div>
              <h2>Products Snapshot</h2>
              <p>Current inventory highlights</p>
            </div>
            <button className="section-link-btn" onClick={() => navigate("/products")}>
              View all
            </button>
          </div>

          <div className="stack-list">
            {filteredSections.products.length > 0 ? (
              filteredSections.products.map((product) => (
                <div key={product.id} className="product-snapshot-card">
                  <div className="product-snapshot-top">
                    <strong>{product.name}</strong>
                    <span
                      className={
                        product.status === "Out of Stock"
                          ? "status-badge status-out"
                          : "status-badge status-pending"
                      }
                    >
                      {product.status}
                    </span>
                  </div>
                  <p>
                    {product.category} • Stock {product.stock}
                  </p>
                  <div className="mini-stock-bar">
                    <div
                      className="mini-stock-fill"
                      style={{ width: `${Math.min(product.stock * 4, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-stack-state">No low stock products found.</div>
            )}
          </div>
        </section>

        <section className="dashboard-card compact-section">
          <div className="compact-section-header">
            <div>
              <h2>Recent Purchases</h2>
              <p>Latest purchase records</p>
            </div>
            <button className="section-link-btn" onClick={() => navigate("/purchases")}>
              View all
            </button>
          </div>

          <div className="stack-list">
            {filteredSections.purchases.length > 0 ? (
              filteredSections.purchases.map((purchase) => (
                <div key={purchase.id} className="stack-item">
                  <div>
                    <strong>{purchase.customer}</strong>
                    <p>
                      {purchase.product} • Qty {purchase.quantity}
                    </p>
                  </div>
                  <div className="stack-item-right">
                    <span>{formatCurrency(purchase.totalCost)}</span>
                    <small
                      className={
                        purchase.status === "Paid"
                          ? "text-success"
                          : purchase.status === "Partial"
                          ? "text-warning"
                          : "text-danger"
                      }
                    >
                      {purchase.status}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-stack-state">No matching purchases found.</div>
            )}
          </div>
        </section>

        <section className="dashboard-card compact-section">
          <div className="compact-section-header">
            <div>
              <h2>Activity Timeline</h2>
              <p>Latest actions derived from shared records</p>
            </div>
          </div>

          <div className="timeline-list">
            {filteredSections.activity.length > 0 ? (
              filteredSections.activity.map((item, index) => (
                <div key={`${item.title}-${item.date}-${index}`} className="timeline-item">
                  <span className="timeline-dot" />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.date}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-stack-state">No matching activity found.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}