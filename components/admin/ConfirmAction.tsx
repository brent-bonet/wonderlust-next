"use client";

import { useState } from "react";

/**
 * Two-step guard for destructive admin actions: the trigger swaps to a
 * prompt with an explicit confirm (submits the server action with the
 * given hidden fields) and an explicit "keep it" that restores the
 * default state. Used for cancelling bookings and deleting services,
 * stylists, availability windows, and blocked dates.
 */
export default function ConfirmAction({
  action,
  fields,
  trigger,
  triggerAriaLabel,
  triggerClassName = "cursor-pointer border-b border-fog bg-transparent font-mono text-[.8rem] text-tan hover:border-tan disabled:cursor-not-allowed disabled:opacity-50",
  prompt,
  confirmLabel,
  keepLabel = "No, keep it",
  disabled = false,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  trigger: string;
  triggerAriaLabel?: string;
  triggerClassName?: string;
  prompt: string;
  confirmLabel: string;
  keepLabel?: string;
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        aria-label={triggerAriaLabel}
        disabled={disabled}
        onClick={() => setConfirming(true)}
        className={triggerClassName}
      >
        {trigger}
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-3">
      <span className="font-mono text-[.8rem] text-ink">{prompt}</span>
      <form action={action} className="contents">
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button
          type="submit"
          className="cursor-pointer rounded-full border border-tan bg-transparent px-3 py-[5px] font-mono text-[.8rem] text-tan transition-colors duration-200 hover:bg-tan hover:text-paper"
        >
          {confirmLabel}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="cursor-pointer border-b border-fog bg-transparent font-mono text-[.8rem] text-ink hover:border-toner"
      >
        {keepLabel}
      </button>
    </span>
  );
}
