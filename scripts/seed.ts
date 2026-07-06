/**
 * Seeds Supabase with Wonderlust Salon's real catalog (services, stylist,
 * business hours, weekly availability) so the app looks real from day one.
 * Re-running is a full demo reset — bookings are cleared too. Same logic as
 * the admin panel's "Reset demo data" button (lib/demo-seed.ts).
 *
 * Usage: npm run seed  (reads .env.local; requires SUPABASE_SERVICE_ROLE_KEY)
 */
import { createClient } from "@supabase/supabase-js";
import { resetDemoData } from "../lib/demo-seed";

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

resetDemoData(supabase)
  .then((summary) => {
    console.log(
      `Done — ${summary.services} services, ${summary.stylists} stylists, ` +
        `${summary.businessHours} business_hours rows, ` +
        `${summary.availabilityWindows} availability windows.`,
    );
  })
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
