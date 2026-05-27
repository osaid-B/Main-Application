import { supabase, USE_SUPABASE } from "../lib/supabase";
import type { SupplierRow, SupplierInsert, SupplierUpdate } from "../types/database";

export async function fetchSuppliers(): Promise<SupplierRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("is_deleted", false)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createSupplier(input: SupplierInsert): Promise<SupplierRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("suppliers")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSupplier(id: string, patch: SupplierUpdate): Promise<SupplierRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("suppliers")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSupplier(id: string): Promise<void> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("suppliers")
    .update({ is_deleted: true })
    .eq("id", id);
  if (error) throw error;
}
