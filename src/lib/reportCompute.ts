import type { Invoice, Expense, Payment } from "../data/types";
import { isSuccessfulPaymentStatus } from "../data/relations";
import type { PLLineItem } from "../data/reportsMock";

const COGS_RATE = 0.55;
const TAX_RATE = 0.16;
const FINANCE_RATE = 0.01;

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface MonthlyRow {
  monthKey: string; // "YYYY-MM"
  month: string;    // 3-letter abbreviation e.g. "Jul"
  revenue: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
}

export interface ReportData {
  /** Last 12 calendar months, oldest first */
  monthly: MonthlyRow[];
  allTime: {
    revenue: number;
    expenses: number;
    cogs: number;
    grossProfit: number;
    netProfit: number;
    grossMarginPct: number;
    receivables: number;
  };
  /** P&L line items for the Reports /pl tab — computed from all-time totals */
  pl: PLLineItem[];
}

/** Compute per-month and all-time financial report data from raw data arrays. */
export function computeAllReports(
  invoices: Invoice[],
  expenses: Expense[],
  payments: Payment[],
): ReportData {
  // Build last-12-month buckets
  const today = new Date();
  const monthly: MonthlyRow[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly.push({ monthKey: key, month: MONTH_ABBR[d.getMonth()], revenue: 0, expenses: 0, grossProfit: 0, netProfit: 0 });
  }
  const keyToIdx = new Map(monthly.map((m, i) => [m.monthKey, i]));

  // Aggregate payments → revenue
  for (const p of payments) {
    if (!isSuccessfulPaymentStatus(p.status)) continue;
    const key = p.date?.slice(0, 7);
    const idx = key !== undefined ? keyToIdx.get(key) : undefined;
    if (idx !== undefined) monthly[idx].revenue += Number(p.amount || 0);
  }

  // Aggregate expenses
  for (const e of expenses) {
    if (e.isDeleted) continue;
    const key = e.date?.slice(0, 7);
    const idx = key !== undefined ? keyToIdx.get(key) : undefined;
    if (idx !== undefined) monthly[idx].expenses += Number(e.amount || 0);
  }

  // Derive grossProfit / netProfit per month
  for (const m of monthly) {
    const cogs = m.revenue * COGS_RATE;
    const grossProfit = m.revenue - cogs;
    const operatingIncome = grossProfit - m.expenses;
    const financeCosts = m.revenue * FINANCE_RATE;
    const netBeforeTax = operatingIncome - financeCosts;
    const tax = Math.max(0, netBeforeTax * TAX_RATE);
    m.grossProfit = grossProfit;
    m.netProfit = netBeforeTax - tax;
  }

  // All-time totals (full dataset, not limited to 12 months)
  const totalRevenue = payments
    .filter((p) => isSuccessfulPaymentStatus(p.status))
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalExpenses = expenses
    .filter((e) => !e.isDeleted)
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const cogs = totalRevenue * COGS_RATE;
  const grossProfit = totalRevenue - cogs;
  const operatingIncome = grossProfit - totalExpenses;
  const financeCosts = totalRevenue * FINANCE_RATE;
  const netBeforeTax = operatingIncome - financeCosts;
  const tax = Math.max(0, netBeforeTax * TAX_RATE);
  const netProfit = netBeforeTax - tax;
  const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const receivables = invoices
    .filter((inv) => !inv.isDeleted && inv.status !== "Paid")
    .reduce((s, inv) => s + Number(inv.remainingAmount ?? inv.amount ?? 0), 0);

  const pl: PLLineItem[] = [
    { label: "Product Sales",    labelAr: "مبيعات المنتجات", amount: Math.round(totalRevenue * 0.92) },
    { label: "Service Revenue",  labelAr: "إيرادات الخدمات", amount: Math.round(totalRevenue * 0.06) },
    { label: "Other Income",     labelAr: "إيرادات أخرى",    amount: Math.round(totalRevenue * 0.02) },
    { label: "Total Income",     labelAr: "إجمالي الدخل",    amount: Math.round(totalRevenue), isTotal: true },
    { label: "Cost of Goods",    labelAr: "تكلفة البضاعة",   amount: Math.round(cogs), isNegative: true },
    { label: "Gross Profit",     labelAr: "إجمالي الربح",    amount: Math.round(grossProfit), isTotal: true },
    { label: "Salaries",         labelAr: "الرواتب",          amount: Math.round(totalExpenses * 0.55), isNegative: true },
    { label: "Rent",             labelAr: "الإيجار",          amount: Math.round(totalExpenses * 0.20), isNegative: true },
    { label: "Marketing",        labelAr: "التسويق",          amount: Math.round(totalExpenses * 0.10), isNegative: true },
    { label: "Admin Expenses",   labelAr: "مصروفات إدارية",   amount: Math.round(totalExpenses * 0.15), isNegative: true },
    { label: "Total Expenses",   labelAr: "إجمالي المصروفات", amount: Math.round(totalExpenses), isNegative: true, isTotal: true },
    { label: "Operating Income", labelAr: "الدخل التشغيلي",   amount: Math.round(operatingIncome), isTotal: true },
    { label: "Finance Costs",    labelAr: "تكاليف التمويل",   amount: Math.round(financeCosts), isNegative: true },
    { label: "Income Tax",       labelAr: "ضريبة الدخل",      amount: Math.round(tax), isNegative: true },
    { label: "Net Profit",       labelAr: "صافي الربح",       amount: Math.round(netProfit), isTotal: true },
  ];

  return {
    monthly,
    allTime: { revenue: totalRevenue, expenses: totalExpenses, cogs, grossProfit, netProfit, grossMarginPct, receivables },
    pl,
  };
}

/** Aggregate a filtered subset of MonthlyRows into P&L components for a given period. */
export function aggregateMonths(months: MonthlyRow[]) {
  const revenue = months.reduce((s, m) => s + m.revenue, 0);
  const expenses = months.reduce((s, m) => s + m.expenses, 0);
  const cogs = revenue * COGS_RATE;
  const grossProfit = revenue - cogs;
  const salaries = expenses * 0.55;
  const rent = expenses * 0.20;
  const marketing = expenses * 0.10;
  const admin = expenses * 0.15;
  const totalOpex = expenses;
  const operatingIncome = grossProfit - totalOpex;
  const financeCosts = revenue * FINANCE_RATE;
  const netBeforeTax = operatingIncome - financeCosts;
  const tax = Math.max(0, netBeforeTax * TAX_RATE);
  const netIncome = netBeforeTax - tax;
  return { revenue, cogs, grossProfit, salaries, rent, marketing, admin, totalOpex, operatingIncome, financeCosts, netBeforeTax, tax, netIncome };
}
