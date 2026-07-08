"use client";

import { useState } from "react";

/**
 * Two-step cancel with an explicit way out: "Cancel booking" swaps to a
 * confirm row naming the client and date, with "Yes, cancel it" (submits
 * the server action) and "No, keep it" (returns to the default state).
 */
export default function CancelBookingControl({
  action,
  bookingId,
  filter,
  clientName,
  appointmentDate,
}: {
  action: (formData: FormData) => Promise<void>;
  bookingId: string;
  filter: string;
  clientName: string;
  appointmentDate: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="cursor-pointer bg-transparent font-mono text-[.8rem] text-tan hover:underline"
      >
        Cancel booking
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-mono text-[.8rem] text-ink">
        Cancel {clientName}&rsquo;s {appointmentDate} appointment?
      </span>
      <form action={action} className="contents">
        <input type="hidden" name="id" value={bookingId} />
        <input type="hidden" name="filter" value={filter} />
        <button
          type="submit"
          className="cursor-pointer rounded-full border border-tan bg-transparent px-3 py-[5px] font-mono text-[.8rem] text-tan transition-colors duration-200 hover:bg-tan hover:text-paper"
        >
          Yes, cancel it
        </button>
      </form>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="cursor-pointer border-b border-fog bg-transparent font-mono text-[.8rem] text-ink hover:border-toner"
      >
        No, keep it
      </button>
    </div>
  );
}
