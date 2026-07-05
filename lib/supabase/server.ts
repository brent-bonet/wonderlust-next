import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Anon-key client for public reads (services, stylists, business hours).
 * Returns null when Supabase env vars aren't configured yet so callers can
 * fall back to reference content instead of crashing.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
