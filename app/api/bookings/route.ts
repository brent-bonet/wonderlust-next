import { NextResponse, type NextRequest } from "next/server";
import {
  amountDueNow,
  isValidDateString,
  toMinutes,
} from "@/lib/booking";
import { getAvailableSlots } from "@/lib/booking-server";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { getStripe, toCents } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type BookingRequest = {
  serviceId?: string;
  stylistId?: string;
  date?: string;
  time?: string;
  name?: string;
  email?: string;
  phone?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: BookingRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { serviceId, stylistId, date, time } = body;
  const name = body.name?.trim();
  const email = body.email?.trim();
  const phone = body.phone?.trim();

  if (!serviceId || !stylistId || !date || !time || !name || !email || !phone) {
    return NextResponse.json(
      { error: "All booking fields are required." },
      { status: 400 },
    );
  }
  if (!isValidDateString(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json(
      { error: "Invalid date or time format." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Booking isn't live yet — the database isn't configured. Call (303) 297-8463 to book.",
      },
      { status: 503 },
    );
  }

  // Re-verify the slot server-side so a stale client can't double-book.
  const slotResult = await getAvailableSlots(supabase, {
    stylistId,
    serviceId,
    date,
  });
  if (!slotResult.ok) {
    return NextResponse.json(
      { error: slotResult.error },
      { status: slotResult.status },
    );
  }
  if (!slotResult.slots.includes(toMinutes(time))) {
    return NextResponse.json(
      { error: "That time was just taken — please pick another slot." },
      { status: 409 },
    );
  }

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, name, price, deposit_amount, full_prepayment")
    .eq("id", serviceId)
    .eq("active", true)
    .single();
  if (serviceError || !service) {
    return NextResponse.json({ error: "Unknown service." }, { status: 404 });
  }

  const due = amountDueNow({
    price: service.price === null ? null : Number(service.price),
    depositAmount:
      service.deposit_amount === null ? null : Number(service.deposit_amount),
    fullPrepayment: service.full_prepayment,
  });

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      service_id: serviceId,
      stylist_id: stylistId,
      client_name: name,
      client_email: email,
      client_phone: phone,
      appointment_date: date,
      appointment_time: time,
      status: due.amount === 0 ? "confirmed" : "pending",
      payment_status: "unpaid",
    })
    .select("id")
    .single();
  if (bookingError || !booking) {
    // Unique violation on the slot index: we lost a race for this slot.
    if (bookingError?.code === "23505") {
      return NextResponse.json(
        { error: "That time was just taken — please pick another slot." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: bookingError?.message ?? "Could not create booking." },
      { status: 500 },
    );
  }

  // Free / consult bookings skip payment entirely — no webhook will fire,
  // so the confirmation email has to go out here.
  if (due.amount === 0) {
    const { data: stylist } = await supabase
      .from("stylists")
      .select("name")
      .eq("id", stylistId)
      .maybeSingle();
    try {
      await sendBookingConfirmationEmail({
        clientName: name,
        clientEmail: email,
        serviceName: service.name,
        stylistName: stylist?.name ?? "your stylist",
        appointmentDate: date,
        appointmentTime: time,
        amountPaid: 0,
        paymentType: "none",
      });
    } catch {
      // The booking stands even if the email fails.
    }
    return NextResponse.json({ bookingId: booking.id, free: true });
  }

  const stripe = getStripe();
  if (!stripe) {
    await supabase.from("bookings").delete().eq("id", booking.id);
    return NextResponse.json(
      {
        error:
          "Payments aren't live yet — Stripe isn't configured. Call (303) 297-8463 to book.",
      },
      { status: 503 },
    );
  }

  try {
    const intent = await stripe.paymentIntents.create({
      amount: toCents(due.amount),
      currency: "usd",
      receipt_email: email,
      // Deposit bookings save the card for remainder collection in-salon.
      ...(due.type === "deposit" ? { setup_future_usage: "off_session" } : {}),
      automatic_payment_methods: { enabled: true },
      metadata: {
        booking_id: booking.id,
        payment_type: due.type,
        service_name: service.name,
      },
    });

    await supabase
      .from("bookings")
      .update({ stripe_payment_intent_id: intent.id })
      .eq("id", booking.id);
    await supabase.from("payments").insert({
      booking_id: booking.id,
      stripe_payment_intent_id: intent.id,
      amount: due.amount,
      type: due.type,
      status: "pending",
    });

    return NextResponse.json({
      bookingId: booking.id,
      clientSecret: intent.client_secret,
      amount: due.amount,
      paymentType: due.type,
    });
  } catch (err) {
    await supabase.from("bookings").delete().eq("id", booking.id);
    const message =
      err instanceof Error ? err.message : "Payment setup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
