import "server-only";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerAuth } from "./supabase/server-auth";

/**
 * Auth gate for admin server actions. Never trust proxy.ts coverage alone —
 * every mutation re-verifies the session here. Redirects to login when
 * signed out (or in demo mode, where mutations are impossible anyway).
 */
export async function requireAdmin(): Promise<SupabaseClient> {
  const supabase = await getSupabaseServerAuth();
  if (!supabase) redirect("/admin/login");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return supabase;
}

/** "" → null, otherwise a finite number; dollars-and-cents friendly. */
export function numOrNull(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function strOrNull(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
}

/** Success → revalidated section; failure → same page with ?error=. */
export function backTo(path: string, error?: string): never {
  redirect(error ? `${path}?error=${encodeURIComponent(error)}` : path);
}
