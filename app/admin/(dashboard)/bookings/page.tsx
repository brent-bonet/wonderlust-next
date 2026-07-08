import Link from "next/link";
import ConfirmAction from "@/components/admin/ConfirmAction";
import PendingBtn from "@/components/admin/PendingBtn";
import { AdminPage, inputClasses, labelClasses } from "@/components/admin/ui";
import { getSupabaseServerAuth } from "@/lib/supabase/server-auth";
import { cancelBooking, rescheduleBooking } from "./actions";

const FILTERS = ["upcoming", "past", "cancelled"] as const;
type Filter = (typeof FILTERS)[number];

type BookingRow = {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  payment_status: string;
  deposit_paid: number;
  total_paid: number;
  services: { name: string } | { name: string }[] | null;
  stylists: { name: string } | { name: string }[] | null;
};

function oneName(rel: BookingRow["services"]): string {
  if (!rel) return "—";
  return Array.isArray(rel) ? (rel[0]?.name ?? "—") : rel.name;
}

const PAYMENT_LABEL: Record<string, string> = {
  unpaid: "Unpaid",
  deposit_paid: "Deposit paid",
  paid: "Paid in full",
  refunded: "Refunded",
};

async function loadBookings(
  filter: Filter,
): Promise<{ rows: BookingRow[]; demo: boolean }> {
  const supabase = await getSupabaseServerAuth();
  if (!supabase) return { rows: [], demo: true };

  const today = new Date().toISOString().slice(0, 10);
  let query = supabase
    .from("bookings")
    .select(
      "id, client_name, client_email, client_phone, appointment_date, appointment_time, status, payment_status, deposit_paid, total_paid, services (name), stylists (name)",
    );

  if (filter === "cancelled") {
    query = query.eq("status", "cancelled");
  } else if (filter === "upcoming") {
    query = query
      .neq("status", "cancelled")
      .neq("status", "completed")
      .gte("appointment_date", today)
      .order("appointment_date")
      .order("appointment_time");
  } else {
    query = query
      .neq("status", "cancelled")
      .or(`appointment_date.lt.${today},status.eq.completed`);
  }
  if (filter !== "upcoming") {
    query = query.order("appointment_date", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return { rows: (data as BookingRow[] | null) ?? [], demo: false };
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; error?: string; notice?: string }>;
}) {
  const { filter: rawFilter, error, notice } = await searchParams;
  const filter: Filter = FILTERS.includes(rawFilter as Filter)
    ? (rawFilter as Filter)
    : "upcoming";
  const { rows, demo } = await loadBookings(filter);

  return (
    <AdminPage label="Calendar" title="Bookings" error={error} notice={notice}>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/bookings?filter=${f}`}
            aria-current={filter === f ? "page" : undefined}
            className={`rounded-full border px-3 py-[7px] font-mono text-[.85rem] capitalize no-underline transition-colors duration-200 ${
              filter === f
                ? "border-transparent bg-toner text-ink"
                : "border-fog bg-white text-toner-deep hover:border-toner-deep"
            }`}
          >
            {f}
          </Link>
        ))}
      </div>

      {demo && (
        <p className="mt-8 font-mono text-[.85rem] text-[#8fa39d]">
          Demo mode — bookings require Supabase to be configured.
        </p>
      )}

      {!demo && rows.length === 0 && (
        <p className="mt-8 font-mono text-[.85rem] text-[#8fa39d]">
          No {filter} bookings.
        </p>
      )}

      {!demo && rows.length > 0 && (
        <ul className="mt-8 flex list-none flex-col gap-1">
          {rows.map((b) => (
            <li key={b.id} className="rounded-[10px] border border-fog bg-white p-5">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-display text-[1.2rem]">{b.client_name}</span>
                <span className="font-mono text-[.85rem] text-toner-deep">
                  {oneName(b.services)} with {oneName(b.stylists)}
                </span>
                <span className="flex-1" />
                <span className="font-mono text-[.85rem]">
                  {b.appointment_date} · {b.appointment_time.slice(0, 5)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[.8rem] text-[#8fa39d]">
                <span>{b.client_email}</span>
                <span>{b.client_phone}</span>
                <span className="uppercase tracking-[.1em] text-toner-deep">
                  {b.status}
                </span>
                {/* "unpaid" is the norm (pay at salon) — only surface the
                    exceptions where money already moved. */}
                {b.payment_status !== "unpaid" && (
                  <span>
                    {PAYMENT_LABEL[b.payment_status] ?? b.payment_status}
                    {b.deposit_paid > 0 && b.payment_status === "deposit_paid"
                      ? ` — $${b.deposit_paid} paid`
                      : ""}
                    {b.total_paid > 0 && b.payment_status === "paid"
                      ? ` — $${b.total_paid}`
                      : ""}
                  </span>
                )}
              </div>

              {b.status !== "cancelled" && b.status !== "completed" && (
                <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-fog pt-4">
                  <form action={rescheduleBooking} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="filter" value={filter} />
                    <div>
                      <label className={labelClasses}>New date</label>
                      <input
                        name="date"
                        type="date"
                        required
                        defaultValue={b.appointment_date}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>New time</label>
                      <input
                        name="time"
                        type="time"
                        required
                        defaultValue={b.appointment_time.slice(0, 5)}
                        className={inputClasses}
                      />
                    </div>
                    <PendingBtn className="rounded-full border border-fog bg-white px-3 py-[7px] font-mono text-[.8rem] text-toner-deep hover:border-toner-deep disabled:opacity-60">
                      Reschedule
                    </PendingBtn>
                  </form>
                  <ConfirmAction
                    action={cancelBooking}
                    fields={{ id: b.id, filter }}
                    trigger="Cancel booking"
                    prompt={`Cancel ${b.client_name}’s ${b.appointment_date} appointment?`}
                    confirmLabel="Yes, cancel it"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  );
}
