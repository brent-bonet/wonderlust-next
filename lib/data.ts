import {
  FALLBACK_HOURS,
  FALLBACK_SERVICES,
  FALLBACK_STYLISTS,
  groupServices,
} from "./fallback-data";
import { getSupabase } from "./supabase/server";
import type {
  BookableService,
  HoursRow,
  ServiceGroup,
  StylistCard,
} from "./types";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** "09:00" / "09:00:00" -> "9:00a", "20:00" -> "8:00p" */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "p" : "a";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")}${suffix}`;
}

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | null;
  price_display: string | null;
  deposit_amount: number | null;
  duration_minutes: number | null;
  full_prepayment: boolean;
};

function formatPrice(row: { price: number | null; price_display: string | null }): string {
  if (row.price_display) return row.price_display;
  if (row.price === null) return "consult";
  if (Number(row.price) === 0) return "free";
  return `$${Number(row.price)}+`;
}

function mapService(row: ServiceRow): BookableService {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? "Services",
    description: row.description,
    price: row.price === null ? null : Number(row.price),
    priceDisplay: formatPrice(row),
    depositAmount: row.deposit_amount === null ? null : Number(row.deposit_amount),
    durationMinutes: row.duration_minutes ?? 60,
    fullPrepayment: row.full_prepayment,
  };
}

export async function getBookableServices(): Promise<BookableService[]> {
  const supabase = getSupabase();
  if (!supabase) return FALLBACK_SERVICES;
  try {
    const { data, error } = await supabase
      .from("services")
      .select(
        "id, name, description, category, price, price_display, deposit_amount, duration_minutes, full_prepayment, sort_order",
      )
      .eq("active", true)
      .order("sort_order");
    if (error || !data?.length) return FALLBACK_SERVICES;
    return data.map(mapService);
  } catch {
    return FALLBACK_SERVICES;
  }
}

export async function getServiceGroups(): Promise<ServiceGroup[]> {
  return groupServices(await getBookableServices());
}

export async function getStylists(): Promise<StylistCard[]> {
  const supabase = getSupabase();
  if (!supabase) return FALLBACK_STYLISTS;
  try {
    const { data, error } = await supabase
      .from("stylists")
      .select("id, name, role, bio, photo_url")
      .eq("active", true)
      .order("created_at");
    if (error || !data?.length) return FALLBACK_STYLISTS;
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role ?? "",
      bio: row.bio ?? "",
      photoUrl: row.photo_url,
    }));
  } catch {
    return FALLBACK_STYLISTS;
  }
}

export async function getBusinessHours(): Promise<HoursRow[]> {
  const supabase = getSupabase();
  if (!supabase) return FALLBACK_HOURS;
  try {
    const { data, error } = await supabase
      .from("business_hours")
      .select("day_of_week, opens, closes, closed")
      .order("day_of_week");
    if (error || !data?.length) return FALLBACK_HOURS;
    return data.map((row) => ({
      day: DAY_NAMES[row.day_of_week],
      display: row.closed
        ? "closed"
        : `${formatTime(row.opens)} – ${formatTime(row.closes)}`,
      closed: row.closed,
    }));
  } catch {
    return FALLBACK_HOURS;
  }
}
