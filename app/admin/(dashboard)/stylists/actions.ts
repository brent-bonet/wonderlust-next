"use server";

import { revalidatePath } from "next/cache";
import { backTo, requireAdmin, strOrNull } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const PATH = "/admin/stylists";
const PHOTO_BUCKET = "photos";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * Storage writes use the service-role client (the schema has no storage
 * policies for authenticated users) — safe because requireAdmin() has
 * already verified the session.
 */
async function uploadPhoto(file: File): Promise<string> {
  if (file.size > MAX_PHOTO_BYTES) throw new Error("Photo must be under 5 MB.");
  if (!file.type.startsWith("image/")) throw new Error("Photo must be an image.");
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Storage is not configured.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `stylists/${crypto.randomUUID()}.${ext}`;
  const { error } = await admin.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  return admin.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function upsertStylist(formData: FormData) {
  const supabase = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) backTo(PATH, "Stylist name is required.");

  let photoUrl = strOrNull(formData.get("existing_photo_url"));
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await uploadPhoto(photo);
    } catch (err) {
      backTo(PATH, err instanceof Error ? err.message : "Photo upload failed.");
    }
  }

  const row = {
    name,
    role: strOrNull(formData.get("role")),
    bio: strOrNull(formData.get("bio")),
    photo_url: photoUrl,
    active: formData.get("active") === "on",
  };

  const id = strOrNull(formData.get("id"));
  const { error } = id
    ? await supabase.from("stylists").update(row).eq("id", id)
    : await supabase.from("stylists").insert(row);
  if (error) backTo(PATH, error.message);

  revalidatePath(PATH);
  revalidatePath("/");
  revalidatePath("/book");
  backTo(PATH);
}

export async function deleteStylist(formData: FormData) {
  const supabase = await requireAdmin();
  const id = strOrNull(formData.get("id"));
  if (!id) backTo(PATH, "Missing stylist id.");

  const { error } = await supabase.from("stylists").delete().eq("id", id);
  if (error) backTo(PATH, error.message);

  revalidatePath(PATH);
  revalidatePath("/");
  revalidatePath("/book");
  backTo(PATH);
}
