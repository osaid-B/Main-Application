import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeDollarSign,
  BrainCircuit,
  Boxes,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CreditCard,
  FileClock,
  FileSearch,
  PackageSearch,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAI } from "../context/AIContext";
import "./Dashboard.css";
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
  roundMoney,
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

type PeriodFilter = "today" | "week" | "month";
type PriorityTone = "critical" | "important" | "info";
type PreviewKey = "payments" | "invoices" | "products" | "customers";

type DashboardNotification = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  path: string;
  tone: PriorityTone;
};

type ExtendedInvoice = Invoice & {
  customerName: string;
  remainingAmount: number;
  status: "Paid" | "Partial" | "Debit";
};

type SmartBriefItem = {
  id: string;
  category: "Risk" | "Opportunity" | "Recommended Action";
  title: string;
  detail: string;
  tone: PriorityTone;
  actionLabel: string;
  prompt: string;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(roundMoney(value));
}

function formatDate(value?: string) {
  if (!value) return "No date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function isWithinPeriod(dateString: string | undefined, period: PeriodFilter) {
  if (!dateString) return false;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return false;

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "today") {
    return target >= start;
  }

  if (period === "week") {
    start.setDate(start.getDate() - 6);
    return target >= start;
  }

  start.setDate(1);
  return target >= start;
}

function getPeriodLabel(period: PeriodFilter) {
  if (period === "today") return "Today";
  if (period === "week") return "This Week";
  return "This Month";
}

function getPriorityToneClass(tone: PriorityTone) {
  if (tone === "critical") return "tone-critical";
  if (tone === "important") return "tone-important";
  return "tone-info";
}

function getRelativeText(dateString?: string) {
  if (!dateString) return "No recent activity";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - target.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return `${Math.floor(diff / 30)} months ago`;
}

function PreviewFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="preview-frame">
      <div className="preview-frame-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <span className="preview-frame-badge">Live</span>
      </div>
      <div className="preview-frame-content">{children}</div>
    </div>
  );
}

