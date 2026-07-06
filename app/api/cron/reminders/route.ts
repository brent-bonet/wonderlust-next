import { NextResponse } from "next/server";
import { salonNow } from "@/lib/booking";
import { sendBookingReminderEmail } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Daily reminder cron (see crons in vercel config): emails every confirmed
 * booking happening tomorrow, salon time. Runs once per day, so each booking
 * gets exactly one reminder — no dedup bookkeeping needed.
 * Vercel invokes this with "Authorization: Bearer ${CRON_SECRET}".
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supabase = getSupabaseAdmin();
  if (!secret || !supabase) {
    return NextResponse.json(
      { error: "Reminder cron isn't configured yet." },
      { status: 501 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { date } = salonNow();
  const [y, m, d] = date.split("-").map(Number);
  // Date.UTC rolls month/year boundaries over correctly.
  const tomorrow = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id, client_name, client_email, appointment_date, appointment_time, services (name), stylists (name)",
    )
    .eq("appointment_date", tomorrow)
    .eq("status", "confirmed");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const failures: string[] = [];
  for (const booking of bookings ?? []) {
    const service = Array.isArray(booking.services)
      ? booking.services[0]
      : booking.services;
    const stylist = Array.isArray(booking.stylists)
      ? booking.stylists[0]
      : booking.stylists;
    try {
      await sendBookingReminderEmail({
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        serviceName: service?.name ?? "your service",
        stylistName: stylist?.name ?? "your stylist",
        appointmentDate: booking.appointment_date,
        appointmentTime: booking.appointment_time,
        amountPaid: 0,
        paymentType: "none",
      });
    } catch {
      failures.push(booking.id);
    }
  }

  return NextResponse.json({
    date: tomorrow,
    sent: (bookings?.length ?? 0) - failures.length,
    failed: failures.length,
  });
}
