import { supabase, USE_SUPABASE } from "../lib/supabase";

export interface RevenuePoint { period: string; revenue: number; expenses: number }

/** Returns monthly revenue + expenses aggregated from invoices and expenses tables. */
export async function fetchRevenueTrend(months = 6): Promise<RevenuePoint[]> {
  if (!USE_SUPABASE) return [];
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const sinceStr = since.toISOString().slice(0, 10);

  const [invRes, expRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("date, amount")
      .eq("is_deleted", false)
      .gte("date", sinceStr),
    supabase
      .from("expenses")
      .select("date, amount")
      .eq("is_deleted", false)
      .gte("date", sinceStr),
  ]);

  if (invRes.error) throw invRes.error;
  if (expRes.error) throw expRes.error;

  const map = new Map<string, RevenuePoint>();

  for (const inv of invRes.data ?? []) {
    const period = inv.date.slice(0, 7);
    const entry = map.get(period) ?? { period, revenue: 0, expenses: 0 };
    entry.revenue += inv.amount;
    map.set(period, entry);
  }
  for (const exp of expRes.data ?? []) {
    const period = exp.date.slice(0, 7);
    const entry = map.get(period) ?? { period, revenue: 0, expenses: 0 };
    entry.expenses += exp.amount;
    map.set(period, entry);
  }

  return [...map.values()].sort((a, b) => a.period.localeCompare(b.period));
}

export interface TopCustomerRow { customer_id: string; total: number }

export async function fetchTopCustomers(limit = 10): Promise<TopCustomerRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("invoices")
    .select("customer_id, amount")
    .eq("is_deleted", false);
  if (error) throw error;

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    totals.set(row.customer_id, (totals.get(row.customer_id) ?? 0) + row.amount);
  }

  return [...totals.entries()]
    .map(([customer_id, total]) => ({ customer_id, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
