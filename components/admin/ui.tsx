/*
 * Shared admin styling, matching the booking flow's form idiom
 * (see components/booking/BookingFlow.tsx).
 */

export const inputClasses =
  "w-full rounded-[10px] border border-fog bg-white px-4 py-2.5 font-body text-[.95rem] text-ink focus:border-transparent focus:outline-2 focus:outline-toner disabled:cursor-not-allowed disabled:opacity-50";

export const labelClasses =
  "mb-1.5 block font-mono text-[.8rem] uppercase tracking-[.18em] text-toner-deep";

export const checkboxLabelClasses =
  "flex cursor-pointer items-center gap-2 font-mono text-[.8rem] uppercase tracking-[.18em] text-toner-deep";

export function AdminPage({
  label,
  title,
  error,
  children,
}: {
  label: string;
  title: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-wrap px-6 py-16">
      <p className="font-mono text-[.8rem] uppercase tracking-[.18em] text-toner-deep">
        {label}
      </p>
      <h1 className="mt-2 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-normal leading-[1.1]">
        {title}
      </h1>
      {error && (
        <p role="alert" className="mt-4 font-mono text-[.85rem] text-tan">
          {error}
        </p>
      )}
      <div className="mt-10">{children}</div>
    </main>
  );
}

/** Disclosure row: server-rendered expand/collapse with no client JS. */
export function EditDetails({
  summary,
  children,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-[10px] border border-transparent open:border-fog open:bg-white">
      <summary className="flex cursor-pointer list-none items-baseline gap-2 rounded-[10px] px-3 py-[9px] transition-colors duration-200 hover:bg-white group-open:border-b group-open:border-fog [&::-webkit-details-marker]:hidden">
        {summary}
      </summary>
      <div className="p-5">{children}</div>
    </details>
  );
}
