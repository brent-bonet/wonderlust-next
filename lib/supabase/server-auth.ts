import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cookie-aware client for the admin panel: reads the signed-in owner's
 * session so queries run under the `authenticated` RLS policies.
 * Returns null when Supabase env vars aren't configured yet (demo mode).
 */
export async function getSupabaseServerAuth(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — session refresh is handled by
          // proxy.ts, so dropping the write here is safe.
        }
      },
    },
  });
}

/**
 * Resolve the signed-in admin user, or null when signed out.
 * Demo mode (no Supabase) also returns null — callers decide how to degrade.
 */
export async function getAdminUser() {
  const supabase = await getSupabaseServerAuth();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
