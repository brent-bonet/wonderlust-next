import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAvailableSlots } from "@/lib/booking-server";

type TableResult = { data: unknown; error: { message: string } | null };

/**
 * Fake Supabase client: every query-builder method chains, `maybeSingle`
 * and awaiting the builder both resolve to the configured per-table result.
 */
function fakeSupabase(
  results: Partial<Record<string, TableResult>>,
): SupabaseClient {
  return {
    from(table: string) {
      const result = results[table] ?? { data: null, error: null };
      const builder = {
        select: () => builder,
        eq: () => builder,
        in: () => builder,
        maybeSingle: () => Promise.resolve(result),
        then: (
          resolve: (value: TableResult) => unknown,
          reject: (reason: unknown) => unknown,
        ) => Promise.resolve(result).then(resolve, reject),
      };
      return builder;
    },
  } as unknown as SupabaseClient;
}

const ok = (data: unknown): TableResult => ({ data, error: null });

/** Baseline: Tuesday 9a–8p hours, one 10a–2p availability row, no conflicts. */
function baselineTables(): Record<string, TableResult> {
  return {
    services: ok({ id: "svc-womens-haircut", duration_minutes: 60 }),
    business_hours: ok({ opens: "09:00:00", closes: "20:00:00", closed: false }),
    availability: ok([{ start_time: "10:00:00", end_time: "14:00:00" }]),
    blocked_dates: ok([]),
    bookings: ok([]),
  };
}

// A Tuesday well in the future so filterPastSlots keeps everything.
const TUESDAY = "2026-07-14";
const params = {
  stylistId: "sty-lindsey",
  serviceId: "svc-womens-haircut",
  date: TUESDAY,
};

beforeEach(() => {
  // Freeze the clock at noon Denver time (18:00 UTC) on Thursday July 9.
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-09T18:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getAvailableSlots in demo mode (no Supabase)", () => {
  it("404s for an unknown service or stylist", async () => {
    expect(
      await getAvailableSlots(null, { ...params, serviceId: "svc-nope" }),
    ).toEqual({ ok: false, status: 404, error: "Unknown service or stylist." });
    expect(
      await getAvailableSlots(null, { ...params, stylistId: "sty-nope" }),
    ).toEqual({ ok: false, status: 404, error: "Unknown service or stylist." });
  });

  it("returns no slots on closed days", async () => {
    const sunday = "2026-07-12";
    expect(await getAvailableSlots(null, { ...params, date: sunday })).toEqual({
      ok: true,
      slots: [],
      demo: true,
    });
  });

  it("fills the fallback window on open days", async () => {
    const result = await getAvailableSlots(null, params);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.demo).toBe(true);
    // 9:00a through 7:00p — last start where 60 minutes fits before 8:00p
    expect(result.slots[0]).toBe(9 * 60);
    expect(result.slots.at(-1)).toBe(19 * 60);
  });
});

describe("getAvailableSlots against the database", () => {
  it("propagates query errors as a 500", async () => {
    const tables = baselineTables();
    tables.bookings = { data: null, error: { message: "connection reset" } };
    expect(await getAvailableSlots(fakeSupabase(tables), params)).toEqual({
      ok: false,
      status: 500,
      error: "connection reset",
    });
  });

  it("404s when the service is missing or inactive", async () => {
    const tables = baselineTables();
    tables.services = ok(null);
    expect(await getAvailableSlots(fakeSupabase(tables), params)).toEqual({
      ok: false,
      status: 404,
      error: "Unknown service.",
    });
  });

  it("returns no slots when the salon is closed that day", async () => {
    const closed = baselineTables();
    closed.business_hours = ok({
      opens: "09:00:00",
      closes: "20:00:00",
      closed: true,
    });
    expect(await getAvailableSlots(fakeSupabase(closed), params)).toEqual({
      ok: true,
      slots: [],
      demo: false,
    });

    const noRow = baselineTables();
    noRow.business_hours = ok(null);
    expect(await getAvailableSlots(fakeSupabase(noRow), params)).toEqual({
      ok: true,
      slots: [],
      demo: false,
    });
  });

  it("returns no slots on a blocked date", async () => {
    const tables = baselineTables();
    tables.blocked_dates = ok([{ id: "blk-1" }]);
    expect(await getAvailableSlots(fakeSupabase(tables), params)).toEqual({
      ok: true,
      slots: [],
      demo: false,
    });
  });

  it("returns no slots when the stylist has no availability", async () => {
    const tables = baselineTables();
    tables.availability = ok([]);
    expect(await getAvailableSlots(fakeSupabase(tables), params)).toEqual({
      ok: true,
      slots: [],
      demo: false,
    });
  });

  it("offers every fitting start in the availability window", async () => {
    const result = await getAvailableSlots(fakeSupabase(baselineTables()), params);
    // 10:00–14:00 window, 60-minute service, 30-minute steps
    expect(result).toEqual({
      ok: true,
      slots: [600, 630, 660, 690, 720, 750, 780],
      demo: false,
    });
  });

  it("excludes slots that would overlap an existing booking", async () => {
    const tables = baselineTables();
    tables.bookings = ok([
      {
        appointment_time: "11:00:00",
        services: { duration_minutes: 60 },
      },
    ]);
    const result = await getAvailableSlots(fakeSupabase(tables), params);
    // 11:00–12:00 is taken; 10:00 and 12:00 butt up against it but fit
    expect(result).toEqual({
      ok: true,
      slots: [600, 720, 750, 780],
      demo: false,
    });
  });

  it("clips availability to business hours", async () => {
    const tables = baselineTables();
    tables.business_hours = ok({
      opens: "11:00:00",
      closes: "13:00:00",
      closed: false,
    });
    const result = await getAvailableSlots(fakeSupabase(tables), params);
    expect(result).toEqual({
      ok: true,
      slots: [660, 690, 720],
      demo: false,
    });
  });

  it("assumes 60 minutes when a booked service's duration is unknown", async () => {
    const tables = baselineTables();
    tables.bookings = ok([{ appointment_time: "11:00:00", services: null }]);
    const result = await getAvailableSlots(fakeSupabase(tables), params);
    expect(result).toEqual({
      ok: true,
      slots: [600, 720, 750, 780],
      demo: false,
    });
  });

  it("handles the joined service arriving as an array", async () => {
    const tables = baselineTables();
    tables.bookings = ok([
      {
        appointment_time: "10:00:00",
        services: [{ duration_minutes: 240 }],
      },
    ]);
    const result = await getAvailableSlots(fakeSupabase(tables), params);
    // 10:00–14:00 fully booked
    expect(result).toEqual({ ok: true, slots: [], demo: false });
  });

  it("drops past slots when the date is today", async () => {
    // Frozen clock: Thursday 2026-07-09, noon in Denver. Lead time is 60m,
    // so nothing before 13:00 survives.
    const result = await getAvailableSlots(fakeSupabase(baselineTables()), {
      ...params,
      date: "2026-07-09",
    });
    expect(result).toEqual({ ok: true, slots: [780], demo: false });
  });

  it("returns nothing for a date in the past", async () => {
    const result = await getAvailableSlots(fakeSupabase(baselineTables()), {
      ...params,
      date: "2026-07-07",
    });
    expect(result).toEqual({ ok: true, slots: [], demo: false });
  });
});
