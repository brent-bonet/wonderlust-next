"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import Btn from "@/components/Btn";
import { useBusyCursor } from "@/components/useBusyCursor";
import { toSlotLabel, toMinutes } from "@/lib/booking";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type Summary = {
  serviceName: string;
  servicePrice: string;
  stylistName: string;
  date: string;
  time: string;
};

type Payment = {
  bookingId: string;
  clientSecret: string;
  amount: number;
  paymentType: "deposit" | "full";
};

function SummaryCard({ summary, payment }: { summary: Summary; payment: Payment }) {
  const rows: [string, string][] = [
    ["Service", `${summary.serviceName} (${summary.servicePrice})`],
    ["Stylist", summary.stylistName],
    ["When", `${summary.date} · ${toSlotLabel(toMinutes(summary.time))}`],
    [
      payment.paymentType === "deposit" ? "Deposit due now" : "Due now",
      `$${payment.amount}`,
    ],
  ];
  return (
    <div className="mb-8 rounded-[14px] border border-fog bg-white p-5">
      <ul className="list-none">
        {rows.map(([label, value]) => (
          <li
            key={label}
            className="flex justify-between gap-4 border-b border-fog py-2.5 text-[.95rem] last:border-b-0"
          >
            <span className="font-mono text-[.8rem] uppercase tracking-[.18em] text-toner-deep">
              {label}
            </span>
            <span className="text-right">{value}</span>
          </li>
        ))}
      </ul>
      {payment.paymentType === "deposit" && (
        <p className="mt-3 text-[.85rem] text-[#5d6b63]">
          Your card is saved securely with Stripe — the remainder is collected
          at your appointment.
        </p>
      )}
    </div>
  );
}

function CheckoutForm({ bookingId }: { bookingId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useBusyCursor(submitting);

  async function pay() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/book/confirmation?bookingId=${bookingId}`,
      },
    });
    // Only reached on immediate failure — success redirects to return_url.
    if (stripeError) setError(stripeError.message ?? "Payment failed.");
    setSubmitting(false);
  }

  return (
    <div>
      <PaymentElement />
      {error && (
        <p role="alert" className="mt-4 font-mono text-[.85rem] text-tan">
          {error}
        </p>
      )}
      <div className="mt-8">
        <Btn onClick={pay} disabled={!stripe || submitting}>
          {submitting ? "Processing…" : "Pay & book"}
        </Btn>
      </div>
    </div>
  );
}

export default function PaymentStep({
  payment,
  summary,
}: {
  payment: Payment;
  summary: Summary;
}) {
  if (!stripePromise) {
    return (
      <div>
        <SummaryCard summary={summary} payment={payment} />
        <p className="font-mono text-[.85rem] text-tan">
          Payments aren&rsquo;t live yet — Stripe publishable key missing. Call{" "}
          <a href="tel:+13032978463" className="border-b border-fog">
            (303) 297-8463
          </a>{" "}
          to book.
        </p>
      </div>
    );
  }

  return (
    <div>
      <SummaryCard summary={summary} payment={payment} />
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: payment.clientSecret,
          appearance: {
            variables: {
              colorPrimary: "#0c8289",
              colorBackground: "#ffffff",
              colorText: "#243029",
              colorDanger: "#a9783f",
              borderRadius: "10px",
              fontFamily: "Karla, sans-serif",
            },
          },
          fonts: [
            {
              cssSrc:
                "https://fonts.googleapis.com/css2?family=Karla:wght@400;500;700&display=swap",
            },
          ],
        }}
      >
        <CheckoutForm bookingId={payment.bookingId} />
      </Elements>
    </div>
  );
}
