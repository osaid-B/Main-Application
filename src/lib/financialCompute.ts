import type { Invoice, Expense, Payment } from "../data/types";
import { isSuccessfulPaymentStatus } from "../data/relations";

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  grossMarginPct: number;
  receivables: number;
}

const COGS_RATE = 0.55;
const TAX_RATE = 0.16;

export function computeFinancialSummary(
  invoices: Invoice[],
  expenses: Expense[],
  payments: Payment[],
): FinancialSummary {
  const totalRevenue = payments
    .filter((p) => isSuccessfulPaymentStatus(p.status))
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const totalExpenses = expenses
    .filter((e) => !e.isDeleted)
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const cogs = totalRevenue * COGS_RATE;
  const grossProfit = totalRevenue - cogs;
  const operatingIncome = grossProfit - totalExpenses;
  const tax = Math.max(0, operatingIncome * TAX_RATE);
  const netProfit = operatingIncome - tax;
  const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const receivables = invoices
    .filter((inv) => !inv.isDeleted && inv.status !== "Paid")
    .reduce((s, inv) => s + Number(inv.remainingAmount ?? inv.amount ?? 0), 0);

  return { totalRevenue, totalExpenses, grossProfit, netProfit, grossMarginPct, receivables };
}
