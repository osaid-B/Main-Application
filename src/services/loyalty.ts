import { supabase, USE_SUPABASE } from "../lib/supabase";
import type { LoyaltyTransactionRow, LoyaltyTransactionInsert } from "../types/database";

export async function fetchLoyaltyTransactions(customerId?: string): Promise<LoyaltyTransactionRow[]> {
  if (!USE_SUPABASE) return [];
  let q = supabase
    .from("loyalty_transactions")
    .select("*")
    .order("date", { ascending: false });
  if (customerId) q = q.eq("customer_id", customerId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createLoyaltyTransaction(input: LoyaltyTransactionInsert): Promise<LoyaltyTransactionRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("loyalty_transactions")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Returns the sum of coins for a customer (latest balance_after). */
export async function getCustomerCoinBalance(customerId: string): Promise<number> {
  if (!USE_SUPABASE) return 0;
  const { data, error } = await supabase
    .from("loyalty_transactions")
    .select("balance_after")
    .eq("customer_id", customerId)
    .order("date", { ascending: false })
    .limit(1)
    .single();
  if (error) return 0;
  return data?.balance_after ?? 0;
}
