"use server";

import { revalidatePath } from "next/cache";
import { backTo, numOrNull, requireAdmin, strOrNull } from "@/lib/admin";

const PATH = "/admin/availability";

/** Keep the selected stylist in the URL across mutations. */
function pathFor(stylistId: string | null): string {
  return stylistId ? `${PATH}?stylist=${encodeURIComponent(stylistId)}` : PATH;
}

export async function addAvailabilityWindow(formData: FormData) {
  const supabase = await requireAdmin();
  const stylistId = strOrNull(formData.get("stylist_id"));
  const dayOfWeek = numOrNull(formData.get("day_of_week"));
  const startTime = strOrNull(formData.get("start_time"));
  const endTime = strOrNull(formData.get("end_time"));
  const back = pathFor(stylistId);

  if (!stylistId || dayOfWeek === null || !startTime || !endTime) {
    backTo(back, "Day, start, and end time are all required.");
  }
  if (endTime <= startTime) {
    backTo(back, "End time must be after start time.");
  }

  const { error } = await supabase.from("availability").insert({
    stylist_id: stylistId,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    active: true,
  });
  if (error) backTo(back, error.message);

  revalidatePath(PATH);
  backTo(back);
}

export async function deleteAvailabilityWindow(formData: FormData) {
  const supabase = await requireAdmin();
  const id = strOrNull(formData.get("id"));
  const back = pathFor(strOrNull(formData.get("stylist_id")));
  if (!id) backTo(back, "Missing availability id.");

  const { error } = await supabase.from("availability").delete().eq("id", id);
  if (error) backTo(back, error.message);

  revalidatePath(PATH);
  backTo(back);
}

export async function addBlockedDate(formData: FormData) {
  const supabase = await requireAdmin();
  const stylistId = strOrNull(formData.get("stylist_id"));
  const date = strOrNull(formData.get("date"));
  const back = pathFor(stylistId);
  if (!stylistId || !date) backTo(back, "Pick a date to block.");

  const { error } = await supabase.from("blocked_dates").insert({
    stylist_id: stylistId,
    date,
    reason: strOrNull(formData.get("reason")),
  });
  if (error) backTo(back, error.message);

  revalidatePath(PATH);
  backTo(back);
}

export async function deleteBlockedDate(formData: FormData) {
  const supabase = await requireAdmin();
  const id = strOrNull(formData.get("id"));
  const back = pathFor(strOrNull(formData.get("stylist_id")));
  if (!id) backTo(back, "Missing blocked date id.");

  const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
  if (error) backTo(back, error.message);

  revalidatePath(PATH);
  backTo(back);
}
