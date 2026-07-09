import type { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/webhooks/stripe/route";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendBookingConfirmationEmail: vi.fn() }));

const SECRET_KEY = "sk_test_wonderlust";
const WEBHOOK_SECRET = "whsec_test_wonderlust";

/** Records every update chain so tests can assert on table, values, filters. */
type UpdateCall = { table: string; values: unknown; eq: [string, unknown][] };
type TableResult = { data: unknown; error: unknown };

function fakeAdmin(
  results: Partial<Record<string, TableResult>> = {},
) {
  const updates: UpdateCall[] = [];
  const client = {
    from(table: string) {
      const result = results[table] ?? { data: null, error: null };
      const call: UpdateCall = { table, values: null, eq: [] };
      const builder = {
        update(values: unknown) {
          call.values = values;
          updates.push(call);
          return builder;
        },
        eq(column: string, value: unknown) {
          call.eq.push([column, value]);
          return builder;
        },
        select: () => builder,
        single: () => Promise.resolve(result),
        then: (
          resolve: (value: unknown) => unknown,
          reject: (reason: unknown) => unknown,
        ) => Promise.resolve(result).then(resolve, reject),
      };
      return builder;
    },
  } as unknown as SupabaseClient;
  return { client, updates };
}

const confirmedBooking = {
  data: {
    client_name: "Dana",
    client_email: "dana@example.com",
    appointment_date: "2026-07-14",
    appointment_time: "10:00:00",
    services: { name: "Balayage" },
    stylists: { name: "Lindsey Kubla" },
  },
  error: null,
};

/** Signs `payload` exactly as Stripe would for our webhook secret. */
function signedRequest(payload: string): Request {
  const stripe = new Stripe(SECRET_KEY);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: WEBHOOK_SECRET,
  });
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body: payload,
    headers: { "stripe-signature": signature },
  });
}

function intentEvent(
  type: "payment_intent.succeeded" | "payment_intent.payment_failed",
  intent: Record<string, unknown>,
): string {
  return JSON.stringify({
    id: "evt_test_1",
    object: "event",
    type,
    data: { object: { object: "payment_intent", ...intent } },
  });
}

const paidIntent = {
  id: "pi_test_1",
  amount_received: 5000,
  metadata: { booking_id: "bk_1", payment_type: "deposit" },
};

beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", SECRET_KEY);
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET);
  vi.mocked(getSupabaseAdmin).mockReturnValue(fakeAdmin().client);
  vi.mocked(sendBookingConfirmationEmail).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("configuration and signature checks", () => {
  it("501s when the webhook secret is missing", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const response = await POST(signedRequest(intentEvent("payment_intent.succeeded", paidIntent)));
    expect(response.status).toBe(501);
  });

  it("400s when the signature header is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: intentEvent("payment_intent.succeeded", paidIntent),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("400s when the payload was tampered with after signing", async () => {
    const signed = signedRequest(intentEvent("payment_intent.succeeded", paidIntent));
    const tampered = new Request(signed.url, {
      method: "POST",
      body: intentEvent("payment_intent.succeeded", {
        ...paidIntent,
        amount_received: 1,
      }),
      headers: { "stripe-signature": signed.headers.get("stripe-signature")! },
    });
    const response = await POST(tampered);
    expect(response.status).toBe(400);
  });
});

