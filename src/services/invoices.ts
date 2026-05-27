import { supabase, USE_SUPABASE } from "../lib/supabase";
import type { InvoiceRow, InvoiceInsert, InvoiceUpdate, InvoiceLineInsert } from "../types/database";

export async function fetchInvoices(): Promise<InvoiceRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("is_deleted", false)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createInvoice(
  invoice: InvoiceInsert,
  lines: InvoiceLineInsert[],
): Promise<InvoiceRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("invoices")
    .insert(invoice)
    .select()
    .single();
  if (error) throw error;
  if (lines.length > 0) {
    const { error: lineErr } = await supabase
      .from("invoice_lines")
      .insert(lines.map((l) => ({ ...l, invoice_id: data.id })));
    if (lineErr) throw lineErr;
  }
  return data;
}

export async function updateInvoice(id: string, patch: InvoiceUpdate): Promise<InvoiceRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("invoices")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInvoice(id: string): Promise<void> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("invoices")
    .update({ is_deleted: true })
    .eq("id", id);
  if (error) throw error;
}
