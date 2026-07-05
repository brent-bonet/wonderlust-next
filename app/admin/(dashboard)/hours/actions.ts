"use server";

import { revalidatePath } from "next/cache";
import { backTo, numOrNull, requireAdmin, strOrNull } from "@/lib/admin";

const PATH = "/admin/hours";

export async function saveBusinessHours(formData: FormData) {
  const supabase = await requireAdmin();

  const dayOfWeek = numOrNull(formData.get("day_of_week"));
  if (dayOfWeek === null) backTo(PATH, "Missing day.");

  const closed = formData.get("closed") === "on";
  const opens = strOrNull(formData.get("opens"));
  const closes = strOrNull(formData.get("closes"));
  if (!closed && (!opens || !closes)) {
    backTo(PATH, "Open days need both opening and closing times.");
  }
  if (!closed && closes! <= opens!) {
    backTo(PATH, "Closing time must be after opening time.");
  }

  const { error } = await supabase.from("business_hours").upsert(
    {
      day_of_week: dayOfWeek,
      opens: closed ? null : opens,
      closes: closed ? null : closes,
      closed,
    },
    { onConflict: "day_of_week" },
  );
  if (error) backTo(PATH, error.message);

  revalidatePath(PATH);
  revalidatePath("/");
  backTo(PATH);
}
