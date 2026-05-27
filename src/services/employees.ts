import { supabase, USE_SUPABASE } from "../lib/supabase";
import type { EmployeeRow, EmployeeInsert, EmployeeUpdate } from "../types/database";

export async function fetchEmployees(): Promise<EmployeeRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("is_deleted", false)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createEmployee(input: EmployeeInsert): Promise<EmployeeRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("employees")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEmployee(id: string, patch: EmployeeUpdate): Promise<EmployeeRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("employees")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteEmployee(id: string): Promise<void> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("employees")
    .update({ is_deleted: true })
    .eq("id", id);
  if (error) throw error;
}
