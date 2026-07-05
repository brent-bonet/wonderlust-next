import "server-only";
import Stripe from "stripe";

/** Returns null when Stripe isn't configured yet. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}
