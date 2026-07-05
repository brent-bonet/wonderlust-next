"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerAuth } from "@/lib/supabase/server-auth";

export async function signOut() {
  const supabase = await getSupabaseServerAuth();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/login");
}
