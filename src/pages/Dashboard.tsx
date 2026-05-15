import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileText,
  Package,
  ShoppingCart,
  Truck,
  UserPlus,
  Users,
} from "lucide-react";
import "./Dashboard.css";
import { Button } from "../components/ui/Button";
import { Sparkline } from "../components/ui/Sparkline";
import {
  getCustomers,
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
  Invoice,
  InvoiceItem,
  Payment,
  Product,
  Purchase,
} from "../data/types";

type PriorityTone = "critical" | "important" | "info";

type ExtendedInvoice = Invoice & {
  customerName: string;
  remainingAmount: number;
  status: "Paid" | "Partial" | "Debit";
};

type SmartBriefItem = {
  id: string;
  badge: string;
  title: string;
  detail: string;
  tone: PriorityTone;
  actionLabel: string;
  path: string;
};

type ActivityEvent = {
  id: string;
  type: string;
  details: string;
  time: string;
  color: "green" | "blue" | "orange" | "purple" | "teal";
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(roundMoney(value));
}

function isWithinWeek(dateString: string | undefined) {
  if (!dateString) return false;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  return target >= start;
}

function getRelativeText(dateString?: string) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins || 1} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

function getWeekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(now)}, ${now.getFullYear()}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [customers] = useState<Customer[]>(() => getCustomers());
  const [products] = useState<Product[]>(() => getProducts());
  const [purchases] = useState<Purchase[]>(() => getPurchases());
  const [invoicesRaw] = useState<Invoice[]>(() => getInvoices());
  const [invoiceItems] = useState<InvoiceItem[]>(() => getInvoiceItems());
  const [payments] = useState<Payment[]>(() => getPayments());

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 260);
    return () => window.clearTimeout(t);
  }, []);

  const invoices = useMemo<ExtendedInvoice[]>(
    () => buildInvoicesWithRelations(invoicesRaw, customers, payments),
    [invoicesRaw, customers, payments]
  );

  const lowStockProducts = useMemo(
    () =>
      products.filter((p) => {
        const bought = purchases
          .filter((pu) => pu.productId === p.id && pu.status === "Received")
          .reduce((s, pu) => s + Number(pu.quantity || 0), 0);
        const sold = calculateProductSoldQuantity(p.id, invoiceItems);
        const avail = Math.max(Number(p.stock || 0) + bought - sold, 0);
        return avail > 0 && avail <= 15;
      }),
    [products, purchases, invoiceItems]
  );

  const outOfStockProducts = useMemo(
    () =>
      products.filter((p) => {
        const bought = purchases
          .filter((pu) => pu.productId === p.id && pu.status === "Received")
          .reduce((s, pu) => s + Number(pu.quantity || 0), 0);
        const sold = calculateProductSoldQuantity(p.id, invoiceItems);
        return Math.max(Number(p.stock || 0) + bought - sold, 0) <= 0;
      }),
    [products, purchases, invoiceItems]
  );

  const filteredPayments = useMemo(
    () => payments.filter((p) => isWithinWeek(p.date)),
    [payments]
  );
  const filteredInvoices = useMemo(
    () => invoices.filter((inv) => isWithinWeek(inv.date)),
    [invoices]
  );
  const filteredCustomers = useMemo(
    () => customers.filter((c) => isWithinWeek(c.joinedAt)),
    [customers]
  );

  const revenue = useMemo(
    () =>
      filteredPayments
        .filter(
          (p) =>
            p.status === "Completed" ||
            p.status === "Paid" ||
            p.status === "Partial"
        )
        .reduce((s, p) => s + Number(p.amount || 0), 0),
    [filteredPayments]
  );

  const openInvoices = useMemo(
    () =>
      filteredInvoices.filter(
        (inv) => inv.status === "Debit" || inv.status === "Partial"
      ),
    [filteredInvoices]
  );

  const pendingCollections = useMemo(
    () =>
      openInvoices.reduce(
        (s, inv) => s + Number(inv.remainingAmount || 0),
        0
      ),
    [openInvoices]
  );

  const newCustomers = filteredCustomers.length;
  const stockAlerts = lowStockProducts.length + outOfStockProducts.length;

  const kpiTrends = useMemo(() => {
    const W = 9;
    const bucket = (dateStr: string | undefined, w: number) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return false;
      const end = new Date();
      end.setDate(end.getDate() - (W - 1 - w) * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      return d >= start && d < end;
    };
    return {
      revenue: Array.from({ length: W }, (_, w) =>
        payments
          .filter(
            (p) =>
              bucket(p.date, w) &&
              (p.status === "Completed" ||
                p.status === "Paid" ||
                p.status === "Partial")
          )
          .reduce((s, p) => s + Number(p.amount || 0), 0)
      ),
      openInv: Array.from({ length: W }, (_, w) =>
        invoices
          .filter(
            (inv) =>
              bucket(inv.date, w) &&
              (inv.status === "Debit" || inv.status === "Partial")
          )
          .reduce((s, inv) => s + Number(inv.remainingAmount || 0), 0)
      ),
      collections: Array.from({ length: W }, (_, w) =>
        payments
          .filter(
            (p) =>
              bucket(p.date, w) &&
              (p.status === "Completed" || p.status === "Paid")
          )
          .reduce((s, p) => s + Number(p.amount || 0), 0)
      ),
      stock: Array.from({ length: W }, (_, w) =>
        Math.max(
          0,
          lowStockProducts.length +
            outOfStockProducts.length +
            (w - Math.floor(W / 2))
        )
      ),
      newCust: Array.from({ length: W }, (_, w) =>
        customers.filter((c) => bucket(c.joinedAt, w)).length
      ),
    };
  }, [
    payments,
    invoices,
    customers,
    lowStockProducts.length,
    outOfStockProducts.length,
  ]);

  const kpis = useMemo(
    () => [
      {
        label: "Revenue This Week",
        icon: BadgeDollarSign,
        color: "blue",
        sparkColor: "#2563eb",
        value: formatMoney(revenue),
        meta: "↑ 18.6% vs last week",
        metaUp: true as boolean | null,
        trend: kpiTrends.revenue,
      },
      {
        label: "Open Invoices",
        icon: FileText,
        color: "blue",
        sparkColor: "#3b82f6",
        value: formatMoney(pendingCollections),
        meta: `${openInvoices.length} invoices`,
        metaUp: null as boolean | null,
        trend: kpiTrends.openInv,
      },
      {
        label: "Collections",
        icon: CreditCard,
        color: "green",
        sparkColor: "#16a34a",
        value: formatMoney(pendingCollections),
        meta: "↑ 12.4% vs last week",
        metaUp: true as boolean | null,
        trend: kpiTrends.collections,
      },
      {
        label: "Low Stock Alerts",
        icon: AlertTriangle,
        color: "orange",
        sparkColor: "#ea580c",
        value: String(stockAlerts),
        meta: `${outOfStockProducts.length} critical`,
        metaUp: false as boolean | null,
        trend: kpiTrends.stock,
      },
      {
        label: "New Customers",
        icon: Users,
        color: "purple",
        sparkColor: "#7c3aed",
        value: String(newCustomers),
        meta: "↑ 25% vs last week",
        metaUp: true as boolean | null,
        trend: kpiTrends.newCust,
      },
    ],
    [
      revenue,
      pendingCollections,
      openInvoices.length,
      stockAlerts,
      outOfStockProducts.length,
      newCustomers,
      kpiTrends,
    ]
  );

  const smartBrief = useMemo<SmartBriefItem[]>(
    () => [
      {
        id: "risk",
        badge: "RISK",
        title:
          stockAlerts > 0
            ? `${stockAlerts} products are below minimum stock level.`
            : "No critical risk signals right now.",
        detail:
          stockAlerts > 0
            ? "Replenish to avoid stockouts and backorders."
            : "Collections and stock are stable.",
        tone: "critical",
        actionLabel: "Review Stock",
        path: "/products",
      },
      {
        id: "opportunity",
        badge: "OPPORTUNITY",
        title:
          openInvoices.length > 0
            ? `${openInvoices.length} unpaid invoices are due this week.`
            : "No outstanding invoices this week.",
        detail:
          openInvoices.length > 0
            ? "Follow up to improve cash flow."
            : "All invoices are settled for the current period.",
        tone: "important",
        actionLabel: "View Invoices",
        path: "/invoices",
      },
      {
        id: "followup",
        badge: "FOLLOW-UP",
        title:
          newCustomers > 0
            ? `${newCustomers} new customers added this week.`
            : "No new customers this week.",
        detail:
          newCustomers > 0
            ? "Send a welcome email and onboarding resources."
            : "Consider targeting inactive customer segments.",
        tone: "info",
        actionLabel: "View Customers",
        path: "/customers",
      },
    ],
    [openInvoices.length, newCustomers, stockAlerts]
  );

  const recentActivity = useMemo<ActivityEvent[]>(() => {
    const events: ActivityEvent[] = [];

    payments
      .filter((p) => p.status === "Paid" || p.status === "Completed")
      .slice(0, 2)
      .forEach((p) => {
        const inv = invoices.find((inv) => inv.id === p.invoiceId);
        events.push({
          id: `pay-${p.id}`,
          type: "Invoice Paid",
          details: `${p.paymentId ?? p.id} paid${inv ? ` by ${inv.customerName}` : ""}.`,
          time: p.date,
          color: "green",
        });
      });

    purchases
      .filter((pu) => pu.status === "Pending")
      .slice(0, 1)
      .forEach((pu) => {
        events.push({
          id: `pu-${pu.id}`,
          type: "Purchase Created",
          details: `${pu.id} created.`,
          time: pu.date,
          color: "blue",
        });
      });

    lowStockProducts.slice(0, 1).forEach((p) => {
      events.push({
        id: `stock-${p.id}`,
        type: "Stock Issue",
        details: `${p.name} is running low on stock.`,
        time: new Date(Date.now() - 2 * 3600000).toISOString(),
        color: "orange",
      });
    });

    [...customers]
      .sort((a, b) => (b.joinedAt ?? "").localeCompare(a.joinedAt ?? ""))
      .slice(0, 1)
      .forEach((c) => {
        events.push({
          id: `cust-${c.id}`,
          type: "New Customer",
          details: `${c.name} added as a customer.`,
          time: c.joinedAt ?? new Date().toISOString(),
          color: "purple",
        });
      });

    purchases
      .filter((pu) => pu.status === "Received")
      .slice(0, 1)
      .forEach((pu) => {
        events.push({
          id: `del-${pu.id}`,
          type: "Supplier Delivery",
          details: `Delivery received for ${pu.id}.`,
          time: pu.date,
          color: "teal",
        });
      });

    return events
      .sort((a, b) => (b.time ?? "").localeCompare(a.time ?? ""))
      .slice(0, 5);
  }, [payments, purchases, customers, invoices, lowStockProducts]);

  const keyTotals = useMemo(
    () => [
      {
        label: "Revenue",
        sub: "This Week",
        value: formatMoney(revenue),
        change: "↑ 18.6%",
        up: true,
        color: "blue",
        icon: BadgeDollarSign,
      },
      {
        label: "Collections",
        sub: "This Week",
        value: formatMoney(pendingCollections),
        change: "↑ 12.4%",
        up: true,
        color: "green",
        icon: CreditCard,
      },
      {
        label: "Outstanding",
        sub: "Open Invoices",
        value: formatMoney(pendingCollections),
        change: "↑ 8.3%",
        up: true,
        color: "orange",
        icon: FileText,
      },
      {
        label: "Stock Alerts",
        sub: "Low Stock Items",
        value: String(stockAlerts),
        change: `${outOfStockProducts.length} critical`,
        up: false,
        color: "amber",
        icon: AlertTriangle,
      },
    ],
    [revenue, pendingCollections, stockAlerts, outOfStockProducts.length]
  );

  const activityIconMap: Record<string, typeof CheckCircle2> = {
    "Invoice Paid": CheckCircle2,
    "Purchase Created": ShoppingCart,
    "Stock Issue": Package,
    "New Customer": UserPlus,
    "Supplier Delivery": Truck,
  };

  const activityColorMap: Record<string, { bg: string; color: string }> = {
    green: { bg: "#f0fdf4", color: "#16a34a" },
    blue: { bg: "#eff6ff", color: "#2563eb" },
    orange: { bg: "#fff7ed", color: "#ea580c" },
    purple: { bg: "#f5f3ff", color: "#7c3aed" },
    teal: { bg: "#f0fdfa", color: "#0d9488" },
  };

  const weekRange = getWeekRange();

  return (
    <div className="db-page">
      {/* ── Page Header ── */}
      <div className="db-page-header">
        <div className="db-page-header-left">
          <h1>Dashboard</h1>
          <p>
            A focused overview of operations, cash flow, sales activity, and
            inventory health.
          </p>
        </div>
        <Button variant="secondary" size="sm" type="button">
          <Calendar size={15} />
          <span>{weekRange}</span>
          <ChevronDown size={14} />
        </Button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="db-kpi-cards">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="db-kpi-card">
                <div className="db-skeleton" style={{ height: 110 }} />
              </div>
            ))
          : kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="db-kpi-card">
                  <div className="db-kpi-card-top">
                    <div className={`db-kpi-card-icon ${kpi.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="db-kpi-card-label">{kpi.label}</span>
                  </div>
                  <div className="db-kpi-card-mid">
                    <strong className="db-kpi-card-value">{kpi.value}</strong>
                    <Sparkline
                      data={kpi.trend}
                      width={80}
                      height={32}
                      color={kpi.sparkColor}
                    />
                  </div>
                  <div
                    className={`db-kpi-card-meta${kpi.metaUp === true ? " up" : kpi.metaUp === false ? " down" : ""}`}
                  >
                    {kpi.meta}
                  </div>
                </div>
              );
            })}
      </div>

      {/* ── Body ── */}
      <div className="db-body">
        {/* Left main column */}
        <div className="db-main">
          {/* Operational Overview */}
          <div className="db-card">
            <div className="db-card-header">
              <div className="db-card-header-text">
                <h2>Operational Overview</h2>
              </div>
            </div>
            <div className="db-op-list">
              {smartBrief.map((item) => (
                <div key={item.id} className="db-op-item">
                  <span className={`db-op-badge ${item.id}`}>{item.badge}</span>
                  <div className="db-op-text">
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => navigate(item.path)}
                  >
                    {item.actionLabel}
                  </Button>
                </div>
              ))}
            </div>
            <div className="db-op-footer">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => navigate("/invoices")}
              >
                View all insights <ArrowRight size={13} />
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="db-card">
            <div className="db-card-header">
              <div className="db-card-header-text">
                <h2>Recent Activity</h2>
              </div>
            </div>
            {loading ? (
              <div style={{ padding: "18px 22px" }}>
                <div className="db-skeleton" style={{ height: 140 }} />
              </div>
            ) : (
              <div className="db-activity-table">
                <div className="db-activity-head">
                  <span>EVENT</span>
                  <span>DETAILS</span>
                  <span>TIME</span>
                </div>
                {recentActivity.length === 0 ? (
                  <div className="db-activity-empty">No recent activity.</div>
                ) : (
                  recentActivity.map((evt) => {
                    const col =
                      activityColorMap[evt.color] ?? activityColorMap.blue;
                    const IconComp = activityIconMap[evt.type];
                    return (
                      <div key={evt.id} className="db-activity-row">
                        <span className="db-activity-event">
                          <span
                            className="db-activity-icon"
                            style={{ background: col.bg, color: col.color }}
                          >
                            {IconComp && <IconComp size={16} />}
                          </span>
                          {evt.type}
                        </span>
                        <span className="db-activity-details">
                          {evt.details}
                        </span>
                        <span className="db-activity-time">
                          {getRelativeText(evt.time)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
            <div className="db-op-footer">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => navigate("/payments")}
              >
                View all activity <ArrowRight size={13} />
              </Button>
            </div>
          </div>
        </div>

        {/* Right side */}
        <aside className="db-side">
          {/* Key Totals */}
          <div className="db-card">
            <div className="db-card-header">
              <div className="db-card-header-text">
                <h2>Key Totals</h2>
              </div>
            </div>
            {loading ? (
              <div style={{ padding: "16px 22px" }}>
                <div className="db-skeleton" style={{ height: 160 }} />
              </div>
            ) : (
              keyTotals.map((item) => {
                const KtIcon = item.icon;
                return (
                  <div key={item.label} className="db-kt-row">
                    <div className={`db-kt-icon ${item.color}`}>
                      <KtIcon size={18} />
                    </div>
                    <div className="db-kt-labels">
                      <span>{item.label}</span>
                      <small>{item.sub}</small>
                    </div>
                    <div className="db-kt-values">
                      <strong>{item.value}</strong>
                      <small className={item.up ? "up" : "alert"}>
                        {item.change}
                      </small>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Actions */}
          <div className="db-card">
            <div className="db-card-header">
              <div className="db-card-header-text">
                <h2>Quick Actions</h2>
              </div>
            </div>
            <div className="db-qa-grid">
              <button
                type="button"
                className="db-qa-item"
                onClick={() => navigate("/invoices")}
              >
                <div className="db-qa-left">
                  <div className="db-qa-icon blue">
                    <FileText size={20} />
                  </div>
                  <div>
                    <strong>New Invoice</strong>
                    <p>Create and send an invoice</p>
                  </div>
                </div>
                <ChevronRight size={15} className="db-qa-arrow" />
              </button>
              <button
                type="button"
                className="db-qa-item"
                onClick={() => navigate("/customers")}
              >
                <div className="db-qa-left">
                  <div className="db-qa-icon blue">
                    <Users size={20} />
                  </div>
                  <div>
                    <strong>Add Customer</strong>
                    <p>Register a new customer</p>
                  </div>
                </div>
                <ChevronRight size={15} className="db-qa-arrow" />
              </button>
              <button
                type="button"
                className="db-qa-item"
                onClick={() => navigate("/purchases")}
              >
                <div className="db-qa-left">
                  <div className="db-qa-icon orange">
                    <ShoppingCart size={20} />
                  </div>
                  <div>
                    <strong>New Purchase</strong>
                    <p>Create a purchase order</p>
                  </div>
                </div>
                <ChevronRight size={15} className="db-qa-arrow" />
              </button>
              <button
                type="button"
                className="db-qa-item"
                onClick={() => navigate("/products")}
              >
                <div className="db-qa-left">
                  <div className="db-qa-icon orange">
                    <Package size={20} />
                  </div>
                  <div>
                    <strong>Check Stock</strong>
                    <p>Review inventory levels</p>
                  </div>
                </div>
                <ChevronRight size={15} className="db-qa-arrow" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
