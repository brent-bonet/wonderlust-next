import type { Slot } from "./types";

/** Times are minutes from midnight, salon-local (America/Denver). */
export type TimeWindow = { start: number; end: number };

export const SLOT_STEP_MINUTES = 30;
/** Same-day bookings need at least this much lead time. */
export const MIN_LEAD_MINUTES = 60;
export const SALON_TIME_ZONE = "America/Denver";

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function toTimeValue(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Reference-style label: 570 -> "9:30a", 1200 -> "8:00p" */
export function toSlotLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h >= 12 ? "p" : "a";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")}${suffix}`;
}

export function toSlot(minutes: number): Slot {
  return { value: toTimeValue(minutes), label: toSlotLabel(minutes) };
}

export function intersectWindows(
  a: TimeWindow,
  b: TimeWindow,
): TimeWindow | null {
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.end, b.end);
  return start < end ? { start, end } : null;
}

/**
 * All start times (minutes) where the full duration fits inside a window
 * without overlapping any busy interval.
 */
export function generateSlots(
  windows: TimeWindow[],
  busy: TimeWindow[],
  durationMinutes: number,
  step = SLOT_STEP_MINUTES,
): number[] {
  const starts = new Set<number>();
  for (const window of windows) {
    for (let t = window.start; t + durationMinutes <= window.end; t += step) {
      const overlaps = busy.some(
        (b) => t < b.end && t + durationMinutes > b.start,
      );
      if (!overlaps) starts.add(t);
    }
  }
  return [...starts].sort((a, b) => a - b);
}

/** 0 (Sunday) – 6 (Saturday) for a "YYYY-MM-DD" date string. */
export function dayOfWeek(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function isValidDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date));
}

/** Current date ("YYYY-MM-DD") and minutes-from-midnight in salon time. */
export function salonNow(): { date: string; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: SALON_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** Drop slots in the past (plus lead time) when the date is today. */
export function filterPastSlots(date: string, slotMinutes: number[]): number[] {
  const now = salonNow();
  if (date > now.date) return slotMinutes;
  if (date < now.date) return [];
  return slotMinutes.filter((t) => t >= now.minutes + MIN_LEAD_MINUTES);
}

/** What the client owes at booking time, in dollars. */
export function amountDueNow(service: {
  price: number | null;
  depositAmount: number | null;
  fullPrepayment: boolean;
}): { amount: number; type: "full" | "deposit" | "none" } {
  if (service.price === null || service.price === 0) {
    return { amount: 0, type: "none" };
  }
  if (!service.fullPrepayment && service.depositAmount && service.depositAmount > 0) {
    return { amount: service.depositAmount, type: "deposit" };
  }
  return { amount: service.price, type: "full" };
}
