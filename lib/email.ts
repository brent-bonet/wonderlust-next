import "server-only";
import { toMinutes, toSlotLabel } from "./booking";
import { BOOKING_FROM_EMAIL, getResend } from "./resend";

function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export type BookingEmailDetails = {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  stylistName: string;
  appointmentDate: string;
  appointmentTime: string;
  amountPaid: number;
  paymentType: "deposit" | "full" | "none";
};

/** Confirmation email on successful booking. No-op in demo mode (no Resend key). */
export async function sendBookingConfirmationEmail(details: BookingEmailDetails) {
  const resend = getResend();
  if (!resend) return;

  const when = `${formatDate(details.appointmentDate)} at ${toSlotLabel(
    toMinutes(details.appointmentTime.slice(0, 5)),
  )}`;
  const paymentLine =
    details.paymentType === "deposit"
      ? `<p>A $${details.amountPaid} deposit was charged to hold your spot — the remainder is due at your appointment.</p>`
      : details.paymentType === "full"
        ? `<p>$${details.amountPaid} was charged in full.</p>`
        : `<p>Nothing was charged — payment is handled at the salon.</p>`;

  await resend.emails.send({
    from: BOOKING_FROM_EMAIL,
    to: details.clientEmail,
    subject: `You're booked — ${when}`,
    html: `
      <p>Hi ${details.clientName},</p>
      <p>You're all set at Wonderlust Salon:</p>
      <ul>
        <li><strong>Service:</strong> ${details.serviceName}</li>
        <li><strong>Stylist:</strong> ${details.stylistName}</li>
        <li><strong>When:</strong> ${when}</li>
      </ul>
      ${paymentLine}
      <p>Need to change anything? Call or text (303) 297-8463.</p>
      <p>See you in RiNo.</p>
    `,
  });
}

/** Reminder email sent ~24h before the appointment via a scheduled route. */
export async function sendBookingReminderEmail(details: BookingEmailDetails) {
  const resend = getResend();
  if (!resend) return;

  const when = `${formatDate(details.appointmentDate)} at ${toSlotLabel(
    toMinutes(details.appointmentTime.slice(0, 5)),
  )}`;

  await resend.emails.send({
    from: BOOKING_FROM_EMAIL,
    to: details.clientEmail,
    subject: "See you tomorrow — Wonderlust Salon",
    html: `
      <p>Hi ${details.clientName},</p>
      <p>Just a reminder of your appointment tomorrow:</p>
      <ul>
        <li><strong>Service:</strong> ${details.serviceName}</li>
        <li><strong>Stylist:</strong> ${details.stylistName}</li>
        <li><strong>When:</strong> ${when}</li>
      </ul>
      <p>Need to reschedule? Call or text (303) 297-8463.</p>
    `,
  });
}
