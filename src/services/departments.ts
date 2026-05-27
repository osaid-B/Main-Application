import { supabase, USE_SUPABASE } from "../lib/supabase";
import type { DepartmentRow, DepartmentInsert, DepartmentUpdate } from "../types/database";

export async function fetchDepartments(): Promise<DepartmentRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createDepartment(input: DepartmentInsert): Promise<DepartmentRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("departments")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDepartment(id: string, patch: DepartmentUpdate): Promise<DepartmentRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("departments")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDepartment(id: string): Promise<void> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