function SkeletonCard() {
  return <div className="dashboard-skeleton-card" />;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { openAI } = useAI();

  const [period, setPeriod] = useState<PeriodFilter>("week");
  const [previewKey, setPreviewKey] = useState<PreviewKey>("payments");
  const [loading, setLoading] = useState(true);
  const [notificationsPaused, setNotificationsPaused] = useState(false);
  const [notificationIndex, setNotificationIndex] = useState(0);

  const [customers] = useState<Customer[]>(() => getCustomers());
  const [products] = useState<Product[]>(() => getProducts());
  const [purchases] = useState<Purchase[]>(() => getPurchases());
  const [invoicesRaw] = useState<Invoice[]>(() => getInvoices());
  const [invoiceItems] = useState<InvoiceItem[]>(() => getInvoiceItems());
  const [payments] = useState<Payment[]>(() => getPayments());
  const [employees] = useState<Employee[]>(() => getEmployees());

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 280);
    return () => window.clearTimeout(timer);
  }, []);

  const invoices = useMemo<ExtendedInvoice[]>(
    () => buildInvoicesWithRelations(invoicesRaw, customers, payments),
    [invoicesRaw, customers, payments]
  );

  const lowStockProducts = useMemo(() => {
    return products.filter((product) => {
      const purchasedQty = purchases
        .filter((purchase) => purchase.productId === product.id && purchase.status === "Received")
        .reduce((sum, purchase) => sum + Number(purchase.quantity || 0), 0);
      const soldQty = calculateProductSoldQuantity(product.id, invoiceItems);
      const available = Math.max(Number(product.stock || 0) + purchasedQty - soldQty, 0);
      return available > 0 && available <= 15;
    });
  }, [products, purchases, invoiceItems]);

  const outOfStockProducts = useMemo(() => {
    return products.filter((product) => {
      const purchasedQty = purchases
        .filter((purchase) => purchase.productId === product.id && purchase.status === "Received")
        .reduce((sum, purchase) => sum + Number(purchase.quantity || 0), 0);
      const soldQty = calculateProductSoldQuantity(product.id, invoiceItems);
      const available = Math.max(Number(product.stock || 0) + purchasedQty - soldQty, 0);
      return available <= 0;
    });
  }, [products, purchases, invoiceItems]);

  const filteredPayments = useMemo(
    () => payments.filter((payment) => isWithinPeriod(payment.date, period)),
    [payments, period]
  );
  const filteredInvoices = useMemo(
    () => invoices.filter((invoice) => isWithinPeriod(invoice.date, period)),
    [invoices, period]
  );
  const filteredCustomers = useMemo(
    () => customers.filter((customer) => isWithinPeriod(customer.joinedAt, period)),
    [customers, period]
  );

  const completedPayments = useMemo(
    () =>
      filteredPayments.filter(
        (payment) => payment.status === "Completed" || payment.status === "Paid" || payment.status === "Partial"
      ),
    [filteredPayments]
  );

  const revenue = useMemo(
    () => completedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [completedPayments]
  );

  const openInvoices = useMemo(
    () => filteredInvoices.filter((invoice) => invoice.status === "Debit" || invoice.status === "Partial"),
    [filteredInvoices]
  );

  const pendingCollections = useMemo(
    () => openInvoices.reduce((sum, invoice) => sum + Number(invoice.remainingAmount || 0), 0),
    [openInvoices]
  );

  const failedPayments = useMemo(
    () => filteredPayments.filter((payment) => payment.status === "Failed").length,
    [filteredPayments]
  );

  const refundedPayments = useMemo(
    () => filteredPayments.filter((payment) => payment.status === "Refunded").length,
    [filteredPayments]
  );

  const newCustomers = filteredCustomers.length;
  const stockAlerts = lowStockProducts.length + outOfStockProducts.length;
  const activeTeamSignals = useMemo(() => {
    const employeesWithRecentNotes = employees.filter((employee) => isWithinPeriod(employee.checkIn, period)).length;
    return employeesWithRecentNotes || employees.length;
  }, [employees, period]);

  const purchasesTotal = useMemo(
    () =>
      purchases
        .filter((purchase) => purchase.status === "Received" && isWithinPeriod(purchase.date, period))
        .reduce((sum, purchase) => sum + Number(purchase.totalCost || 0), 0),
    [period, purchases]
  );

  const executiveSnapshot = useMemo(
    () => [
      { label: "Revenue", value: formatMoney(revenue) },
      { label: "Open invoices", value: openInvoices.length },
      { label: "Stock alerts", value: stockAlerts },
    ],
    [revenue, openInvoices.length, stockAlerts]
  );

  const kpis = useMemo(
    () => [
      {
        label: "Revenue",
        value: formatMoney(revenue),
        meta: `${getPeriodLabel(period)}`,
        icon: <BadgeDollarSign size={18} />,
      },
      {
        label: "Open Invoices",
        value: openInvoices.length,
        meta: `${formatMoney(pendingCollections)} pending`,
        icon: <FileClock size={18} />,
      },
      {
        label: "Collections Pending",
        value: formatMoney(pendingCollections),
        meta: `${openInvoices.length} invoices waiting`,
        icon: <CreditCard size={18} />,
      },
      {
        label: "Stock Alerts",
        value: stockAlerts,
        meta: `${outOfStockProducts.length} out of stock`,
        icon: <Boxes size={18} />,
      },
      {
        label: "New Customers",
        value: newCustomers,
        meta: `${getPeriodLabel(period)}`,
        icon: <Users size={18} />,
      },
      {
        label: "Team Signals",
        value: activeTeamSignals,
        meta: `${employees.length} employees tracked`,
        icon: <BriefcaseBusiness size={18} />,
      },
    ],
    [
      revenue,
      period,
      openInvoices.length,
      pendingCollections,
      stockAlerts,
      outOfStockProducts.length,
      newCustomers,
      activeTeamSignals,
      employees.length,
    ]
  );

  const smartBrief = useMemo<SmartBriefItem[]>(() => {
    const debitCount = filteredInvoices.filter((invoice) => invoice.status === "Debit").length;
    const partialCount = filteredInvoices.filter((invoice) => invoice.status === "Partial").length;
    const recentCustomerCount = filteredCustomers.length;
    const collectionsTrend = purchasesTotal > 0 ? ((revenue - purchasesTotal) / purchasesTotal) * 100 : 0;

    return [
      {
        id: "risk",
        category: "Risk",
        title:
          debitCount > 0
            ? `${debitCount} invoices need review`
            : stockAlerts > 0
            ? `${stockAlerts} stock alerts need action`
            : "No critical alerts right now",
        detail:
          debitCount > 0
            ? `${partialCount} more invoices are partially collected.`
            : stockAlerts > 0
            ? `${outOfStockProducts.length} products are already unavailable.`
            : "Collections and stock are stable in the current view.",
        tone: debitCount > 0 || stockAlerts > 0 ? "critical" : "info",
        actionLabel: debitCount > 0 ? "Review invoices" : "Check stock",
        prompt:
          debitCount > 0
            ? "Review the invoice risk signals on the dashboard and tell me what should be handled first."
            : "Analyze the current stock alerts and suggest the next actions.",
      },
      {
        id: "opportunity",
        category: "Opportunity",
        title:
          recentCustomerCount > 0
            ? `${recentCustomerCount} new customers entered the pipeline`
            : "Customer growth is flat in this view",
        detail:
          recentCustomerCount > 0
            ? "Follow up with recent accounts for early invoice conversion."
            : "Consider targeting inactive customer segments this period.",
        tone: "important",
        actionLabel: "Review customers",
        prompt:
          recentCustomerCount > 0
            ? "Analyze the recent customers and suggest the strongest next commercial actions."
            : "Suggest actions to improve customer growth based on current dashboard signals.",
      },
      {
        id: "action",
        category: "Recommended Action",
        title:
          collectionsTrend < -10
            ? "Collections are down versus purchase cost"
            : failedPayments > 0
            ? `${failedPayments} payments need follow-up`
            : "Generate an executive summary",
        detail:
          collectionsTrend < -10
            ? "Review collections, payment failures, and overdue exposure with AI."
            : failedPayments > 0
            ? `${refundedPayments} refunds were also recorded in this period.`
            : "Ask AI to explain revenue, collections, and stock movement together.",
        tone: collectionsTrend < -10 || failedPayments > 0 ? "important" : "info",
        actionLabel: collectionsTrend < -10 ? "Explain revenue" : "Open AI summary",
        prompt:
          collectionsTrend < -10
            ? "Explain the revenue and collections change compared with purchasing activity."
            : "Give me a concise executive summary for this dashboard view.",
      },
    ];
  }, [failedPayments, filteredCustomers.length, filteredInvoices, outOfStockProducts.length, purchasesTotal, refundedPayments, revenue, stockAlerts]);

  const rightColumnTotals = useMemo(
    () => [
      {
        label: "Revenue",
        value: formatMoney(revenue),
        meta: `${getPeriodLabel(period)}`,
      },
      {
        label: "Collections",
        value: formatMoney(pendingCollections),
        meta: `${openInvoices.length} open invoices`,
      },
      {
        label: "Stock Alerts",
        value: stockAlerts,
        meta: `${lowStockProducts.length} low · ${outOfStockProducts.length} out`,
      },
    ],
    [revenue, period, pendingCollections, openInvoices.length, stockAlerts, lowStockProducts.length, outOfStockProducts.length]
  );

  const attentionSignals = useMemo(
    () => [
      {
        title: "Invoices to review",
        value: filteredInvoices.filter((invoice) => invoice.status === "Debit").length,
        tone: "critical" as PriorityTone,
        hint: "Critical follow-up required",
      },
      {
        title: "New customers",
        value: newCustomers,
        tone: "info" as PriorityTone,
        hint: `${getPeriodLabel(period)}`,
      },
      {
        title: "Team signals",
        value: activeTeamSignals,
        tone: "important" as PriorityTone,
        hint: "Review workload and activity",
      },
    ],
    [activeTeamSignals, filteredInvoices, newCustomers, period]
  );

  const previewTabs = useMemo(() => {
    const recentInvoiceRows = [...filteredInvoices]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 4);
    const recentPaymentRows = [...filteredPayments]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 4);
    const recentCustomerRows = [...customers]
      .sort((a, b) => (b.joinedAt ?? "").localeCompare(a.joinedAt ?? ""))
      .slice(0, 4);
    const productRows = [...products]
      .map((product) => {
        const purchasedQty = purchases
          .filter((purchase) => purchase.productId === product.id && purchase.status === "Received")
          .reduce((sum, purchase) => sum + Number(purchase.quantity || 0), 0);
        const soldQty = calculateProductSoldQuantity(product.id, invoiceItems);
        const available = Math.max(Number(product.stock || 0) + purchasedQty - soldQty, 0);
        return { ...product, available };
      })
      .slice(0, 4);

    return {
      payments: {
        title: "Payments",
        subtitle: "Recent collection activity and recorded amounts.",
        path: "/payments",
        actionLabel: "Check payments",
        content: (
          <PreviewFrame title="Payments" subtitle="Recent collection activity">
            <div className="preview-mini-stats">
              <div><span>Revenue</span><strong>{formatMoney(revenue)}</strong></div>
              <div><span>Pending</span><strong>{filteredPayments.filter((payment) => payment.status === "Pending").length}</strong></div>
              <div><span>Refunded</span><strong>{refundedPayments}</strong></div>
            </div>
            <div className="preview-table">
              <div className="preview-table-head"><span>Payment</span><span>Date</span><span>Amount</span></div>
              {recentPaymentRows.map((payment) => (
                <div key={payment.id} className="preview-table-row">
                  <span>{payment.paymentId ?? payment.id}</span>
                  <span>{formatDate(payment.date)}</span>
                  <span>{formatMoney(Number(payment.amount || 0))}</span>
                </div>
              ))}
            </div>
          </PreviewFrame>
        ),
      },
      invoices: {
        title: "Invoices",
        subtitle: "Open balances and review priority.",
        path: "/invoices",
        actionLabel: "Open invoices",
        content: (
          <PreviewFrame title="Invoices" subtitle="Open balances and risk">
            <div className="preview-mini-stats">
              <div><span>Open</span><strong>{openInvoices.length}</strong></div>
              <div><span>Partial</span><strong>{filteredInvoices.filter((invoice) => invoice.status === "Partial").length}</strong></div>
              <div><span>Balance</span><strong>{formatMoney(pendingCollections)}</strong></div>
            </div>
            <div className="preview-table">
              <div className="preview-table-head"><span>Invoice</span><span>Customer</span><span>Status</span></div>
              {recentInvoiceRows.map((invoice) => (
                <div key={invoice.id} className="preview-table-row">
                  <span>{invoice.id}</span>
                  <span>{invoice.customerName}</span>
                  <span>{invoice.status}</span>
                </div>
              ))}
            </div>
          </PreviewFrame>
        ),
      },
      products: {
        title: "Products",
        subtitle: "Inventory health and replenishment signals.",
        path: "/products",
        actionLabel: "Open stock alerts",
        content: (
          <PreviewFrame title="Products" subtitle="Inventory health snapshot">
            <div className="preview-mini-stats">
              <div><span>Products</span><strong>{products.length}</strong></div>
              <div><span>Low</span><strong>{lowStockProducts.length}</strong></div>
              <div><span>Out</span><strong>{outOfStockProducts.length}</strong></div>
            </div>
            <div className="preview-table">
              <div className="preview-table-head"><span>Product</span><span>Category</span><span>Stock</span></div>
              {productRows.map((product) => (
                <div key={product.id} className="preview-table-row">
                  <span>{product.name}</span>
                  <span>{product.category}</span>
                  <span>{product.available}</span>
                </div>
              ))}
            </div>
          </PreviewFrame>
        ),
      },
      customers: {
        title: "Customers",
        subtitle: "Recent additions and account movement.",
        path: "/customers",
        actionLabel: "Open customers",
        content: (
          <PreviewFrame title="Customers" subtitle="Customer pipeline snapshot">
            <div className="preview-mini-stats">
              <div><span>Total</span><strong>{customers.length}</strong></div>
              <div><span>New</span><strong>{newCustomers}</strong></div>
              <div><span>Open invoices</span><strong>{openInvoices.length}</strong></div>
            </div>
            <div className="preview-table">
              <div className="preview-table-head"><span>Name</span><span>Phone</span><span>Joined</span></div>
              {recentCustomerRows.map((customer) => (
                <div key={customer.id} className="preview-table-row">
                  <span>{customer.name}</span>
                  <span>{customer.phone}</span>
                  <span>{getRelativeText(customer.joinedAt)}</span>
                </div>
              ))}
            </div>
          </PreviewFrame>
        ),
      },
    };
  }, [
    customers,
    filteredInvoices,
    filteredPayments,
    invoiceItems,
    lowStockProducts.length,
    newCustomers,
    openInvoices.length,
    pendingCollections,
    products,
    purchases,
    refundedPayments,
    revenue,
    outOfStockProducts.length,
  ]);

  const notifications = useMemo<DashboardNotification[]>(() => {
    const items: DashboardNotification[] = [];

    const debitInvoice = filteredInvoices.find((invoice) => invoice.status === "Debit");
    if (debitInvoice) {
      items.push({
        id: `invoice-${debitInvoice.id}`,
        title: "Invoice needs review",
        description: `${debitInvoice.id} still has ${formatMoney(debitInvoice.remainingAmount)} outstanding.`,
        actionLabel: "Review invoice",
        path: "/invoices",
        tone: "critical",
      });
    }

    const failedPayment = filteredPayments.find((payment) => payment.status === "Failed");
    if (failedPayment) {
      items.push({
        id: `payment-${failedPayment.id}`,
        title: "Payment follow-up required",
        description: `${failedPayment.paymentId ?? failedPayment.id} failed and needs review.`,
        actionLabel: "Check payments",
        path: "/payments",
        tone: "important",
      });
    }

    const stockProduct = outOfStockProducts[0] ?? lowStockProducts[0];
    if (stockProduct) {
      items.push({
        id: `stock-${stockProduct.id}`,
        title: outOfStockProducts.length > 0 ? "Stock issue detected" : "Stock alert detected",
        description: `${stockProduct.name} needs replenishment attention.`,
        actionLabel: "Resolve now",
        path: "/products",
        tone: outOfStockProducts.length > 0 ? "critical" : "important",
      });
    }

    return items;
  }, [filteredInvoices, filteredPayments, lowStockProducts, outOfStockProducts]);

  useEffect(() => {
    if (notificationsPaused || notifications.length === 0) {
      return;
    }

    const timer = window.setTimeout(
      () => setNotificationIndex((current) => (current + 1) % notifications.length),
      4200
    );
    return () => window.clearTimeout(timer);
  }, [notificationIndex, notifications, notificationsPaused]);

  const activeNotification =
    !notificationsPaused && notifications.length > 0
      ? notifications[notificationIndex % notifications.length]
      : null;

  const currentPreview = previewTabs[previewKey];

  return (
    <div className="dashboard-command-center">
      <section className="dashboard-executive-hero">
        <div className="dashboard-hero-overlay" />
        <div className="dashboard-hero-content">
          <div className="dashboard-hero-copy">
            <span className="dashboard-hero-label">{getPeriodLabel(period)} Executive View</span>
            <h1>Business Control Center</h1>
            <p>Revenue, collections, invoices, stock, and team signals in one compact command view.</p>

            <div className="dashboard-inline-kpis">
              {executiveSnapshot.map((item) => (
                <div key={item.label} className="dashboard-inline-kpi">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-hero-actions">
            <div className="dashboard-period-switch">
              {(["today", "week", "month"] as PeriodFilter[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`period-btn ${period === value ? "active" : ""}`}
                  onClick={() => setPeriod(value)}
                >
                  {getPeriodLabel(value)}
                </button>
              ))}
            </div>

            <div className="dashboard-hero-cta-row">
              <button type="button" className="hero-btn primary" onClick={() => navigate("/invoices")}>
                Add Invoice
              </button>
              <button type="button" className="hero-btn secondary" onClick={() => navigate("/customers")}>
                Add Customer
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-kpi-strip">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
          : kpis.map((item) => (
              <article key={item.label} className="dashboard-kpi-card">
                <span className="dashboard-kpi-icon">{item.icon}</span>
                <div>
                  <p>{item.label}</p>
                  <strong>{item.value}</strong>
                  <small>{item.meta}</small>
                </div>
              </article>
            ))}
      </section>

      <section className="dashboard-smart-brief">
        <div className="smart-brief-header">
          <div>
            <span className="section-chip">Smart Brief</span>
            <h2>Operational summary</h2>
            <p>Short risk, opportunity, and AI-ready actions for the current view.</p>
          </div>
          <button
            type="button"
            className="smart-brief-main-ai"
            onClick={() => openAI({ prompt: "Give me an executive summary of this dashboard with priorities and next actions." })}
          >
            Ask AI
          </button>
        </div>

        <div className="smart-brief-grid">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)
            : smartBrief.map((item) => (
                <article key={item.id} className={`smart-brief-card ${getPriorityToneClass(item.tone)}`}>
                  <div className="smart-brief-top">
                    <span>{item.category}</span>
                    {item.tone === "critical" ? <CircleAlert size={15} /> : item.tone === "important" ? <TrendingDown size={15} /> : <TrendingUp size={15} />}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                  <button type="button" className="smart-brief-link" onClick={() => openAI({ prompt: item.prompt })}>
                    {item.actionLabel}
                  </button>
                </article>
              ))}
        </div>
      </section>

      <section className="dashboard-main-grid">
        <div className="dashboard-main-column">
          <section className="dashboard-panel">
            <div className="panel-header">
              <div>
                <span className="section-chip">Live Preview</span>
                <h2>Operational previews</h2>
                <p>Use these live snapshots as shortcuts into the busiest modules.</p>
              </div>
            </div>

            <div className="preview-tab-bar">
              {(["payments", "invoices", "products", "customers"] as PreviewKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`preview-tab-btn ${previewKey === key ? "active" : ""}`}
                  onClick={() => setPreviewKey(key)}
                >
                  {key === "payments" && "Payments"}
                  {key === "invoices" && "Invoices"}
                  {key === "products" && "Products"}
                  {key === "customers" && "Customers"}
                </button>
              ))}
            </div>

            <div className="preview-panel-body">
              {loading ? <SkeletonCard /> : currentPreview.content}
            </div>

            <div className="preview-panel-footer">
              <button type="button" className="preview-link-btn" onClick={() => navigate(currentPreview.path)}>
                {currentPreview.actionLabel}
                <ArrowRight size={14} />
              </button>
            </div>
          </section>
        </div>

        <aside className="dashboard-side-column">
          <section className="dashboard-panel">
            <div className="panel-header compact">
              <div>
                <span className="section-chip">Key Totals</span>
                <h2>Topline view</h2>
              </div>
            </div>
            <div className="totals-grid">
              {loading
                ? Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)
                : rightColumnTotals.map((item) => (
                    <article key={item.label} className="total-card">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                      <small>{item.meta}</small>
                    </article>
                  ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-header compact">
              <div>
                <span className="section-chip">Signals</span>
                <h2>Requiring attention</h2>
              </div>
              <button
                type="button"
                className="panel-ghost-action"
                onClick={() => setNotificationsPaused((current) => !current)}
              >
                {notificationsPaused ? "Resume alerts" : "Pause alerts"}
              </button>
            </div>
            <div className="signals-list">
              {loading
                ? Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)
                : attentionSignals.map((item) => (
                    <article key={item.title} className={`signal-card ${getPriorityToneClass(item.tone)}`}>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.hint}</p>
                      </div>
                      <b>{item.value}</b>
                    </article>
                  ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-header compact">
              <div>
                <span className="section-chip">AI Shortcuts</span>
                <h2>Focused drill-down</h2>
              </div>
            </div>
            <div className="ai-shortcut-list">
              <button
                type="button"
                className="ai-shortcut-btn"
                onClick={() => openAI({ prompt: "Explain the current revenue movement and what is driving it." })}
              >
                <BrainCircuit size={16} />
                Explain Revenue
                <ChevronRight size={15} />
              </button>
              <button
                type="button"
                className="ai-shortcut-btn"
                onClick={() => openAI({ prompt: "Review collection risks, overdue exposure, and what should happen next." })}
              >
                <FileSearch size={16} />
                Review Collections
                <ChevronRight size={15} />
              </button>
              <button
                type="button"
                className="ai-shortcut-btn"
                onClick={() => openAI({ prompt: "Check current stock alerts and tell me what requires action first." })}
              >
                <PackageSearch size={16} />
                Check Stock Alerts
                <ChevronRight size={15} />
              </button>
            </div>
          </section>
        </aside>
      </section>

      {activeNotification && !notificationsPaused && (
        <div className={`dashboard-alert-toast ${getPriorityToneClass(activeNotification.tone)}`}>
          <div className="dashboard-alert-copy">
            <strong>{activeNotification.title}</strong>
            <p>{activeNotification.description}</p>
          </div>
          <div className="dashboard-alert-actions">
            <button type="button" className="alert-link-btn" onClick={() => navigate(activeNotification.path)}>
              {activeNotification.actionLabel}
            </button>
            <button
              type="button"
              className="alert-dismiss-btn"
              onClick={() => setNotificationsPaused(true)}
              aria-label="Dismiss alert"
            >
              <CheckCircle2 size={14} />
            </button>
          </div>
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="dashboard-alert-empty">
          <CheckCircle2 size={16} />
          <span>No alerts require attention in the current view.</span>
        </div>
      )}
    </div>
  );
}
