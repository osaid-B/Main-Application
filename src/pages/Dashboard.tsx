import AISmartBrief from "../components/ai/AISmartBrief";
import AIActionTrigger from "../components/ai/AIActionTrigger";
import { useAI } from "../context/AIContext";
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
  children: ReactNode;
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
          <p>Live interface snapshot</p>
        </div>

        <div className="mini-page-search">
          <span />
        </div>
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

function InsightCard({
  label,
  value,
  meta,
}: {
  label: string;
  value: string | number;
  meta: string;
}) {
  return (
    <div className="dashboard-summary-card">
      <div className="dashboard-summary-label">{label}</div>
      <div className="dashboard-summary-value">{value}</div>
      <div className="dashboard-summary-meta">{meta}</div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { openAI } = useAI();

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
  const [isToastVisible, setIsToastVisible] = useState(false);

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
        description: "Recent additions and customer activity snapshot.",
        render: () => (
          <MiniPageFrame title="Customers" badge="Customers">
            <div className="mini-stats-grid">
              <MiniStat label="Total" value={customers.length} />
              <MiniStat label="New" value={recentCustomers.length} />
              <MiniStat label="Team" value={employees.length} />
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
        description: "Outstanding balances and current invoice status.",
        render: () => (
          <MiniPageFrame title="Invoices" badge="Invoices">
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
        description: "Revenue movement and recent payment records.",
        render: () => (
          <MiniPageFrame title="Payments" badge="Payments">
            <div className="mini-stats-grid">
              <MiniStat label="Total" value={payments.length} />
              <MiniStat label="Revenue" value={formatMoney(completedPaymentsTotal)} />
              <MiniStat label="Recent" value={recentPayments.length} />
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
        description: "Stock visibility and quick product health check.",
        render: () => (
          <MiniPageFrame title="Products" badge="Products">
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
        description: "Purchase flow, received records, and cost snapshot.",
        render: () => (
          <MiniPageFrame title="Purchases" badge="Purchases">
            <div className="mini-stats-grid">
              <MiniStat label="Total" value={purchases.length} />
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
    }, 4200);

    return () => window.clearInterval(interval);
  }, [previewSections.length]);

  const notifications = useMemo<DashboardNotification[]>(() => {
    const items: DashboardNotification[] = [];

    lowStockProducts.slice(0, 2).forEach((product) => {
      items.push({
        id: `low-${product.id}`,
        title: "Low stock",
        description: `${product.name} is close to the warning level.`,
        path: "/products",
        tone: "warning",
      });
    });

    outOfStockProducts.slice(0, 1).forEach((product) => {
      items.push({
        id: `out-${product.id}`,
        title: "Out of stock",
        description: `${product.name} is unavailable right now.`,
        path: "/products",
        tone: "danger",
      });
    });

    recentInvoices.slice(0, 2).forEach((invoice) => {
      items.push({
        id: `invoice-${invoice.id}`,
        title: "Invoice update",
        description: `${invoice.id} is currently ${invoice.status}.`,
        path: "/invoices",
        tone: invoice.status === "Debit" ? "danger" : "info",
      });
    });

    return items;
  }, [lowStockProducts, outOfStockProducts, recentInvoices]);

  useEffect(() => {
    if (notificationsPaused || notifications.length === 0) {
      setActiveNotification(null);
      setIsToastVisible(false);
      return;
    }

    const current = notifications[notificationCursor % notifications.length];
    setActiveNotification(current);
    setIsToastVisible(true);

    const hideTimer = window.setTimeout(() => {
      setIsToastVisible(false);
    }, 3200);

    const nextTimer = window.setTimeout(() => {
      setNotificationCursor((prev) => prev + 1);
    }, 4700);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(nextTimer);
    };
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
        label: "Revenue",
        value: formatMoney(completedPaymentsTotal),
        meta: "Completed payment records",
      },
      {
        label: "Collections",
        value: debitInvoices.length + partialInvoices.length,
        meta: "Pending customer follow-up",
      },
      {
        label: "Stock Alerts",
        value: lowStockProducts.length + outOfStockProducts.length,
        meta: "Low and out-of-stock products",
      },
    ],
    [
      completedPaymentsTotal,
      debitInvoices.length,
      partialInvoices.length,
      lowStockProducts.length,
      outOfStockProducts.length,
    ]
  );

  const quickInsights = useMemo(
    () => [
      {
        title: "Invoices to review",
        value: debitInvoices.length,
        hint: "Debit invoices still unpaid",
      },
      {
        title: "New customers",
        value: recentCustomers.length,
        hint: "Added in the last 14 days",
      },
      {
        title: "Team size",
        value: employees.length,
        hint: "Registered active staff",
      },
    ],
    [debitInvoices.length, recentCustomers.length, employees.length]
  );

  const smartBriefItems = useMemo(
    () => [
      {
        id: "attention",
        label: "Attention",
        value: `${debitInvoices.length} invoices need review`,
        prompt: "حلل الفواتير التي تحتاج مراجعة الآن واعطني أهم الأولويات",
      },
      {
        id: "opportunity",
        label: "Opportunity",
        value: `${recentCustomers.length} new customers joined recently`,
        prompt: "حلل العملاء الجدد مؤخرًا وما الفرص المحتملة معهم",
      },
      {
        id: "action",
        label: "Recommended Action",
        value: "Open AI Copilot for a deeper operational summary",
        prompt: "اعطني ملخصًا تشغيليًا ذكيًا للوحة التحكم الحالية",
      },
    ],
    [debitInvoices.length, recentCustomers.length]
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
          padding: 34px;
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(37, 99, 235, 0.68)),
            url("https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=80")
              center/cover no-repeat;
          color: white;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
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
          max-width: 760px;
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
          font-size: 46px;
          line-height: 1.04;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .dashboard-hero-subtitle {
          margin: 14px 0 0;
          font-size: 16px;
          line-height: 1.8;
          color: rgba(255,255,255,0.92);
          max-width: 660px;
        }

        .dashboard-hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 24px;
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
          grid-template-columns: 1.45fr 0.82fr;
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
          letter-spacing: -0.02em;
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
          border-radius: 22px;
          padding: 18px;
          min-height: 350px;
          transition: all 0.28s ease;
          position: relative;
          overflow: hidden;
        }

        .dashboard-preview-body::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top right, rgba(37,99,235,0.06), transparent 32%);
          pointer-events: none;
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
          transition: all 0.2s ease;
        }

        .dashboard-link-btn:hover {
          transform: translateY(-1px);
          background: #bfdbfe;
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
          font-size: 30px;
          font-weight: 800;
        }

        .dashboard-summary-meta {
          margin-top: 8px;
          color: #94a3b8;
          font-size: 13px;
        }

        .dashboard-insights-list {
          margin-top: 16px;
          display: grid;
          gap: 10px;
        }

        .dashboard-insight-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 12px 14px;
          background: #fbfdff;
        }

        .dashboard-insight-title {
          color: #0f172a;
          font-size: 14px;
          font-weight: 700;
        }

        .dashboard-insight-hint {
          margin-top: 4px;
          color: #94a3b8;
          font-size: 12px;
        }

        .dashboard-insight-value {
          color: #1d4ed8;
          font-size: 22px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .dashboard-ai-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 16px;
        }

        .dashboard-notification {
          position: fixed;
          right: 22px;
          bottom: 20px;
          width: min(340px, calc(100vw - 28px));
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(14px);
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          box-shadow: 0 22px 42px rgba(15, 23, 42, 0.12);
          padding: 14px 14px 13px;
          z-index: 1200;
          transition: transform 0.35s ease, opacity 0.35s ease;
        }

        .dashboard-notification.visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .dashboard-notification.hidden {
          opacity: 0;
          transform: translateY(18px);
          pointer-events: none;
        }

        .dashboard-notification.info {
          border-left: 4px solid #3b82f6;
        }

        .dashboard-notification.warning {
          border-left: 4px solid #f59e0b;
        }

        .dashboard-notification.success {
          border-left: 4px solid #22c55e;
        }

        .dashboard-notification.danger {
          border-left: 4px solid #ef4444;
        }

        .dashboard-notification-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .dashboard-notification-title {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
        }

        .dashboard-notification-text {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.65;
        }

        .dashboard-notification-link {
          margin-top: 10px;
          border: none;
          background: transparent;
          padding: 0;
          color: #2563eb;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .dashboard-toast-close {
          border: none;
          background: #f1f5f9;
          color: #475569;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          cursor: pointer;
          flex-shrink: 0;
          font-weight: 800;
        }

        .mini-page-frame {
          height: 100%;
          border: 1px solid #dbeafe;
          border-radius: 22px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          overflow: hidden;
        }

        .mini-page-frame::after {
          content: "";
          position: absolute;
          right: -40px;
          top: -40px;
          width: 130px;
          height: 130px;
          border-radius: 999px;
          background: rgba(37,99,235,0.05);
          pointer-events: none;
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
          width: 126px;
          height: 38px;
          border-radius: 14px;
          border: 1px solid #dbeafe;
          background: #f8fafc;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          padding: 0 12px;
        }

        .mini-page-search span {
          display: block;
          width: 58px;
          height: 8px;
          border-radius: 999px;
          background: #dbeafe;
        }

        .mini-page-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .mini-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .mini-stat {
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 15px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 74px;
          box-shadow: 0 8px 16px rgba(15, 23, 42, 0.03);
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
          transition: background 0.18s ease;
        }

        .mini-table-row:hover {
          background: #fbfdff;
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
          .dashboard-link-btn {
            width: 100%;
          }

          .dashboard-notification {
            right: 14px;
            left: 14px;
            width: auto;
            bottom: 14px;
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
                A cleaner executive dashboard with live previews, better signal-focused
                alerts, and a faster snapshot of revenue, invoices, stock, and team activity.
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

        <AISmartBrief
          items={smartBriefItems}
          onOpenCopilot={(prompt) => openAI({ prompt })}
        />

        <section className="dashboard-main-grid">
          <div className="dashboard-panel">
            <div className="dashboard-preview-head">
              <div>
                <span className="dashboard-preview-chip">Live Page Preview</span>
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
            <div style={{ marginBottom: "18px" }}>
              <span className="dashboard-preview-chip">Business Snapshot</span>
              <h2 className="dashboard-panel-title">Key Totals</h2>
              <p className="dashboard-panel-subtitle">
                A lighter summary with the most important numbers only.
              </p>
            </div>

            <div className="dashboard-summary-grid">
              {dashboardSummary.map((item) => (
                <InsightCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  meta={item.meta}
                />
              ))}
            </div>

            <div className="dashboard-ai-actions">
              <AIActionTrigger
                label="Explain Revenue"
                onClick={() =>
                  openAI({
                    prompt: "اشرح لي رقم الإيرادات الحالي وما الذي يؤثر عليه",
                  })
                }
              />
              <AIActionTrigger
                label="Review Collections"
                onClick={() =>
                  openAI({
                    prompt: "حلل التحصيلات الحالية وما الفواتير التي تحتاج متابعة",
                  })
                }
              />
              <AIActionTrigger
                label="Check Stock Alerts"
                onClick={() =>
                  openAI({
                    prompt: "حلل تنبيهات المخزون الحالية وما الإجراء المقترح",
                  })
                }
              />
            </div>

            <div className="dashboard-insights-list">
              {quickInsights.map((item) => (
                <div key={item.title} className="dashboard-insight-row">
                  <div>
                    <div className="dashboard-insight-title">{item.title}</div>
                    <div className="dashboard-insight-hint">{item.hint}</div>
                  </div>
                  <div className="dashboard-insight-value">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {activeNotification && !notificationsPaused && (
        <div
          className={`dashboard-notification ${activeNotification.tone} ${
            isToastVisible ? "visible" : "hidden"
          }`}
        >
          <div className="dashboard-notification-head">
            <div>
              <h4 className="dashboard-notification-title">
                {activeNotification.title}
              </h4>
              <p className="dashboard-notification-text">
                {activeNotification.description}
              </p>
              <button
                type="button"
                className="dashboard-notification-link"
                onClick={() => navigate(activeNotification.path)}
              >
                Open page
              </button>
            </div>

            <button
              type="button"
              className="dashboard-toast-close"
              onClick={() => {
                setIsToastVisible(false);
                setActiveNotification(null);
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}