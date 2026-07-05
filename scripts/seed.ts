/**
 * Seeds Supabase with Wonderlust Salon's real catalog (services, stylist,
 * business hours, weekly availability) so the app looks real from day one.
 * Source of truth for the copy is lib/fallback-data.ts — the same content
 * the site renders when Supabase isn't configured.
 *
 * Usage: npm run seed  (reads .env.local; requires SUPABASE_SERVICE_ROLE_KEY)
 */
import { createClient } from "@supabase/supabase-js";
import {
  FALLBACK_HOURS,
  FALLBACK_SERVICES,
  FALLBACK_STYLISTS,
} from "../lib/fallback-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Copy .env.example to .env.local and fill in your Supabase project's keys first.",
  );
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

/** Tue–Sat 9a–8p, matching lib/fallback-data.ts FALLBACK_OPEN_DAYS/WINDOW. */
const WEEKLY_WINDOW_DAYS = [2, 3, 4, 5, 6];

async function main() {
  console.log("Seeding services…");
  // Demo reset: clear and re-insert so re-running the script is idempotent.
  await supabase.from("services").delete().neq("id", "00000000-0000-0000-0000-000000000000");
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

  console.log("Seeding stylists…");
  await supabase.from("stylists").delete().neq("id", "00000000-0000-0000-0000-000000000000");
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

  console.log("Seeding business hours…");
  await supabase.from("business_hours").delete().neq("day_of_week", -1);
  const { error: hoursError } = await supabase.from("business_hours").insert(
    FALLBACK_HOURS.map((h, dow) => ({
      day_of_week: dow,
      opens: h.closed ? null : "09:00",
      closes: h.closed ? null : "20:00",
      closed: h.closed,
    })),
  );
  if (hoursError) throw new Error(`business_hours: ${hoursError.message}`);

  console.log("Seeding stylist availability…");
  await supabase.from("availability").delete().neq("id", "00000000-0000-0000-0000-000000000000");
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
  if (availabilityError) throw new Error(`availability: ${availabilityError.message}`);

  console.log(
    `Done — ${FALLBACK_SERVICES.length} services, ${FALLBACK_STYLISTS.length} stylists, ` +
      `7 business_hours rows, ${availabilityRows.length} availability windows.`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
