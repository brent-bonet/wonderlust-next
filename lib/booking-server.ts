import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  dayOfWeek,
  filterPastSlots,
  generateSlots,
  intersectWindows,
  toMinutes,
  type TimeWindow,
} from "./booking";
import {
  FALLBACK_OPEN_DAYS,
  FALLBACK_OPEN_WINDOW,
  FALLBACK_SERVICES,
  FALLBACK_STYLISTS,
} from "./fallback-data";

export type SlotResult =
  | { ok: true; slots: number[]; demo: boolean }
  | { ok: false; status: number; error: string };

/**
 * Compute open start times (minutes from midnight) for a stylist + service +
 * date from availability, business hours, blocked dates, and existing
 * bookings. Demo mode (no Supabase configured) serves fallback hours so the
 * flow is walkable before credentials exist.
 */
export async function getAvailableSlots(
  supabase: SupabaseClient | null,
  params: { stylistId: string; serviceId: string; date: string },
): Promise<SlotResult> {
  const { stylistId, serviceId, date } = params;
  const dow = dayOfWeek(date);

  if (!supabase) {
    const service = FALLBACK_SERVICES.find((s) => s.id === serviceId);
    const stylist = FALLBACK_STYLISTS.find((s) => s.id === stylistId);
    if (!service || !stylist) {
      return { ok: false, status: 404, error: "Unknown service or stylist." };
    }
    if (!FALLBACK_OPEN_DAYS.has(dow)) return { ok: true, slots: [], demo: true };
    const slots = generateSlots(
      [FALLBACK_OPEN_WINDOW],
      [],
      service.durationMinutes,
    );
    return { ok: true, slots: filterPastSlots(date, slots), demo: true };
  }

  const [serviceRes, hoursRes, availabilityRes, blockedRes, bookingsRes] =
    await Promise.all([
      supabase
        .from("services")
        .select("id, duration_minutes")
        .eq("id", serviceId)
        .eq("active", true)
        .maybeSingle(),
      supabase
        .from("business_hours")
        .select("opens, closes, closed")
        .eq("day_of_week", dow)
        .maybeSingle(),
      supabase
        .from("availability")
        .select("start_time, end_time")
        .eq("stylist_id", stylistId)
        .eq("day_of_week", dow)
        .eq("active", true),
      supabase
        .from("blocked_dates")
        .select("id")
        .eq("stylist_id", stylistId)
        .eq("date", date),
      supabase
        .from("bookings")
        .select("appointment_time, services (duration_minutes)")
        .eq("stylist_id", stylistId)
        .eq("appointment_date", date)
        .in("status", ["pending", "confirmed"]),
    ]);

  const firstError =
    serviceRes.error ??
    hoursRes.error ??
    availabilityRes.error ??
    blockedRes.error ??
    bookingsRes.error;
  if (firstError) {
    return { ok: false, status: 500, error: firstError.message };
  }
  if (!serviceRes.data) {
    return { ok: false, status: 404, error: "Unknown service." };
  }
  const duration = serviceRes.data.duration_minutes ?? 60;

  if (!hoursRes.data || hoursRes.data.closed) {
    return { ok: true, slots: [], demo: false };
  }
  if (blockedRes.data && blockedRes.data.length > 0) {
    return { ok: true, slots: [], demo: false };
  }

  const businessWindow: TimeWindow = {
    start: toMinutes(hoursRes.data.opens),
    end: toMinutes(hoursRes.data.closes),
  };
  const windows = (availabilityRes.data ?? [])
    .map((row) =>
      intersectWindows(
        { start: toMinutes(row.start_time), end: toMinutes(row.end_time) },
        businessWindow,
      ),
    )
    .filter((w): w is TimeWindow => w !== null);
  if (windows.length === 0) return { ok: true, slots: [], demo: false };

  const busy: TimeWindow[] = (bookingsRes.data ?? []).map((row) => {
    const start = toMinutes(row.appointment_time);
    const service = Array.isArray(row.services) ? row.services[0] : row.services;
    return { start, end: start + (service?.duration_minutes ?? 60) };
  });

  const slots = generateSlots(windows, busy, duration);
  return { ok: true, slots: filterPastSlots(date, slots), demo: false };
}
