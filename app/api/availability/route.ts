import { NextResponse, type NextRequest } from "next/server";
import { isValidDateString, salonNow, toSlot } from "@/lib/booking";
import { getAvailableSlots } from "@/lib/booking-server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const stylistId = params.get("stylistId");
  const serviceId = params.get("serviceId");
  const date = params.get("date");

  if (!stylistId || !serviceId || !date || !isValidDateString(date)) {
    return NextResponse.json(
      { error: "stylistId, serviceId, and date (YYYY-MM-DD) are required." },
      { status: 400 },
    );
  }
  if (date < salonNow().date) {
    return NextResponse.json({ slots: [] });
  }

  const result = await getAvailableSlots(getSupabaseAdmin(), {
    stylistId,
    serviceId,
    date,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    slots: result.slots.map(toSlot),
    ...(result.demo ? { demo: true } : {}),
  });
}
