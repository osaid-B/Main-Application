import type { DataContextValue } from "../context/DataContext";
import type { FactoryContextValue } from "../context/FactoryContext";
import { formatCurrencyValue } from "../utils/displayFormatters";

type DataCtx = Pick<
  DataContextValue,
  "invoices" | "customers" | "products" | "expenses"
>;

type FactoryCtx = Pick<
  FactoryContextValue,
  "factoryOrders" | "qualityChecks" | "kpi"
>;

export interface AISmartAlert {
  type: "overdue" | "low-stock" | "delayed-order" | "inactive-customer";
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

export function buildAIContext(data: DataCtx, factory: FactoryCtx): Record<string, unknown> {
  const now = Date.now();

  // ── Invoices ──────────────────────────────────────────────────────────────
  const overdueInvoices = data.invoices.filter(
    (inv) => inv.status === "Debit" || inv.status === "Pending"
  );
  const overdueTotal = overdueInvoices.reduce(
    (sum, inv) => sum + (inv.total ?? inv.amount ?? 0),
    0
  );
  const paidInvoices = data.invoices.filter((inv) => inv.status === "Paid");
  const totalRevenue = paidInvoices.reduce(
    (sum, inv) => sum + (inv.total ?? inv.amount ?? 0),
    0
  );
  const recentInvoices = [...data.invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map((inv) => ({
      id: inv.id,
      customer: inv.customerId,
      amount: inv.total ?? inv.amount ?? 0,
      status: inv.status,
      date: inv.date,
    }));

  // ── Products ──────────────────────────────────────────────────────────────
  const lowStockProducts = data.products.filter(
    (p) => (p.stock ?? 0) <= (p.minStock ?? p.reorderThreshold ?? 5)
  );

  // ── Customers ─────────────────────────────────────────────────────────────
  const INACTIVE_DAYS = 45;
  const inactiveMs = INACTIVE_DAYS * 24 * 60 * 60 * 1000;
  const customerLastPurchase = new Map<string, number>();
  data.invoices.forEach((inv) => {
    const t = new Date(inv.date).getTime();
    const prev = customerLastPurchase.get(inv.customerId) ?? 0;
    if (t > prev) customerLastPurchase.set(inv.customerId, t);
  });
  const inactiveCustomers = data.customers.filter((c) => {
    const last = customerLastPurchase.get(c.id);
    return last !== undefined && now - last > inactiveMs;
  });

  // ── Factory ───────────────────────────────────────────────────────────────
  const delayedOrders = factory.factoryOrders.filter(
    (o) => o.status === "in-progress" && new Date(o.dueDate).getTime() < now
  );
  const qcPassRate = factory.kpi.qcPassRate;

  return {
    summary: {
      totalInvoices: data.invoices.length,
      overdueInvoices: overdueInvoices.length,
      overdueTotal: Math.round(overdueTotal),
      totalRevenue: Math.round(totalRevenue),
      totalCustomers: data.customers.length,
      totalProducts: data.products.length,
      lowStockProducts: lowStockProducts.length,
    },
    recentInvoices,
    lowStockProducts: lowStockProducts.slice(0, 10).map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      threshold: p.minStock ?? p.reorderThreshold ?? 5,
    })),
    inactiveCustomers: inactiveCustomers.slice(0, 5).map((c) => {
      const last = customerLastPurchase.get(c.id)!;
      return {
        name: c.name,
        daysSinceLastPurchase: Math.floor((now - last) / (1000 * 60 * 60 * 24)),
      };
    }),
    factory: {
      activeOrders: factory.kpi.activeOrders,
      qcPassRate,
      delayedOrders: delayedOrders.slice(0, 3).map((o) => ({
        id: o.id,
        daysLate: Math.floor((now - new Date(o.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
      })),
    },
  };
}

export function buildSmartAlerts(data: DataCtx, factory: FactoryCtx): AISmartAlert[] {
  const alerts: AISmartAlert[] = [];
  const now = Date.now();

  // Overdue invoices
  const overdueInvoices = data.invoices.filter(
    (inv) => inv.status === "Debit" || inv.status === "Pending"
  );
  if (overdueInvoices.length > 0) {
    const total = overdueInvoices.reduce(
      (sum, inv) => sum + (inv.total ?? inv.amount ?? 0),
      0
    );
    alerts.push({
      type: "overdue",
      title: "فواتير متأخرة",
      detail: `${overdueInvoices.length} فاتورة · ${formatCurrencyValue(Math.round(total))}`,
      severity: overdueInvoices.length > 5 ? "high" : "medium",
    });
  }

  // Low stock
  const lowStock = data.products.filter(
    (p) => (p.stock ?? 0) <= (p.minStock ?? p.reorderThreshold ?? 5)
  );
  if (lowStock.length > 0) {
    alerts.push({
      type: "low-stock",
      title: "مخزون منخفض",
      detail: `${lowStock.length} منتج تحت حد إعادة الطلب`,
      severity: lowStock.length > 3 ? "high" : "medium",
    });
  }

  // Delayed factory orders
  const delayed = factory.factoryOrders.filter(
    (o) => o.status === "in-progress" && new Date(o.dueDate).getTime() < now
  );
  if (delayed.length > 0) {
    const first = delayed[0];
    const days = Math.floor((now - new Date(first.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    alerts.push({
      type: "delayed-order",
      title: "أوامر إنتاج متأخرة",
      detail: `${first.id} · متأخر ${days} يوم`,
      severity: "high",
    });
  }

  // Inactive customers (45+ days)
  const INACTIVE_MS = 45 * 24 * 60 * 60 * 1000;
  const customerLastPurchase = new Map<string, number>();
  data.invoices.forEach((inv) => {
    const t = new Date(inv.date).getTime();
    const prev = customerLastPurchase.get(inv.customerId) ?? 0;
    if (t > prev) customerLastPurchase.set(inv.customerId, t);
  });
  const inactiveCustomers = data.customers.filter((c) => {
    const last = customerLastPurchase.get(c.id);
    return last !== undefined && now - last > INACTIVE_MS;
  });
  if (inactiveCustomers.length > 0) {
    const first = inactiveCustomers[0];
    const last = customerLastPurchase.get(first.id)!;
    const days = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    alerts.push({
      type: "inactive-customer",
      title: "عملاء غير نشطين",
      detail: `${first.name} · ${days} يوم بدون شراء`,
      severity: "low",
    });
  }

  return alerts;
}
