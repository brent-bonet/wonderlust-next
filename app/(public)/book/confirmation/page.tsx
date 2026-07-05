import type { Metadata } from "next";
import Btn from "@/components/Btn";
import { Eyebrow, SectTitle } from "@/components/Section";
import { toMinutes, toSlotLabel } from "@/lib/booking";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Booking confirmed — Wonderlust Salon",
  robots: { index: false },
};

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

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string; redirect_status?: string }>;
}) {
  const { bookingId, redirect_status } = await searchParams;
  const supabase = getSupabaseAdmin();

  let booking:
    | {
        client_name: string;
        client_email: string;
        appointment_date: string;
        appointment_time: string;
        status: string;
        services: { name: string } | { name: string }[] | null;
        stylists: { name: string } | { name: string }[] | null;
      }
    | null = null;

  if (supabase && bookingId) {
    const { data } = await supabase
      .from("bookings")
      .select(
        "client_name, client_email, appointment_date, appointment_time, status, services (name), stylists (name)",
      )
      .eq("id", bookingId)
      .maybeSingle();
    booking = data;
  }

  const paymentFailed = redirect_status === "failed";
  const service = Array.isArray(booking?.services)
    ? booking?.services[0]
    : booking?.services;
  const stylist = Array.isArray(booking?.stylists)
    ? booking?.stylists[0]
    : booking?.stylists;

  return (
    <main className="py-[84px]">
      <div className="mx-auto max-w-wrap px-6">
        <Eyebrow>{paymentFailed ? "Almost" : "Booked"}</Eyebrow>
        <SectTitle>
          {paymentFailed
            ? "That payment didn't go through."
            : "See you in RiNo."}
        </SectTitle>

        <div className="max-w-[34em]">
          {paymentFailed ? (
            <p className="text-[.98rem]">
              No charge was made and the time wasn&rsquo;t held. Head back to{" "}
              <a href="/book" className="border-b border-fog text-toner-deep">
                booking
              </a>{" "}
              to try again, or call{" "}
              <a href="tel:+13032978463" className="border-b border-fog">
                (303) 297-8463
              </a>
              .
            </p>
          ) : booking ? (
            <>
              <ul className="mb-8 max-w-[24rem] list-none">
                {(
                  [
                    ["Service", service?.name ?? "—"],
                    ["Stylist", stylist?.name ?? "—"],
                    ["Date", formatDate(booking.appointment_date)],
                    [
                      "Time",
                      toSlotLabel(
                        toMinutes(booking.appointment_time.slice(0, 5)),
                      ),
                    ],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <li
                    key={label}
                    className="flex justify-between gap-4 border-b border-fog py-2.5 text-[.98rem]"
                  >
                    <span className="font-mono text-[.8rem] uppercase tracking-[.18em] text-toner-deep">
                      {label}
                    </span>
                    <span className="text-right">{value}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[.95rem] text-[#5d6b63]">
                A confirmation email is on its way to {booking.client_email}.
                Need to change anything? Call or text{" "}
                <a href="tel:+13032978463" className="border-b border-fog">
                  (303) 297-8463
                </a>
                .
              </p>
            </>
          ) : (
            <p className="text-[.98rem]">
              Your booking went through. A confirmation email is on its way —
              and if anything looks off, call{" "}
              <a href="tel:+13032978463" className="border-b border-fog">
                (303) 297-8463
              </a>
              .
            </p>
          )}

          <div className="mt-10">
            <Btn href="/">Back to the salon</Btn>
          </div>
        </div>
      </div>
    </main>
  );
}
