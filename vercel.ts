import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  // 15:00 UTC ≈ 9am in Denver (salon time) — reminders for tomorrow's
  // bookings go out the morning before. Hobby plan: daily granularity.
  crons: [{ path: "/api/cron/reminders", schedule: "0 15 * * *" }],
};
