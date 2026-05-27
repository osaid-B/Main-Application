import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when both env vars are present — gates all Supabase calls. */
export const USE_SUPABASE = !!(supabaseUrl && supabaseAnonKey);

/**
 * Typed Supabase client. Cast to non-null where USE_SUPABASE is verified.
 * Never call this directly — always call USE_SUPABASE first.
 */
export const supabase = USE_SUPABASE
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (null as any);

/** Typed alias for convenience. */
export type SupabaseClient = ReturnType<typeof createClient<Database>>;
