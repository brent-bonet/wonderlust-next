"use server";

import { revalidatePath } from "next/cache";
import { backTo, requireAdmin, strOrNull } from "@/lib/admin";

const PATH = "/admin/bookings";

function pathFor(filter: string | null): string {
  return filter ? `${PATH}?filter=${encodeURIComponent(filter)}` : PATH;
}

export async function cancelBooking(formData: FormData) {
  const supabase = await requireAdmin();
  const id = strOrNull(formData.get("id"));
  const back = pathFor(strOrNull(formData.get("filter")));
  if (!id) backTo(back, "Missing booking id.");

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) backTo(back, error.message);

  revalidatePath(PATH);
  backTo(back);
}

export async function rescheduleBooking(formData: FormData) {
  const supabase = await requireAdmin();
  const id = strOrNull(formData.get("id"));
  const date = strOrNull(formData.get("date"));
  const time = strOrNull(formData.get("time"));
  const back = pathFor(strOrNull(formData.get("filter")));
  if (!id || !date || !time) backTo(back, "Reschedule needs a date and time.");

  const { error } = await supabase
    .from("bookings")
    .update({ appointment_date: date, appointment_time: time })
    .eq("id", id);
  if (error) backTo(back, error.message);

  revalidatePath(PATH);
  backTo(back);
}
