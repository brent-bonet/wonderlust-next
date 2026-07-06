"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { backTo, requireAdmin } from "@/lib/admin";
import { resetDemoData } from "@/lib/demo-seed";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServerAuth } from "@/lib/supabase/server-auth";

export async function signOut() {
  const supabase = await getSupabaseServerAuth();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/login");
}

/**
 * Demo-site escape hatch: wipe all content (bookings included) and restore
 * the seeded catalog. Auth users survive. Runs on the service-role client —
 * authenticated RLS has no delete policy on bookings/payments — but only
 * after requireAdmin() has verified the session.
 */
export async function resetDemoContent() {
  await requireAdmin();
  const admin = getSupabaseAdmin();
  if (!admin) backTo("/admin/bookings", "Supabase isn't configured.");

  try {
    await resetDemoData(admin);
  } catch (err) {
    backTo(
      "/admin/bookings",
      err instanceof Error ? err.message : "Reset failed.",
    );
  }

  // Content changed everywhere — invalidate the whole tree.
  revalidatePath("/", "layout");
  redirect(
    `/admin/bookings?notice=${encodeURIComponent(
      "Demo content restored — bookings cleared, original services, team, and hours back in place.",
    )}`,
  );
}
