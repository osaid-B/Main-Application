import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCustomers,
  getEmployees,
  getInvoiceItems,
  getInvoices,
  getPayments,
  getProducts,
  getPurchases,
} from "../data/storage";
import {
  buildInvoicesWithRelations,
  calculateProductSoldQuantity,
} from "../data/relations";
import type {
  Customer,
  Employee,
  Invoice,
  InvoiceItem,
  Payment,
  Product,
  Purchase,
} from "../data/types";

type DashboardNotification = {
  id: string;
  title: string;
  description: string;
  path: string;
  tone: "info" | "warning" | "success" | "danger";
};

type PreviewSection = {
  key: string;
  label: string;
  path: string;
  description: string;
  render: () => ReactNode;
};

type ExtendedInvoice = Invoice & {
  customerName: string;
  remainingAmount: number;
  status: "Paid" | "Partial" | "Debit";
};

function formatMoney(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `$${safeValue.toLocaleString()}`;
}

function isRecent(dateString?: string, days = 7) {
  if (!dateString) return false;
  const input = new Date(dateString);
  if (Number.isNaN(input.getTime())) return false;

  const now = new Date();
  const diff = now.getTime() - input.getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
}

function MiniPageFrame({
  title,
  badge,
  children,
}: {
  title: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mini-page-frame">
      <div className="mini-page-topbar">
        <span className="mini-page-badge">{badge}</span>

        <div className="mini-page-window-actions">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="mini-page-header">
        <div>
          <h3>{title}</h3>
          <p>Mini live interface preview</p>
        </div>

        <div className="mini-page-search" />
      </div>

      <div className="mini-page-content">{children}</div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [customers] = useState<Customer[]>(() => getCustomers());
  const [products] = useState<Product[]>(() => getProducts());
  const [purchases] = useState<Purchase[]>(() => getPurchases());
  const [invoicesRaw] = useState<Invoice[]>(() => getInvoices());
  const [invoiceItems] = useState<InvoiceItem[]>(() => getInvoiceItems());
  const [payments] = useState<Payment[]>(() => getPayments());
  const [employees] = useState<Employee[]>(() => getEmployees());

  const [previewIndex, setPreviewIndex] = useState(0);
  const [notificationsPaused, setNotificationsPaused] = useState(false);
  const [activeNotification, setActiveNotification] =
    useState<DashboardNotification | null>(null);
  const [notificationCursor, setNotificationCursor] = useState(0);

  const invoices = useMemo<ExtendedInvoice[]>(
    () => buildInvoicesWithRelations(invoicesRaw, customers, payments),
    [invoicesRaw, customers, payments]
  );

  const completedPaymentsTotal = useMemo(() => {
    return payments
      .filter(
        (payment) =>
          payment.status === "Completed" || payment.status === "Paid"
      )
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  }, [payments]);

  const purchasesTotal = useMemo(() => {
    return purchases
      .filter((purchase) => purchase.status === "Received")
      .reduce((sum, purchase) => sum + Number(purchase.totalCost || 0), 0);
  }, [purchases]);

  const lowStockProducts = useMemo(() => {
    return products.filter((product) => {
      const purchasedQty = purchases
        .filter(
          (purchase) =>
            purchase.productId === product.id &&
            purchase.status === "Received"
        )
        .reduce((sum, purchase) => sum + Number(purchase.quantity || 0), 0);

      const soldQty = calculateProductSoldQuantity(product.id, invoiceItems);
      const available = Math.max(
        Number(product.stock || 0) + purchasedQty - soldQty,
        0
      );

      return available > 0 && available <= 15;
    });
  }, [products, purchases, invoiceItems]);

  const outOfStockProducts = useMemo(() => {
    return products.filter((product) => {
      const purchasedQty = purchases
        .filter(
          (purchase) =>
            purchase.productId === product.id &&
            purchase.status === "Received"
        )
        .reduce((sum, purchase) => sum + Number(purchase.quantity || 0), 0);

      const soldQty = calculateProductSoldQuantity(product.id, invoiceItems);
      const available = Math.max(
        Number(product.stock || 0) + purchasedQty - soldQty,
        0
      );

      return available <= 0;
    });
  }, [products, purchases, invoiceItems]);

  const debitInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === "Debit"),
    [invoices]
  );

  const partialInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === "Partial"),
    [invoices]
  );

  const recentCustomers = useMemo(
    () =>
      customers.filter((customer) => isRecent(customer.joinedAt, 14)).slice(0, 5),
    [customers]
  );

  const recentInvoices = useMemo(
    () => [...invoices].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [invoices]
  );

  const recentPayments = useMemo(
    () => [...payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [payments]
  );

  const previewSections = useMemo<PreviewSection[]>(
    () => [
      {
        key: "customers",
        label: "Customers",
        path: "/customers",
        description: "Mini preview of the customers page",
        render: () => (
          <MiniPageFrame title="Customers" badge="Customers Page">
            <div className="mini-stats-grid">
              <MiniStat label="Total" value={customers.length} />
              <MiniStat label="Recent" value={recentCustomers.length} />
              <MiniStat label="Employees" value={employees.length} />
            </div>

            <div className="mini-table">
              <div className="mini-table-head">
                <span>Name</span>
                <span>Phone</span>
                <span>ID</span>
              </div>

              {customers.slice(0, 4).map((customer) => (
                <div key={customer.id} className="mini-table-row">
                  <span>{customer.name}</span>
                  <span>{customer.phone}</span>
                  <span>{customer.id}</span>
                </div>
              ))}
            </div>
          </MiniPageFrame>
        ),
      },
      {
        key: "invoices",
        label: "Invoices",
        path: "/invoices",
        description: "Mini preview of the invoices page",
        render: () => (
          <MiniPageFrame title="Invoices" badge="Invoices Page">
            <div className="mini-stats-grid">
              <MiniStat label="Total" value={invoices.length} />
              <MiniStat label="Debit" value={debitInvoices.length} />
              <MiniStat label="Partial" value={partialInvoices.length} />
            </div>

            <div className="mini-table">
              <div className="mini-table-head">
                <span>Invoice</span>
                <span>Customer</span>
                <span>Status</span>
              </div>

              {recentInvoices.slice(0, 4).map((invoice) => (
                <div key={invoice.id} className="mini-table-row">
                  <span>{invoice.id}</span>
                  <span>{invoice.customerName}</span>
                  <span>{invoice.status}</span>
                </div>
              ))}
            </div>
          </MiniPageFrame>
        ),
      },
      {
        key: "payments",
        label: "Payments",
        path: "/payments",
        description: "Mini preview of the payments page",
        render: () => (
          <MiniPageFrame title="Payments" badge="Payments Page">
            <div className="mini-stats-grid">
              <MiniStat label="Total" value={payments.length} />
              <MiniStat
                label="Revenue"
                value={formatMoney(completedPaymentsTotal)}
              />
              <MiniStat
                label="Recent"
                value={recentPayments.length}
              />
            </div>

            <div className="mini-table">
              <div className="mini-table-head">
                <span>Payment</span>
                <span>Date</span>
                <span>Amount</span>
              </div>

              {recentPayments.slice(0, 4).map((payment) => (
                <div key={payment.id} className="mini-table-row">
                  <span>{payment.paymentId ?? payment.id}</span>
                  <span>{payment.date}</span>
                  <span>{formatMoney(Number(payment.amount || 0))}</span>
                </div>
              ))}
            </div>
          </MiniPageFrame>
        ),
      },
      {
        key: "products",
        label: "Products",
        path: "/products",
        description: "Mini preview of the products page",
        render: () => (
          <MiniPageFrame title="Products" badge="Products Page">
            <div className="mini-stats-grid">
              <MiniStat label="Products" value={products.length} />
              <MiniStat label="Low Stock" value={lowStockProducts.length} />
              <MiniStat label="Out" value={outOfStockProducts.length} />
            </div>

            <div className="mini-table">
              <div className="mini-table-head">
                <span>Name</span>
                <span>Category</span>
                <span>Status</span>
              </div>

              {products.slice(0, 4).map((product) => (
                <div key={product.id} className="mini-table-row">
                  <span>{product.name}</span>
                  <span>{product.category}</span>
                  <span>
                    {outOfStockProducts.some((p) => p.id === product.id)
                      ? "Out"
                      : lowStockProducts.some((p) => p.id === product.id)
                      ? "Low"
                      : "Good"}
                  </span>
                </div>
              ))}
            </div>
          </MiniPageFrame>
        ),
      },
      {
        key: "purchases",
        label: "Purchases",
        path: "/purchases",
        description: "Mini preview of the purchases page",
        render: () => (
          <MiniPageFrame title="Purchases" badge="Purchases Page">
            <div className="mini-stats-grid">
              <MiniStat label="Purchases" value={purchases.length} />
              <MiniStat label="Cost" value={formatMoney(purchasesTotal)} />
              <MiniStat
                label="Received"
                value={purchases.filter((p) => p.status === "Received").length}
              />
            </div>

            <div className="mini-table">
              <div className="mini-table-head">
                <span>Product ID</span>
                <span>Status</span>
                <span>Qty</span>
              </div>

              {purchases.slice(0, 4).map((purchase) => (
                <div key={purchase.id} className="mini-table-row">
                  <span>{purchase.productId}</span>
                  <span>{purchase.status}</span>
                  <span>{purchase.quantity}</span>
                </div>
              ))}
            </div>
          </MiniPageFrame>
        ),
      },
    ],
    [
      customers,
      recentCustomers,
      employees,
      invoices,
      debitInvoices,
      partialInvoices,
      recentInvoices,
      payments,
      recentPayments,
      products,
      lowStockProducts,
      outOfStockProducts,
      purchases,
      purchasesTotal,
      completedPaymentsTotal,
    ]
  );

  useEffect(() => {
    if (previewSections.length <= 1) return;

    const interval = window.setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % previewSections.length);
    }, 3500);

    return () => window.clearInterval(interval);
  }, [previewSections.length]);

  const notifications = useMemo<DashboardNotification[]>(() => {
    const items: DashboardNotification[] = [];

    lowStockProducts.forEach((product) => {
      items.push({
        id: `low-${product.id}`,
        title: "Low stock warning",
        description: `${product.name} is running low and may need a refill soon.`,
        path: "/products",
        tone: "warning",
      });
    });

    outOfStockProducts.forEach((product) => {
      items.push({
        id: `out-${product.id}`,
        title: "Out of stock",
        description: `${product.name} is currently out of stock.`,
        path: "/products",
        tone: "danger",
      });
    });

    recentCustomers.forEach((customer) => {
      items.push({
        id: `customer-${customer.id}`,
        title: "New customer added",
        description: `${customer.name} was recently added to the customer list.`,
        path: "/customers",
        tone: "success",
      });
    });

    recentInvoices.slice(0, 3).forEach((invoice) => {
      items.push({
        id: `invoice-${invoice.id}`,
        title: "Recent invoice activity",
        description: `${invoice.id} for ${invoice.customerName} is currently ${invoice.status}.`,
        path: "/invoices",
        tone: invoice.status === "Debit" ? "danger" : "info",
      });
    });

    return items;
  }, [lowStockProducts, outOfStockProducts, recentCustomers, recentInvoices]);

  useEffect(() => {
    if (notificationsPaused || notifications.length === 0) {
      setActiveNotification(null);
      return;
    }

    setActiveNotification(
      notifications[notificationCursor % notifications.length]
    );

    const interval = window.setInterval(() => {
      setNotificationCursor((prev) => prev + 1);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [notificationCursor, notifications, notificationsPaused]);

  useEffect(() => {
    if (notificationCursor >= notifications.length && notifications.length > 0) {
      setNotificationCursor(0);
    }
  }, [notificationCursor, notifications.length]);

  const currentPreview = previewSections[previewIndex] ?? previewSections[0];

  const dashboardSummary = useMemo(
    () => [
      {
        label: "Current Revenue",
        value: formatMoney(completedPaymentsTotal),
        meta: "Based on completed payments",
      },
      {
        label: "Purchase Cost",
        value: formatMoney(purchasesTotal),
        meta: "Received purchase records only",
      },
      {
        label: "Pending Collections",
        value: debitInvoices.length + partialInvoices.length,
        meta: "Debit and partial invoices",
      },
      {
        label: "Employees",
        value: employees.length,
        meta: "Registered staff members",
      },
    ],
    [
      completedPaymentsTotal,
      purchasesTotal,
      debitInvoices.length,
      partialInvoices.length,
      employees.length,
    ]
  );

  return (
    <>
      <style>{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .dashboard-hero {
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          padding: 32px;
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(37, 99, 235, 0.68)),
            url("https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=80")
              center/cover no-repeat;
          color: white;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
        }

        .dashboard-hero::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0));
          pointer-events: none;
        }

        .dashboard-hero-content {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
          align-items: flex-start;
        }

        .dashboard-hero-text {
          max-width: 700px;
        }

        .dashboard-hero-badge {
          display: inline-flex;
          align-items: center;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.16);
          color: white;
          font-size: 13px;
          font-weight: 700;
          backdrop-filter: blur(10px);
          margin-bottom: 14px;
        }

        .dashboard-hero-title {
          margin: 0;
          font-size: 44px;
          line-height: 1.05;
          font-weight: 800;
        }

        .dashboard-hero-subtitle {
          margin: 14px 0 0;
          font-size: 16px;
          line-height: 1.8;
          color: rgba(255,255,255,0.9);
          max-width: 620px;
        }

        .dashboard-hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 22px;
        }

        .dashboard-hero-btn {
          border: none;
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dashboard-hero-btn.primary {
          background: white;
          color: #0f172a;
        }

        .dashboard-hero-btn.primary:hover {
          transform: translateY(-1px);
        }

        .dashboard-hero-btn.secondary {
          background: rgba(255,255,255,0.14);
          color: white;
          border: 1px solid rgba(255,255,255,0.18);
        }

        .dashboard-hero-btn.secondary:hover {
          background: rgba(255,255,255,0.2);
        }

        .dashboard-main-grid {
          display: grid;
          grid-template-columns: 1.5fr 0.9fr;
          gap: 24px;
        }

        .dashboard-panel {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 22px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.04);
        }

        .dashboard-panel-title {
          margin: 0;
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
        }

        .dashboard-panel-subtitle {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.7;
        }

        .dashboard-preview-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .dashboard-preview-chip {
          display: inline-flex;
          align-items: center;
          padding: 7px 12px;
          border-radius: 999px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 12px;
          font-weight: 700;
        }

        .dashboard-preview-body {
          border: 1px solid #dbeafe;
          background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
          border-radius: 20px;
          padding: 18px;
          min-height: 340px;
          transition: all 0.28s ease;
        }

        .dashboard-preview-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 18px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .dashboard-link-btn {
          border: none;
          background: #dbeafe;
          color: #1d4ed8;
          padding: 10px 14px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .dashboard-preview-dots {
          display: flex;
          gap: 8px;
        }

        .dashboard-preview-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #cbd5e1;
          transition: all 0.2s ease;
        }

        .dashboard-preview-dot.active {
          background: #2563eb;
          transform: scale(1.1);
        }

        .dashboard-summary-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .dashboard-summary-card {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 16px;
          background: #ffffff;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .dashboard-summary-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
        }

        .dashboard-summary-label {
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .dashboard-summary-value {
          margin-top: 10px;
          color: #0f172a;
          font-size: 28px;
          font-weight: 800;
        }

        .dashboard-summary-meta {
          margin-top: 8px;
          color: #94a3b8;
          font-size: 13px;
        }

        .dashboard-empty-inline {
          color: #94a3b8;
          font-size: 14px;
          padding: 10px 0;
        }

        .dashboard-notification {
          position: fixed;
          right: 22px;
          top: 22px;
          width: min(380px, calc(100vw - 32px));
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          box-shadow: 0 22px 42px rgba(15, 23, 42, 0.16);
          padding: 16px;
          z-index: 1200;
          animation: dashboardSlideIn 0.35s ease;
          cursor: pointer;
        }

        .dashboard-notification.info {
          border-left: 5px solid #3b82f6;
        }

        .dashboard-notification.warning {
          border-left: 5px solid #f59e0b;
        }

        .dashboard-notification.success {
          border-left: 5px solid #22c55e;
        }

        .dashboard-notification.danger {
          border-left: 5px solid #ef4444;
        }

        .dashboard-notification-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .dashboard-notification-title {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
        }

        .dashboard-notification-text {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.7;
        }

        .dashboard-notification-actions {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          margin-top: 14px;
        }

        .dashboard-mini-btn {
          border: none;
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .dashboard-mini-btn.primary {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .dashboard-mini-btn.secondary {
          background: #f1f5f9;
          color: #475569;
        }

        .dashboard-notification-toggle {
          border: none;
          border-radius: 12px;
          padding: 10px 14px;
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 700;
          cursor: pointer;
        }

        .mini-page-frame {
          height: 100%;
          border: 1px solid #dbeafe;
          border-radius: 20px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .mini-page-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mini-page-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 11px;
          font-weight: 800;
        }

        .mini-page-window-actions {
          display: flex;
          gap: 6px;
        }

        .mini-page-window-actions span {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #cbd5e1;
        }

        .mini-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .mini-page-header h3 {
          margin: 0;
          font-size: 18px;
          color: #0f172a;
          font-weight: 800;
        }

        .mini-page-header p {
          margin: 4px 0 0;
          font-size: 12px;
          color: #64748b;
        }

        .mini-page-search {
          width: 120px;
          height: 34px;
          border-radius: 12px;
          border: 1px solid #dbeafe;
          background: #f8fafc;
          flex-shrink: 0;
        }

        .mini-page-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mini-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .mini-stat {
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 14px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 72px;
        }

        .mini-stat span {
          font-size: 11px;
          color: #64748b;
          font-weight: 700;
        }

        .mini-stat strong {
          font-size: 15px;
          color: #0f172a;
          font-weight: 800;
          word-break: break-word;
        }

        .mini-table {
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          background: white;
        }

        .mini-table-head,
        .mini-table-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          padding: 10px 12px;
          align-items: center;
        }

        .mini-table-head {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .mini-table-head span {
          font-size: 11px;
          font-weight: 800;
          color: #64748b;
        }

        .mini-table-row {
          border-bottom: 1px solid #f1f5f9;
        }

        .mini-table-row:last-child {
          border-bottom: none;
        }

        .mini-table-row span {
          font-size: 12px;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @keyframes dashboardSlideIn {
          from {
            opacity: 0;
            transform: translateX(24px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (max-width: 1100px) {
          .dashboard-main-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .dashboard-hero {
            padding: 24px;
          }

          .dashboard-hero-title {
            font-size: 34px;
          }

          .dashboard-hero-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .dashboard-hero-btn,
          .dashboard-link-btn,
          .dashboard-notification-toggle {
            width: 100%;
          }

          .dashboard-notification-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .dashboard-mini-btn {
            width: 100%;
          }

          .mini-page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .mini-page-search {
            width: 100%;
          }

          .mini-stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="dashboard-page">
        <section className="dashboard-hero">
          <div className="dashboard-hero-content">
            <div className="dashboard-hero-text">
              <span className="dashboard-hero-badge">Business Control Center</span>
              <h1 className="dashboard-hero-title">Dashboard Overview</h1>
              <p className="dashboard-hero-subtitle">
                A focused executive dashboard with live page previews, current revenue,
                purchase cost, invoice collection status, and smart visual alerts.
              </p>

              <div className="dashboard-hero-actions">
                <button
                  className="dashboard-hero-btn primary"
                  onClick={() => navigate("/customers")}
                >
                  + Add Customer
                </button>
                <button
                  className="dashboard-hero-btn secondary"
                  onClick={() => navigate("/invoices")}
                >
                  + Add Invoice
                </button>
                <button
                  className="dashboard-hero-btn secondary"
                  onClick={() => setNotificationsPaused((prev) => !prev)}
                >
                  {notificationsPaused ? "Resume Alerts" : "Pause Alerts"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-main-grid">
          <div className="dashboard-panel">
            <div className="dashboard-preview-head">
              <div>
                <span className="dashboard-preview-chip">
                  Live Page Preview
                </span>
                <h2 className="dashboard-panel-title">{currentPreview.label}</h2>
                <p className="dashboard-panel-subtitle">
                  {currentPreview.description}
                </p>
              </div>
            </div>

            <div className="dashboard-preview-body">
              {currentPreview.render()}
            </div>

            <div className="dashboard-preview-footer">
              <button
                className="dashboard-link-btn"
                onClick={() => navigate(currentPreview.path)}
              >
                Open {currentPreview.label}
              </button>

              <div className="dashboard-preview-dots">
                {previewSections.map((section, index) => (
                  <span
                    key={section.key}
                    className={`dashboard-preview-dot ${
                      previewIndex === index ? "active" : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "18px",
              }}
            >
              <div>
                <span className="dashboard-preview-chip">Financial Snapshot</span>
                <h2 className="dashboard-panel-title">Key Totals</h2>
                <p className="dashboard-panel-subtitle">
                  Current revenue, cost, collections, and team snapshot.
                </p>
              </div>

              <button
                className="dashboard-notification-toggle"
                onClick={() => setNotificationsPaused((prev) => !prev)}
              >
                {notificationsPaused ? "Alerts Off" : "Alerts On"}
              </button>
            </div>

            <div className="dashboard-summary-grid">
              {dashboardSummary.map((item) => (
                <div key={item.label} className="dashboard-summary-card">
                  <div className="dashboard-summary-label">{item.label}</div>
                  <div className="dashboard-summary-value">{item.value}</div>
                  <div className="dashboard-summary-meta">{item.meta}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {activeNotification && !notificationsPaused && (
        <div
          className={`dashboard-notification ${activeNotification.tone}`}
          onClick={() => navigate(activeNotification.path)}
        >
          <div className="dashboard-notification-head">
            <div>
              <h4 className="dashboard-notification-title">
                {activeNotification.title}
              </h4>
              <p className="dashboard-notification-text">
                {activeNotification.description}
              </p>
            </div>

            <button
              type="button"
              className="dashboard-mini-btn secondary"
              onClick={(e) => {
                e.stopPropagation();
                setActiveNotification(null);
              }}
            >
              Close
            </button>
          </div>

          <div className="dashboard-notification-actions">
            <button
              type="button"
              className="dashboard-mini-btn primary"
              onClick={(e) => {
                e.stopPropagation();
                navigate(activeNotification.path);
              }}
            >
              Open Page
            </button>

            <button
              type="button"
              className="dashboard-mini-btn secondary"
              onClick={(e) => {
                e.stopPropagation();
                setNotificationsPaused(true);
                setActiveNotification(null);
              }}
            >
              Stop Alerts
            </button>
          </div>
        </div>
      )}
    </>
  );
}