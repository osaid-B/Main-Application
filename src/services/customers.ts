import { supabase, USE_SUPABASE } from "../lib/supabase";
import type { CustomerRow, CustomerInsert, CustomerUpdate } from "../types/database";

export async function fetchCustomers(): Promise<CustomerRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("is_deleted", false)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createCustomer(input: CustomerInsert): Promise<CustomerRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("customers")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCustomer(id: string, patch: CustomerUpdate): Promise<CustomerRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("customers")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCustomer(id: string): Promise<void> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("customers")
    .update({ is_deleted: true })
    .eq("id", id);
  if (error) throw error;
}
