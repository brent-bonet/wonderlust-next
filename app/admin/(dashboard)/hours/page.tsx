import PendingBtn from "@/components/admin/PendingBtn";
import {
  AdminPage,
  checkboxLabelClasses,
  inputClasses,
  labelClasses,
} from "@/components/admin/ui";
import { getSupabaseServerAuth } from "@/lib/supabase/server-auth";
import { saveBusinessHours } from "./actions";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

type HoursRow = {
  day_of_week: number;
  opens: string | null;
  closes: string | null;
  closed: boolean;
};

/** Demo rows mirror lib/fallback-data.ts FALLBACK_HOURS. */
const DEMO_HOURS: HoursRow[] = DAYS.map((_, dow) => ({
  day_of_week: dow,
  opens: dow >= 2 ? "09:00" : null,
  closes: dow >= 2 ? "20:00" : null,
  closed: dow < 2,
}));

async function loadHours(): Promise<{ rows: HoursRow[]; demo: boolean }> {
  const supabase = await getSupabaseServerAuth();
  if (!supabase) return { rows: DEMO_HOURS, demo: true };

  const { data, error } = await supabase
    .from("business_hours")
    .select("day_of_week, opens, closes, closed")
    .order("day_of_week");
  if (error) throw new Error(error.message);

  // One editable row per day even before any row exists in the table.
  const byDay = new Map((data ?? []).map((r) => [r.day_of_week, r]));
  const rows = DAYS.map(
    (_, dow) =>
      byDay.get(dow) ?? { day_of_week: dow, opens: null, closes: null, closed: true },
  );
  return { rows, demo: false };
}

/** DB time "HH:MM:SS" → input[type=time] value "HH:MM". */
function toInputTime(t: string | null): string {
  return t ? t.slice(0, 5) : "";
}

export default async function AdminHoursPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ rows, demo }, { error }] = await Promise.all([
    loadHours(),
    searchParams,
  ]);

  return (
    <AdminPage label="Storefront" title="Business hours" error={error}>
      <p className="max-w-[52ch] text-[.95rem] text-ink">
        These are the hours shown on the public site, and the outer bounds for
        every stylist&rsquo;s bookable day.
      </p>
      <ul className="mt-8 max-w-[680px] list-none">
        {rows.map((row) => (
          <li key={row.day_of_week} className="border-b border-fog py-4">
            <form action={saveBusinessHours}>
              <fieldset
                disabled={demo}
                className="flex flex-wrap items-end gap-4"
              >
                <input type="hidden" name="day_of_week" value={row.day_of_week} />
                <span className="w-28 shrink-0 self-center">
                  {DAYS[row.day_of_week]}
                </span>
                <div>
                  <label className={labelClasses}>Opens</label>
                  <input
                    name="opens"
                    type="time"
                    defaultValue={toInputTime(row.opens)}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Closes</label>
                  <input
                    name="closes"
                    type="time"
                    defaultValue={toInputTime(row.closes)}
                    className={inputClasses}
                  />
                </div>
                <label className={`${checkboxLabelClasses} self-center pb-1.5`}>
                  <input
                    name="closed"
                    type="checkbox"
                    defaultChecked={row.closed}
                    className="size-4 accent-toner-deep"
                  />
                  Closed
                </label>
                <PendingBtn>Save</PendingBtn>
              </fieldset>
            </form>
          </li>
        ))}
      </ul>
    </AdminPage>
  );
}
