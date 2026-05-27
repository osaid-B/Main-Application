import { supabase, USE_SUPABASE } from "../lib/supabase";
import type { PaymentRow, PaymentInsert, PaymentUpdate } from "../types/database";

export async function fetchPayments(invoiceId?: string): Promise<PaymentRow[]> {
  if (!USE_SUPABASE) return [];
  let q = supabase.from("payments").select("*").order("date", { ascending: false });
  if (invoiceId) q = q.eq("invoice_id", invoiceId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createPayment(input: PaymentInsert): Promise<PaymentRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("payments")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePayment(id: string, patch: PaymentUpdate): Promise<PaymentRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("payments")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
