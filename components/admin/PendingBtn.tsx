"use client";

import { useFormStatus } from "react-dom";

/*
 * Submit button that shows the form's in-flight state: busy cursor,
 * disabled, and a "One moment…" label while the server action runs.
 * Default styling mirrors components/Btn.tsx's default variant; pass
 * className (without cursor utilities — pending state controls those)
 * for compact contexts.
 */
const defaultClasses =
  "inline-block rounded-full border-none bg-ink px-[22px] py-3 text-[.82rem] font-bold uppercase tracking-[.12em] text-paper transition-[background-color,transform] duration-150 ease-[ease] hover:-translate-y-px hover:bg-toner-deep focus-visible:-translate-y-px focus-visible:bg-toner-deep disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-ink";

export default function PendingBtn({
  children,
  pendingLabel = "One moment…",
  className = defaultClasses,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} ${pending ? "cursor-wait" : "cursor-pointer"}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
