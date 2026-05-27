import { supabase, USE_SUPABASE } from "../lib/supabase";
import type { ExpenseRow, ExpenseInsert, ExpenseUpdate } from "../types/database";

export async function fetchExpenses(): Promise<ExpenseRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("is_deleted", false)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createExpense(input: ExpenseInsert): Promise<ExpenseRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("expenses")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExpense(id: string, patch: ExpenseUpdate): Promise<ExpenseRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("expenses")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExpense(id: string): Promise<void> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("expenses")
    .update({ is_deleted: true })
    .eq("id", id);
  if (error) throw error;
}
