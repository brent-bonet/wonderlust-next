"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Supabase invite/recovery emails redirect to the Site URL with the session
 * in a "#access_token=...&type=invite" hash fragment — hashes never reach
 * the server, so this has to run client-side wherever the link lands.
 * Exchanges it for a real session, then hands off to /admin/set-password.
 */
export default function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token")) return;

    const params = new URLSearchParams(hash.slice(1));
    const type = params.get("type");
    if (type !== "invite" && type !== "recovery") return;

    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) return;

    const supabase = createSupabaseBrowserClient();
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      window.history.replaceState(null, "", window.location.pathname);
      if (!error) router.replace("/admin/set-password");
    });
  }, [router]);

  return null;
}