describe("payment_intent.succeeded", () => {
  it("marks the payment and booking paid for a deposit", async () => {
    const { client, updates } = fakeAdmin({ bookings: confirmedBooking });
    vi.mocked(getSupabaseAdmin).mockReturnValue(client);

    const response = await POST(
      signedRequest(intentEvent("payment_intent.succeeded", paidIntent)),
    );

    expect(response.status).toBe(200);
    expect(updates).toEqual([
      {
        table: "payments",
        values: { status: "succeeded" },
        eq: [["stripe_payment_intent_id", "pi_test_1"]],
      },
      {
        table: "bookings",
        values: {
          status: "confirmed",
          payment_status: "deposit_paid",
          deposit_paid: 50,
          total_paid: 0,
        },
        eq: [["id", "bk_1"]],
      },
    ]);
    expect(sendBookingConfirmationEmail).toHaveBeenCalledWith({
      clientName: "Dana",
      clientEmail: "dana@example.com",
      serviceName: "Balayage",
      stylistName: "Lindsey Kubla",
      appointmentDate: "2026-07-14",
      appointmentTime: "10:00:00",
      amountPaid: 50,
      paymentType: "deposit",
    });
  });

  it("records the full amount for a full prepayment", async () => {
    const { client, updates } = fakeAdmin({ bookings: confirmedBooking });
    vi.mocked(getSupabaseAdmin).mockReturnValue(client);

    await POST(
      signedRequest(
        intentEvent("payment_intent.succeeded", {
          ...paidIntent,
          amount_received: 12000,
          metadata: { booking_id: "bk_1", payment_type: "full" },
        }),
      ),
    );

    const bookingUpdate = updates.find((u) => u.table === "bookings");
    expect(bookingUpdate?.values).toEqual({
      status: "confirmed",
      payment_status: "paid",
      deposit_paid: 0,
      total_paid: 120,
    });
    expect(sendBookingConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ amountPaid: 120, paymentType: "full" }),
    );
  });

  it("acknowledges but ignores intents without booking metadata", async () => {
    const { client, updates } = fakeAdmin();
    vi.mocked(getSupabaseAdmin).mockReturnValue(client);

    const response = await POST(
      signedRequest(
        intentEvent("payment_intent.succeeded", {
          id: "pi_other",
          amount_received: 5000,
          metadata: {},
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(updates).toEqual([]);
    expect(sendBookingConfirmationEmail).not.toHaveBeenCalled();
  });

  it("500s so Stripe retries when the booking update fails", async () => {
    const { client } = fakeAdmin({
      bookings: { data: null, error: { message: "connection reset" } },
    });
    vi.mocked(getSupabaseAdmin).mockReturnValue(client);

    const response = await POST(
      signedRequest(intentEvent("payment_intent.succeeded", paidIntent)),
    );

    expect(response.status).toBe(500);
    expect(sendBookingConfirmationEmail).not.toHaveBeenCalled();
  });

  it("500s so Stripe retries when the payment update fails", async () => {
    const { client } = fakeAdmin({
      payments: { data: null, error: { message: "connection reset" } },
    });
    vi.mocked(getSupabaseAdmin).mockReturnValue(client);

    const response = await POST(
      signedRequest(intentEvent("payment_intent.succeeded", paidIntent)),
    );

    expect(response.status).toBe(500);
    expect(sendBookingConfirmationEmail).not.toHaveBeenCalled();
  });

  it("acks a booking that no longer exists — retries can't fix it", async () => {
    const { client } = fakeAdmin({
      bookings: {
        data: null,
        error: { message: "no rows returned", code: "PGRST116" },
      },
    });
    vi.mocked(getSupabaseAdmin).mockReturnValue(client);

    const response = await POST(
      signedRequest(intentEvent("payment_intent.succeeded", paidIntent)),
    );

    expect(response.status).toBe(200);
    expect(sendBookingConfirmationEmail).not.toHaveBeenCalled();
  });

  it("acks when only the confirmation email fails", async () => {
    const { client } = fakeAdmin({ bookings: confirmedBooking });
    vi.mocked(getSupabaseAdmin).mockReturnValue(client);
    vi.mocked(sendBookingConfirmationEmail).mockRejectedValue(
      new Error("resend outage"),
    );

    const response = await POST(
      signedRequest(intentEvent("payment_intent.succeeded", paidIntent)),
    );

    expect(response.status).toBe(200);
  });
});

describe("other events", () => {
  it("marks the payment failed without emailing", async () => {
    const { client, updates } = fakeAdmin();
    vi.mocked(getSupabaseAdmin).mockReturnValue(client);

    const response = await POST(
      signedRequest(
        intentEvent("payment_intent.payment_failed", {
          id: "pi_test_1",
          metadata: { booking_id: "bk_1", payment_type: "deposit" },
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(updates).toEqual([
      {
        table: "payments",
        values: { status: "failed" },
        eq: [["stripe_payment_intent_id", "pi_test_1"]],
      },
    ]);
    expect(sendBookingConfirmationEmail).not.toHaveBeenCalled();
  });

  it("acknowledges unhandled event types without touching data", async () => {
    const { client, updates } = fakeAdmin();
    vi.mocked(getSupabaseAdmin).mockReturnValue(client);

    const response = await POST(
      signedRequest(
        JSON.stringify({
          id: "evt_test_2",
          object: "event",
          type: "charge.refunded",
          data: { object: { object: "charge", id: "ch_1" } },
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(updates).toEqual([]);
    expect(sendBookingConfirmationEmail).not.toHaveBeenCalled();
  });
});
