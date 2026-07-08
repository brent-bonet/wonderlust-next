import Image from "next/image";
import ConfirmAction from "@/components/admin/ConfirmAction";
import PendingBtn from "@/components/admin/PendingBtn";
import {
  AdminPage,
  EditDetails,
  checkboxLabelClasses,
  inputClasses,
  labelClasses,
} from "@/components/admin/ui";
import { FALLBACK_STYLISTS } from "@/lib/fallback-data";
import { getSupabaseServerAuth } from "@/lib/supabase/server-auth";
import { deleteStylist, upsertStylist } from "./actions";

type StylistRow = {
  id: string;
  name: string;
  role: string | null;
  bio: string | null;
  photo_url: string | null;
  active: boolean;
};

async function loadStylists(): Promise<{ rows: StylistRow[]; demo: boolean }> {
  const supabase = await getSupabaseServerAuth();
  if (!supabase) {
    return {
      demo: true,
      rows: FALLBACK_STYLISTS.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        bio: s.bio,
        photo_url: s.photoUrl,
        active: true,
      })),
    };
  }
  const { data, error } = await supabase
    .from("stylists")
    .select("id, name, role, bio, photo_url, active")
    .order("created_at");
  if (error) throw new Error(error.message);
  return { rows: data ?? [], demo: false };
}

function StylistFields({ stylist }: { stylist?: StylistRow }) {
  return (
    <div className="grid grid-cols-2 gap-5 max-[700px]:grid-cols-1">
      <input type="hidden" name="id" value={stylist?.id ?? ""} />
      <input
        type="hidden"
        name="existing_photo_url"
        value={stylist?.photo_url ?? ""}
      />
      <div>
        <label className={labelClasses}>Name</label>
        <input
          name="name"
          type="text"
          required
          defaultValue={stylist?.name ?? ""}
          className={inputClasses}
        />
      </div>
      <div>
        <label className={labelClasses}>Role</label>
        <input
          name="role"
          type="text"
          defaultValue={stylist?.role ?? ""}
          placeholder="Master Stylist"
          className={inputClasses}
        />
      </div>
      <div className="col-span-full">
        <label className={labelClasses}>Bio</label>
        <textarea
          name="bio"
          rows={3}
          defaultValue={stylist?.bio ?? ""}
          className={inputClasses}
        />
      </div>
      <div>
        <label className={labelClasses}>Photo</label>
        <input
          name="photo"
          type="file"
          accept="image/*"
          className="w-full font-mono text-[.85rem] text-ink file:mr-4 file:cursor-pointer file:rounded-full file:border-none file:bg-fog file:px-4 file:py-2 file:font-mono file:text-[.8rem] file:text-ink"
        />
      </div>
      <div className="flex items-end pb-1.5">
        <label className={checkboxLabelClasses}>
          <input
            name="active"
            type="checkbox"
            defaultChecked={stylist?.active ?? true}
            className="size-4 accent-toner-deep"
          />
          Active
        </label>
      </div>
    </div>
  );
}

export default async function AdminStylistsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ rows, demo }, { error }] = await Promise.all([
    loadStylists(),
    searchParams,
  ]);

  return (
    <AdminPage label="Team" title="Stylists" error={error}>
      <EditDetails
        summary={
          <span className="font-mono text-[.85rem] uppercase tracking-[.14em] text-toner-deep">
            + Add a stylist
          </span>
        }
      >
        <form action={upsertStylist}>
          <fieldset disabled={demo} className="contents">
            <StylistFields />
            <div className="mt-6">
              <PendingBtn>Add stylist</PendingBtn>
            </div>
          </fieldset>
        </form>
      </EditDetails>

      <ul className="mt-6 flex list-none flex-col gap-1">
        {rows.map((s) => (
          <li key={s.id}>
            <EditDetails
              summary={
                <>
                  {s.photo_url ? (
                    <span className="relative size-9 shrink-0 self-center overflow-hidden rounded-full bg-fog">
                      <Image
                        src={s.photo_url}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center self-center rounded-full bg-fog font-typed text-[1.1rem] text-toner-deep"
                    >
                      {s.name.charAt(0)}
                    </span>
                  )}
                  <span
                    className={`whitespace-nowrap ${s.active ? "" : "text-[#8fa39d] line-through"}`}
                  >
                    {s.name}
                  </span>
                  <span
                    className="min-w-4 flex-1 -translate-y-1 border-b border-dotted border-fog"
                    aria-hidden="true"
                  />
                  <span className="whitespace-nowrap font-mono text-[.85rem] text-toner-deep">
                    {s.role ?? "—"}
                  </span>
                </>
              }
            >
              <form action={upsertStylist}>
                <fieldset disabled={demo} className="contents">
                  <StylistFields stylist={s} />
                  <div className="mt-6">
                    <PendingBtn>Save</PendingBtn>
                  </div>
                </fieldset>
              </form>
              <div className="mt-4">
                <ConfirmAction
                  action={deleteStylist}
                  fields={{ id: s.id }}
                  disabled={demo}
                  trigger="Delete stylist"
                  prompt={`Remove ${s.name} from the team?`}
                  confirmLabel="Yes, remove"
                />
              </div>
            </EditDetails>
          </li>
        ))}
      </ul>
    </AdminPage>
  );
}
