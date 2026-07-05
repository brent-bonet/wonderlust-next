import "server-only";
import { Resend } from "resend";

/** Returns null when Resend isn't configured yet. */
export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

/**
 * No domain is verified in Resend yet, so sends must come from Resend's
 * shared sandbox address — real delivery is limited to the Resend account's
 * own email until wonderlustsalon.com (or another domain) is verified.
 * Swap this back to a real address once that's done.
 */
export const BOOKING_FROM_EMAIL = "Wonderlust Salon <onboarding@resend.dev>";
