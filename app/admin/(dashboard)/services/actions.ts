"use server";

import { revalidatePath } from "next/cache";
import { backTo, numOrNull, requireAdmin, strOrNull } from "@/lib/admin";

const PATH = "/admin/services";

export async function upsertService(formData: FormData) {
  const supabase = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) backTo(PATH, "Service name is required.");

  const row = {
    name,
    category: strOrNull(formData.get("category")),
    description: strOrNull(formData.get("description")),
    price: numOrNull(formData.get("price")),
    price_display: strOrNull(formData.get("price_display")),
    deposit_amount: numOrNull(formData.get("deposit_amount")),
    duration_minutes: numOrNull(formData.get("duration_minutes")),
    full_prepayment: formData.get("full_prepayment") === "on",
    active: formData.get("active") === "on",
    sort_order: numOrNull(formData.get("sort_order")) ?? 0,
  };

  const id = strOrNull(formData.get("id"));
  const { error } = id
    ? await supabase.from("services").update(row).eq("id", id)
    : await supabase.from("services").insert(row);
  if (error) backTo(PATH, error.message);

  revalidatePath(PATH);
  revalidatePath("/");
  revalidatePath("/book");
  backTo(PATH);
}

export async function deleteService(formData: FormData) {
  const supabase = await requireAdmin();
  const id = strOrNull(formData.get("id"));
  if (!id) backTo(PATH, "Missing service id.");

  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) backTo(PATH, error.message);

  revalidatePath(PATH);
  revalidatePath("/");
  revalidatePath("/book");
  backTo(PATH);
}
