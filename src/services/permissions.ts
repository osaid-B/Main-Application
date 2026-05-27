import { supabase, USE_SUPABASE } from "../lib/supabase";
import type { RolePermissionRow, UserRoleRow, UserRoleInsert } from "../types/database";

export async function fetchRolePermissions(): Promise<RolePermissionRow[]> {
  if (!USE_SUPABASE) return [];
  const { data, error } = await supabase
    .from("role_permissions")
    .select("*")
    .order("role");
  if (error) throw error;
  return data ?? [];
}

export async function updateRolePermission(
  role: string,
  module: string,
  patch: Partial<Omit<RolePermissionRow, "id" | "role" | "module">>,
): Promise<RolePermissionRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("role_permissions")
    .update(patch)
    .eq("role", role)
    .eq("module", module)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchUserRole(userId: string): Promise<UserRoleRow | null> {
  if (!USE_SUPABASE) return null;
  const { data, error } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return data;
}

export async function assignUserRole(input: UserRoleInsert): Promise<UserRoleRow> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("user_roles")
    .upsert(input, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}
