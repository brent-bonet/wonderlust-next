import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MIN_LEAD_MINUTES,
  amountDueNow,
  dayOfWeek,
  filterPastSlots,
  generateSlots,
  intersectWindows,
  isValidDateString,
  salonNow,
  toMinutes,
  toSlot,
  toSlotLabel,
  toTimeValue,
} from "@/lib/booking";

describe("time conversions", () => {
  it("parses HH:MM into minutes from midnight", () => {
    expect(toMinutes("00:00")).toBe(0);
    expect(toMinutes("09:30")).toBe(570);
    expect(toMinutes("20:00")).toBe(1200);
  });

  it("tolerates a missing minutes part", () => {
    expect(toMinutes("9")).toBe(540);
  });

  it("formats minutes as zero-padded HH:MM", () => {
    expect(toTimeValue(0)).toBe("00:00");
    expect(toTimeValue(570)).toBe("09:30");
    expect(toTimeValue(1200)).toBe("20:00");
  });

  it("round-trips through toMinutes and toTimeValue", () => {
    for (const time of ["08:00", "12:45", "23:59"]) {
      expect(toTimeValue(toMinutes(time))).toBe(time);
    }
  });

  it("renders reference-style labels", () => {
    expect(toSlotLabel(570)).toBe("9:30a");
    expect(toSlotLabel(1200)).toBe("8:00p");
    expect(toSlotLabel(0)).toBe("12:00a");
    expect(toSlotLabel(720)).toBe("12:00p");
  });

  it("builds a slot with value and label", () => {
    expect(toSlot(570)).toEqual({ value: "09:30", label: "9:30a" });
  });
});

describe("intersectWindows", () => {
  it("returns the overlap of two windows", () => {
    expect(
      intersectWindows({ start: 540, end: 1020 }, { start: 600, end: 1080 }),
    ).toEqual({ start: 600, end: 1020 });
  });

  it("returns null for disjoint windows", () => {
    expect(
      intersectWindows({ start: 540, end: 600 }, { start: 600, end: 660 }),
    ).toBeNull();
  });
});

describe("generateSlots", () => {
  const nineToNoon = { start: 540, end: 720 };

  it("steps through a window leaving room for the full duration", () => {
    expect(generateSlots([nineToNoon], [], 60)).toEqual([540, 570, 600, 630, 660]);
  });

  it("excludes starts that would overlap a busy interval", () => {
    const busy = [{ start: 600, end: 660 }]; // 10:00–11:00 booked
    expect(generateSlots([nineToNoon], busy, 60)).toEqual([540, 660]);
  });

  it("treats back-to-back appointments as non-overlapping", () => {
    const busy = [{ start: 600, end: 660 }];
    // 30-minute service can end exactly when the busy block starts
    expect(generateSlots([nineToNoon], busy, 30)).toContain(570);
  });

  it("returns nothing when the duration exceeds every window", () => {
    expect(generateSlots([{ start: 540, end: 600 }], [], 90)).toEqual([]);
  });

  it("deduplicates and sorts starts from overlapping windows", () => {
    const slots = generateSlots(
      [
        { start: 600, end: 720 },
        { start: 540, end: 660 },
      ],
      [],
      30,
    );
    expect(slots).toEqual([540, 570, 600, 630, 660, 690]);
  });

  it("honors a custom step", () => {
    expect(generateSlots([nineToNoon], [], 60, 90)).toEqual([540, 630]);
  });
});

describe("date helpers", () => {
  it("computes the day of week from a date string", () => {
    expect(dayOfWeek("2026-07-05")).toBe(0); // Sunday
    expect(dayOfWeek("2026-07-09")).toBe(4); // Thursday
    expect(dayOfWeek("2026-07-11")).toBe(6); // Saturday
  });

  it("accepts well-formed date strings", () => {
    expect(isValidDateString("2026-07-09")).toBe(true);
  });

  it("rejects malformed or impossible dates", () => {
    expect(isValidDateString("2026-7-9")).toBe(false);
    expect(isValidDateString("07/09/2026")).toBe(false);
    expect(isValidDateString("2026-13-40")).toBe(false);
    expect(isValidDateString("")).toBe(false);
  });
});

describe("salon clock", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports date and minutes in salon time", () => {
    // 18:00 UTC on July 9 is 12:00 in Denver (MDT, UTC-6)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-09T18:00:00Z"));
    expect(salonNow()).toEqual({ date: "2026-07-09", minutes: 720 });
  });

  it("rolls the date across the UTC midnight boundary", () => {
    // 03:00 UTC July 10 is still 21:00 July 9 in Denver
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T03:00:00Z"));
    expect(salonNow()).toEqual({ date: "2026-07-09", minutes: 1260 });
  });

  it("keeps every slot on a future date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-09T18:00:00Z"));
    expect(filterPastSlots("2026-07-10", [540, 600])).toEqual([540, 600]);
  });

  it("drops every slot on a past date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-09T18:00:00Z"));
    expect(filterPastSlots("2026-07-08", [540, 600])).toEqual([]);
  });

  it("enforces lead time for today", () => {
    // Noon in Denver: only slots at or after 12:00 + lead time survive
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-09T18:00:00Z"));
    const cutoff = 720 + MIN_LEAD_MINUTES;
    expect(filterPastSlots("2026-07-09", [660, cutoff - 30, cutoff, cutoff + 30])).toEqual([
      cutoff,
      cutoff + 30,
    ]);
  });
});

describe("amountDueNow", () => {
  it("charges nothing when the service has no price", () => {
    expect(
      amountDueNow({ price: null, depositAmount: 50, fullPrepayment: true }),
    ).toEqual({ amount: 0, type: "none" });
    expect(
      amountDueNow({ price: 0, depositAmount: 50, fullPrepayment: true }),
    ).toEqual({ amount: 0, type: "none" });
  });

  it("charges the full price when prepayment is required", () => {
    expect(
      amountDueNow({ price: 120, depositAmount: 50, fullPrepayment: true }),
    ).toEqual({ amount: 120, type: "full" });
  });

  it("charges the deposit when one is configured", () => {
    expect(
      amountDueNow({ price: 120, depositAmount: 50, fullPrepayment: false }),
    ).toEqual({ amount: 50, type: "deposit" });
  });

  it("defaults to pay-at-salon otherwise", () => {
    expect(
      amountDueNow({ price: 120, depositAmount: null, fullPrepayment: false }),
    ).toEqual({ amount: 0, type: "none" });
    expect(
      amountDueNow({ price: 120, depositAmount: 0, fullPrepayment: false }),
    ).toEqual({ amount: 0, type: "none" });
  });
});
