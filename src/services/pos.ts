import { supabase, USE_SUPABASE } from "../lib/supabase";
import type {
  PosProductRow, PosProductInsert, PosProductUpdate,
  PosCashierRow, PosCashierInsert, PosCashierUpdate,
  PosSaleRow, PosSaleInsert,
  PosRefundRow, PosRefundInsert, PosRefundUpdate,
  PosStockCountRow, PosStockCountInsert, PosStockCountUpdate,
} from "../types/database";

// ── Products ──────────────────────────────────────────────────────────────────

export async function fetchPosProducts(): Promise<PosProductRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("pos_products")
    .select("*")
    .eq("is_deleted", false)
    .eq("archived", false)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createPosProduct(input: PosProductInsert): Promise<PosProductRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("pos_products")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePosProduct(id: string, patch: PosProductUpdate): Promise<PosProductRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("pos_products")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Cashiers ──────────────────────────────────────────────────────────────────

export async function fetchPosCashiers(): Promise<PosCashierRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("pos_cashiers")
    .select("*")
    .eq("is_deleted", false)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createPosCashier(input: PosCashierInsert): Promise<PosCashierRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("pos_cashiers")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePosCashier(id: string, patch: PosCashierUpdate): Promise<PosCashierRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("pos_cashiers")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Sales ─────────────────────────────────────────────────────────────────────

export async function fetchPosSales(limit = 100): Promise<PosSaleRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("pos_sales")
    .select("*")
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function createPosSale(input: PosSaleInsert): Promise<PosSaleRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("pos_sales")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Refunds ───────────────────────────────────────────────────────────────────

export async function fetchPosRefunds(): Promise<PosRefundRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("pos_refunds")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPosRefund(input: PosRefundInsert): Promise<PosRefundRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("pos_refunds")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePosRefund(id: string, patch: PosRefundUpdate): Promise<PosRefundRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("pos_refunds")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Stock Counts ──────────────────────────────────────────────────────────────

export async function fetchStockCounts(): Promise<PosStockCountRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("pos_stock_counts")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createStockCount(input: PosStockCountInsert): Promise<PosStockCountRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("pos_stock_counts")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateStockCount(id: string, patch: PosStockCountUpdate): Promise<PosStockCountRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("pos_stock_counts")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
