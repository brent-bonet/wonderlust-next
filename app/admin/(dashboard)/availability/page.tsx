import Link from "next/link";
import ConfirmAction from "@/components/admin/ConfirmAction";
import PendingBtn from "@/components/admin/PendingBtn";
import { AdminPage, inputClasses, labelClasses } from "@/components/admin/ui";
import { FALLBACK_STYLISTS } from "@/lib/fallback-data";
import { getSupabaseServerAuth } from "@/lib/supabase/server-auth";
import {
  addAvailabilityWindow,
  addBlockedDate,
  deleteAvailabilityWindow,
  deleteBlockedDate,
} from "./actions";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

type WindowRow = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
};

type BlockedRow = { id: string; date: string; reason: string | null };

type StylistOption = { id: string; name: string };

/** "HH:MM[:SS]" → "9:00a" (matches the reference's slot label style). */
function timeLabel(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const suffix = h < 12 ? "a" : "p";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

async function loadData(selectedId: string | undefined) {
  const supabase = await getSupabaseServerAuth();
  if (!supabase) {
    const stylists: StylistOption[] = FALLBACK_STYLISTS.map((s) => ({
      id: s.id,
      name: s.name,
    }));
    const stylist = stylists.find((s) => s.id === selectedId) ?? stylists[0];
    // Demo windows mirror lib/fallback-data.ts FALLBACK_OPEN_*.
    const windows: WindowRow[] = [2, 3, 4, 5, 6].map((dow) => ({
      id: `demo-${dow}`,
      day_of_week: dow,
      start_time: "09:00",
      end_time: "20:00",
      active: true,
    }));
    return { demo: true, stylists, stylist, windows, blocked: [] as BlockedRow[] };
  }

  const { data: stylistRows, error: stylistError } = await supabase
    .from("stylists")
    .select("id, name")
    .order("created_at");
  if (stylistError) throw new Error(stylistError.message);
  const stylists: StylistOption[] = stylistRows ?? [];
  const stylist = stylists.find((s) => s.id === selectedId) ?? stylists[0];
  if (!stylist) {
    return { demo: false, stylists, stylist: undefined, windows: [], blocked: [] };
  }

  const [windowsRes, blockedRes] = await Promise.all([
    supabase
      .from("availability")
      .select("id, day_of_week, start_time, end_time, active")
      .eq("stylist_id", stylist.id)
      .order("day_of_week")
      .order("start_time"),
    supabase
      .from("blocked_dates")
      .select("id, date, reason")
      .eq("stylist_id", stylist.id)
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date"),
  ]);
  if (windowsRes.error) throw new Error(windowsRes.error.message);
  if (blockedRes.error) throw new Error(blockedRes.error.message);

  return {
    demo: false,
    stylists,
    stylist,
    windows: windowsRes.data ?? [],
    blocked: blockedRes.data ?? [],
  };
}

export default async function AdminAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ stylist?: string; error?: string }>;
}) {
  const { stylist: selectedId, error } = await searchParams;
  const { demo, stylists, stylist, windows, blocked } = await loadData(selectedId);

  return (
    <AdminPage label="Schedule" title="Availability" error={error}>
      {/* Stylist picker */}
      <div className="flex flex-wrap gap-2">
        {stylists.map((s) => (
          <Link
            key={s.id}
            href={`/admin/availability?stylist=${encodeURIComponent(s.id)}`}
            aria-current={stylist?.id === s.id ? "page" : undefined}
            className={`rounded-full border px-3 py-[7px] font-mono text-[.85rem] no-underline transition-colors duration-200 ${
              stylist?.id === s.id
                ? "border-transparent bg-toner text-ink"
                : "border-fog bg-white text-toner-deep hover:border-toner-deep"
            }`}
          >
            {s.name}
          </Link>
        ))}
      </div>

      {!stylist && (
        <p className="mt-8 font-mono text-[.85rem] text-[#8fa39d]">
          Add a stylist first — availability hangs off the team.
        </p>
      )}

      {stylist && (
        <div className="mt-10 grid grid-cols-2 gap-12 max-[860px]:grid-cols-1">
          {/* Weekly windows */}
          <section>
            <h2 className="mb-[18px] border-b-2 border-ink pb-3 text-[.85rem] font-bold uppercase tracking-[.14em]">
              Weekly hours — {stylist.name}
            </h2>
            <ul className="list-none">
              {DAYS.map((day, dow) => {
                const dayWindows = windows.filter((w) => w.day_of_week === dow);
                return (
                  <li
                    key={day}
                    className="flex items-baseline gap-2 border-b border-fog py-[9px]"
                  >
                    <span className="w-28 shrink-0">{day}</span>
                    {dayWindows.length === 0 ? (
                      <span className="font-mono text-[.85rem] text-[#8fa39d]">
                        off
                      </span>
                    ) : (
                      <span className="flex flex-wrap gap-x-4 gap-y-1">
                        {dayWindows.map((w) => (
                          <span
                            key={w.id}
                            className="inline-flex flex-wrap items-baseline gap-2"
                          >
                            <span className="font-mono text-[.9rem] text-toner-deep">
                              {timeLabel(w.start_time)} – {timeLabel(w.end_time)}
                            </span>
                            {!demo && (
                              <ConfirmAction
                                action={deleteAvailabilityWindow}
                                fields={{ id: w.id, stylist_id: stylist.id }}
                                trigger="✕"
                                triggerAriaLabel={`Remove ${day} ${timeLabel(w.start_time)} window`}
                                triggerClassName="cursor-pointer bg-transparent font-mono text-[.8rem] text-tan hover:underline"
                                prompt={`Remove ${day} ${timeLabel(w.start_time)} – ${timeLabel(w.end_time)}?`}
                                confirmLabel="Yes, remove"
                              />
                            )}
                          </span>
                        ))}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            <form action={addAvailabilityWindow} className="mt-6">
              <fieldset
                disabled={demo}
                className="flex flex-wrap items-end gap-4"
              >
                <input type="hidden" name="stylist_id" value={stylist.id} />
                <div>
                  <label className={labelClasses}>Day</label>
                  <select name="day_of_week" className={inputClasses}>
                    {DAYS.map((day, dow) => (
                      <option key={day} value={dow}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>From</label>
                  <input
                    name="start_time"
                    type="time"
                    required
                    defaultValue="09:00"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>To</label>
                  <input
                    name="end_time"
                    type="time"
                    required
                    defaultValue="20:00"
                    className={inputClasses}
                  />
                </div>
                <PendingBtn>Add window</PendingBtn>
              </fieldset>
            </form>
          </section>

          {/* Blocked dates */}
          <section>
            <h2 className="mb-[18px] border-b-2 border-ink pb-3 text-[.85rem] font-bold uppercase tracking-[.14em]">
              Blocked dates
            </h2>
            {blocked.length === 0 ? (
              <p className="font-mono text-[.85rem] text-[#8fa39d]">
                No upcoming dates blocked.
              </p>
            ) : (
              <ul className="list-none">
                {blocked.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-baseline gap-2 border-b border-fog py-[9px]"
                  >
                    <span className="font-mono text-[.9rem]">{b.date}</span>
                    <span className="text-[.9rem] text-[#8fa39d]">
                      {b.reason ?? ""}
                    </span>
                    <span className="flex-1" />
                    <ConfirmAction
                      action={deleteBlockedDate}
                      fields={{ id: b.id, stylist_id: stylist.id }}
                      trigger="unblock"
                      triggerClassName="cursor-pointer bg-transparent font-mono text-[.8rem] text-tan hover:underline"
                      prompt={`Unblock ${b.date}?`}
                      confirmLabel="Yes, unblock"
                    />
                  </li>
                ))}
              </ul>
            )}

            <form action={addBlockedDate} className="mt-6">
              <fieldset
                disabled={demo}
                className="flex flex-wrap items-end gap-4"
              >
                <input type="hidden" name="stylist_id" value={stylist.id} />
                <div>
                  <label className={labelClasses}>Date</label>
                  <input name="date" type="date" required className={inputClasses} />
                </div>
                <div>
                  <label className={labelClasses}>Reason (optional)</label>
                  <input
                    name="reason"
                    type="text"
                    placeholder="vacation"
                    className={inputClasses}
                  />
                </div>
                <PendingBtn>Block date</PendingBtn>
              </fieldset>
            </form>
          </section>
        </div>
      )}
    </AdminPage>
  );
}
