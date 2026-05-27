import { supabase, USE_SUPABASE } from "../lib/supabase";
import type { UserRoleRow } from "../types/database";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRoleRow["role"] | null;
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  if (!USE_SUPABASE) throw new Error("Supabase not configured");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const user = data.user;
  const roleRow = await fetchUserRoleForUser(user.id);
  return { id: user.id, email: user.email ?? email, role: roleRow?.role ?? null };
}

export async function signOut(): Promise<void> {
  if (!USE_SUPABASE) return;
  await supabase.auth.signOut();
}

export async function getSession(): Promise<AuthUser | null> {
  if (!USE_SUPABASE) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const roleRow = await fetchUserRoleForUser(session.user.id);
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    role: roleRow?.role ?? null,
  };
}

async function fetchUserRoleForUser(userId: string): Promise<UserRoleRow | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data ?? null;
}

/** Listen for auth state changes — call once at app boot. */
export function onAuthStateChange(
  callback: (user: AuthUser | null) => void,
): () => void {
  if (!USE_SUPABASE) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (!session) { callback(null); return; }
      const roleRow = await fetchUserRoleForUser(session.user.id);
      callback({
        id: session.user.id,
        email: session.user.email ?? "",
        role: roleRow?.role ?? null,
      });
    },
  );
  return () => subscription.unsubscribe();
}
