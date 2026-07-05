import type Stripe from "stripe";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Confirms bookings paid via the Stripe PaymentIntent + Elements flow in
 * components/booking/PaymentStep.tsx (see /api/bookings for intent creation).
 * Verifies the signature, updates booking + payment rows, and sends the
 * confirmation email — the confirmation page itself never mutates data.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabase = getSupabaseAdmin();
  if (!stripe || !webhookSecret || !supabase) {
    return Response.json(
      { error: "Stripe webhook isn't configured yet." },
      { status: 501 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature.";
    return Response.json({ error: message }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const bookingId = intent.metadata.booking_id;
    const paymentType = intent.metadata.payment_type as "deposit" | "full" | undefined;
    if (!bookingId || !paymentType) return Response.json({ received: true });

    const amount = intent.amount_received / 100;

    await supabase
      .from("payments")
      .update({ status: "succeeded" })
      .eq("stripe_payment_intent_id", intent.id);

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: paymentType === "deposit" ? "deposit_paid" : "paid",
        deposit_paid: paymentType === "deposit" ? amount : 0,
        total_paid: paymentType === "full" ? amount : 0,
      })
      .eq("id", bookingId)
      .select(
        "client_name, client_email, appointment_date, appointment_time, services (name), stylists (name)",
      )
      .single();

    if (!bookingError && booking) {
      const service = Array.isArray(booking.services)
        ? booking.services[0]
        : booking.services;
      const stylist = Array.isArray(booking.stylists)
        ? booking.stylists[0]
        : booking.stylists;
      await sendBookingConfirmationEmail({
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        serviceName: service?.name ?? "your service",
        stylistName: stylist?.name ?? "your stylist",
        appointmentDate: booking.appointment_date,
        appointmentTime: booking.appointment_time,
        amountPaid: amount,
        paymentType,
      });
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    await supabase
      .from("payments")
      .update({ status: "failed" })
      .eq("stripe_payment_intent_id", intent.id);
    // Booking stays "pending" — the client sees a failed-payment redirect
    // and can retry from /book; nothing was ever held.
  }

  return Response.json({ received: true });
}
