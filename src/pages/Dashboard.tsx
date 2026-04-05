import { useMemo, useState } from "react";
import {
  getCustomers,
  getInvoices,
  getPayments,
  getProducts,
  getPurchases,
} from "../data/storage";

type ActivityItem = {
  title: string;
  time: string;
};

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  const customers = getCustomers();
  const products = getProducts();
  const invoices = getInvoices();
  const payments = getPayments();
  const purchases = getPurchases();

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalInvoicesAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalPurchaseCost = purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0);

  const paidInvoices = invoices.filter((invoice) => invoice.status === "Paid").length;
  const pendingInvoices = invoices.filter((invoice) => invoice.status === "Pending").length;
  const completedPayments = payments.filter((payment) => payment.status === "Completed").length;
  const outOfStockProducts = products.filter((product) => product.status === "Out of Stock").length;
  const lowStockProducts = products.filter((product) => product.status === "Low Stock").length;

  const summaryCards = [
    {
      title: "Customers",
      value: customers.length,
      subtitle: "Registered clients",
      icon: "👥",
    },
    {
      title: "Products",
      value: products.length,
      subtitle: `${lowStockProducts} low stock`,
      icon: "📦",
    },
    {
      title: "Invoices",
      value: invoices.length,
      subtitle: `${pendingInvoices} pending`,
      icon: "🧾",
    },
    {
      title: "Revenue",
      value: `$${totalRevenue}`,
      subtitle: "From payments",
      icon: "💰",
    },
  ];

  const activities: ActivityItem[] = [
    ...customers.slice(0, 2).map((customer) => ({
      title: `Customer added: ${customer.name}`,
      time: customer.joinedAt,
    })),
    ...invoices.slice(0, 2).map((invoice) => ({
      title: `Invoice ${invoice.id} for ${invoice.customer}`,
      time: invoice.date,
    })),
    ...payments.slice(0, 2).map((payment) => ({
      title: `Payment ${payment.id} from ${payment.customer}`,
      time: payment.date,
    })),
  ].slice(0, 6);

  const filteredInvoices = useMemo(() => {
    if (!normalizedSearch) return invoices.slice(0, 6);

    return invoices.filter((invoice) =>
      [invoice.id, invoice.customer, invoice.date, invoice.amount, invoice.status]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [normalizedSearch, invoices]);

  const filteredPayments = useMemo(() => {
    if (!normalizedSearch) return payments.slice(0, 5);

    return payments.filter((payment) =>
      [payment.id, payment.customer, payment.method, payment.amount, payment.date, payment.status]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [normalizedSearch, payments]);

  const filteredProducts = useMemo(() => {
    if (!normalizedSearch) return products.slice(0, 5);

    return products.filter((product) =>
      [product.id, product.name, product.category, product.stock, product.status]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [normalizedSearch, products]);

  const filteredActivities = useMemo(() => {
    if (!normalizedSearch) return activities;

    return activities.filter((activity) =>
      `${activity.title} ${activity.time}`.toLowerCase().includes(normalizedSearch)
    );
  }, [normalizedSearch, activities]);

  const totalResults =
    filteredInvoices.length +
    filteredPayments.length +
    filteredProducts.length +
    filteredActivities.length;

  const chartData = [
    customers.length * 12,
    products.length * 10,
    invoices.length * 14,
    payments.length * 11,
    purchases.length * 9,
    paidInvoices * 12,
    completedPayments * 10,
  ];

  return (
    <div className="dashboard-v2">
      <section className="dashboard-v2-hero">
        <div className="dashboard-v2-hero-left">
          <p className="dashboard-v2-badge">Business Control Center</p>
          <h1 className="dashboard-v2-title">Dashboard Overview</h1>
          <p className="dashboard-v2-subtitle">
            A clean, organized view of customers, products, invoices, payments,
            and purchases from your shared business data.
          </p>

          <div className="dashboard-v2-search-wrap">
            <input
              type="text"
              className="dashboard-v2-search"
              placeholder="Search dashboard data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="dashboard-v2-search-meta">
              {normalizedSearch ? `${totalResults} result(s)` : "Search all sections"}
            </span>
          </div>
        </div>

        <div className="dashboard-v2-hero-right">
          <div className="dashboard-v2-summary-box">
            <span className="dashboard-v2-summary-label">Live Revenue</span>
            <h2 className="dashboard-v2-summary-value">${totalRevenue}</h2>
            <p className="dashboard-v2-summary-text">Updated from payments page</p>
          </div>

          <div className="dashboard-v2-mini-grid">
            <div className="dashboard-v2-mini-card">
              <span>Total Invoices Value</span>
              <strong>${totalInvoicesAmount}</strong>
            </div>
            <div className="dashboard-v2-mini-card">
              <span>Purchase Cost</span>
              <strong>${totalPurchaseCost}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-v2-stats">
        {summaryCards.map((card) => (
          <div className="dashboard-v2-stat-card" key={card.title}>
            <div className="dashboard-v2-stat-top">
              <span className="dashboard-v2-stat-icon">{card.icon}</span>
              <span className="dashboard-v2-stat-title">{card.title}</span>
            </div>
            <h3 className="dashboard-v2-stat-value">{card.value}</h3>
            <p className="dashboard-v2-stat-subtitle">{card.subtitle}</p>
          </div>
        ))}
      </section>

      <section className="dashboard-v2-grid">
        <div className="dashboard-v2-card dashboard-v2-card-large">
          <div className="dashboard-v2-card-header">
            <div>
              <h2>Invoices Overview</h2>
              <p>Latest invoices from shared storage</p>
            </div>
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
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.slice(0, 6).map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.id}</td>
                      <td>{invoice.customer}</td>
                      <td>{invoice.date}</td>
                      <td>${invoice.amount}</td>
                      <td>
                        <span
                          className={
                            invoice.status === "Paid"
                              ? "status-badge status-paid"
                              : "status-badge status-pending"
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
        </div>

        <div className="dashboard-v2-card">
          <div className="dashboard-v2-card-header">
            <div>
              <h2>Quick Metrics</h2>
              <p>Main operational indicators</p>
            </div>
          </div>

          <div className="dashboard-v2-metrics-list">
            <div className="dashboard-v2-metric-item">
              <div>
                <strong>Paid invoices</strong>
                <p>Completed billing records</p>
              </div>
              <span>{paidInvoices}</span>
            </div>

            <div className="dashboard-v2-metric-item">
              <div>
                <strong>Pending invoices</strong>
                <p>Need collection follow-up</p>
              </div>
              <span>{pendingInvoices}</span>
            </div>

            <div className="dashboard-v2-metric-item">
              <div>
                <strong>Completed payments</strong>
                <p>Received transactions</p>
              </div>
              <span>{completedPayments}</span>
            </div>

            <div className="dashboard-v2-metric-item">
              <div>
                <strong>Out of stock</strong>
                <p>Products needing refill</p>
              </div>
              <span>{outOfStockProducts}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-v2-card">
          <div className="dashboard-v2-card-header">
            <div>
              <h2>Payments</h2>
              <p>Recent payment activity</p>
            </div>
          </div>

          <div className="dashboard-v2-list">
            {filteredPayments.length > 0 ? (
              filteredPayments.slice(0, 5).map((payment) => (
                <div className="dashboard-v2-list-item" key={payment.id}>
                  <div>
                    <strong>{payment.customer}</strong>
                    <p>
                      {payment.id} • {payment.method}
                    </p>
                  </div>
                  <span>${payment.amount}</span>
                </div>
              ))
            ) : (
              <div className="empty-state-box">No matching payments found.</div>
            )}
          </div>
        </div>

        <div className="dashboard-v2-card">
          <div className="dashboard-v2-card-header">
            <div>
              <h2>Products Snapshot</h2>
              <p>Current inventory highlights</p>
            </div>
          </div>

          <div className="dashboard-v2-products-list">
            {filteredProducts.length > 0 ? (
              filteredProducts.slice(0, 5).map((product) => (
                <div className="dashboard-v2-product-item" key={product.id}>
                  <div className="dashboard-v2-product-info">
                    <strong>{product.name}</strong>
                    <p>
                      {product.category} • Stock {product.stock}
                    </p>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(product.stock, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state-box">No matching products found.</div>
            )}
          </div>
        </div>

        <div className="dashboard-v2-card dashboard-v2-card-wide">
          <div className="dashboard-v2-card-header">
            <div>
              <h2>Activity Timeline</h2>
              <p>Latest actions derived from shared records</p>
            </div>
          </div>

          <div className="activity-list">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity, index) => (
                <div className="activity-item" key={index}>
                  <div className="activity-dot" />
                  <div>
                    <strong>{activity.title}</strong>
                    <p>{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state-box">No matching activities found.</div>
            )}
          </div>
        </div>

        <div className="dashboard-v2-card dashboard-v2-card-wide">
          <div className="dashboard-v2-card-header">
            <div>
              <h2>System Visual Summary</h2>
              <p>Balanced visual breakdown</p>
            </div>
          </div>

          <div className="chart-area">
            {chartData.map((value, index) => (
              <div className="chart-bar-group" key={index}>
                <div className="chart-bar-track">
                  <div
                    className="chart-bar-fill"
                    style={{ height: `${Math.min(value, 100)}%` }}
                  />
                </div>
                <span className="chart-label">S{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}