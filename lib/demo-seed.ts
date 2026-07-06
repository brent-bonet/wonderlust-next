import type { SupabaseClient } from "@supabase/supabase-js";
import {
  FALLBACK_HOURS,
  FALLBACK_SERVICES,
  FALLBACK_STYLISTS,
} from "./fallback-data";

/*
 * Restores all site content to the reference-site state: wipes bookings,
 * payments, and blocked dates, then re-seeds services, stylists, business
 * hours, and weekly availability from lib/fallback-data.ts. Auth users are
 * untouched. Shared by scripts/seed.ts and the admin "Reset demo data"
 * action, so the button and the CLI can never drift apart.
 *
 * No "server-only" import here — the seed script runs under plain tsx.
 * Callers must pass a service-role client: bookings/payments have no
 * delete policy for authenticated users.
 */

/** Tue–Sat 9a–8p, matching lib/fallback-data.ts FALLBACK_OPEN_DAYS/WINDOW. */
const WEEKLY_WINDOW_DAYS = [2, 3, 4, 5, 6];

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

export type ResetSummary = {
  services: number;
  stylists: number;
  businessHours: number;
  availabilityWindows: number;
};

export async function resetDemoData(
  supabase: SupabaseClient,
): Promise<ResetSummary> {
  // Clear in FK order: payments → bookings reference services + stylists,
  // so they must go first or the catalog deletes fail.
  for (const table of [
    "payments",
    "bookings",
    "blocked_dates",
    "availability",
    "services",
    "stylists",
  ] as const) {
    const { error } = await supabase.from(table).delete().neq("id", NIL_UUID);
    if (error) throw new Error(`clear ${table}: ${error.message}`);
  }
  const { error: hoursClearError } = await supabase
    .from("business_hours")
    .delete()
    .neq("day_of_week", -1);
  if (hoursClearError) {
    throw new Error(`clear business_hours: ${hoursClearError.message}`);
  }

  const { error: servicesError } = await supabase.from("services").insert(
    FALLBACK_SERVICES.map((s, i) => ({
      name: s.name,
      description: s.description,
      category: s.category,
      price: s.price,
      price_display: s.priceDisplay,
      deposit_amount: s.depositAmount,
      duration_minutes: s.durationMinutes,
      full_prepayment: s.fullPrepayment,
      active: true,
      sort_order: i,
    })),
  );
  if (servicesError) throw new Error(`services: ${servicesError.message}`);

  const { data: stylistRows, error: stylistsError } = await supabase
    .from("stylists")
    .insert(
      FALLBACK_STYLISTS.map((s) => ({
        name: s.name,
        role: s.role,
        bio: s.bio,
        photo_url: s.photoUrl,
        active: true,
      })),
    )
    .select("id");
  if (stylistsError) throw new Error(`stylists: ${stylistsError.message}`);

  const { error: hoursError } = await supabase.from("business_hours").insert(
    FALLBACK_HOURS.map((h, dow) => ({
      day_of_week: dow,
      opens: h.closed ? null : "09:00",
      closes: h.closed ? null : "20:00",
      closed: h.closed,
    })),
  );
  if (hoursError) throw new Error(`business_hours: ${hoursError.message}`);

  const availabilityRows = (stylistRows ?? []).flatMap((stylist) =>
    WEEKLY_WINDOW_DAYS.map((dow) => ({
      stylist_id: stylist.id,
      day_of_week: dow,
      start_time: "09:00",
      end_time: "20:00",
      active: true,
    })),
  );
  const { error: availabilityError } = await supabase
    .from("availability")
    .insert(availabilityRows);
  if (availabilityError) {
    throw new Error(`availability: ${availabilityError.message}`);
  }

  return {
    services: FALLBACK_SERVICES.length,
    stylists: FALLBACK_STYLISTS.length,
    businessHours: FALLBACK_HOURS.length,
    availabilityWindows: availabilityRows.length,
  };
}
