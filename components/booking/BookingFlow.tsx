"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Btn from "@/components/Btn";
import { amountDueNow } from "@/lib/booking";
import type { BookableService, Slot, StylistCard } from "@/lib/types";
import PaymentStep from "./PaymentStep";

type Details = { name: string; email: string; phone: string };
type PaymentInfo = {
  bookingId: string;
  clientSecret: string;
  amount: number;
  paymentType: "deposit" | "full";
};

const BASE_STEPS = ["Service", "Stylist", "Time", "Details"] as const;

const inputClasses =
  "w-full rounded-[10px] border border-fog bg-white px-4 py-2.5 font-body text-[.95rem] text-ink focus:border-transparent focus:outline-2 focus:outline-toner";

const labelClasses =
  "mb-1.5 block font-mono text-[.8rem] uppercase tracking-[.18em] text-toner-deep";

export default function BookingFlow({
  services,
  stylists,
}: {
  services: BookableService[];
  stylists: StylistCard[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [service, setService] = useState<BookableService | null>(null);
  const [stylist, setStylist] = useState<StylistCard | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [demoSlots, setDemoSlots] = useState(false);
  const [details, setDetails] = useState<Details>({ name: "", email: "", phone: "" });
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, BookableService[]>();
    for (const s of services) {
      if (!map.has(s.category)) map.set(s.category, []);
      map.get(s.category)!.push(s);
    }
    return [...map.entries()];
  }, [services]);

  const { minDate, maxDate } = useMemo(() => {
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const now = new Date();
    const max = new Date(now);
    max.setDate(max.getDate() + 60);
    return { minDate: fmt(now), maxDate: fmt(max) };
  }, []);

  useEffect(() => {
    if (!service || !stylist || !date) return;
    const controller = new AbortController();
    setSlotsLoading(true);
    setSlots([]);
    setTime("");
    setError(null);
    fetch(
      `/api/availability?serviceId=${encodeURIComponent(service.id)}&stylistId=${encodeURIComponent(stylist.id)}&date=${date}`,
      { signal: controller.signal },
    )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load times.");
        setSlots(data.slots);
        setDemoSlots(Boolean(data.demo));
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setSlotsLoading(false));
    return () => controller.abort();
  }, [service, stylist, date]);

  const detailsValid =
    details.name.trim().length > 1 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim()) &&
    details.phone.trim().length >= 7;

  const submitBooking = useCallback(async () => {
    if (!service || !stylist) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          stylistId: stylist.id,
          date,
          time,
          name: details.name,
          email: details.email,
          phone: details.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed.");
      if (data.free) {
        router.push(`/book/confirmation?bookingId=${data.bookingId}`);
        return;
      }
      setPayment(data);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed.");
    } finally {
      setSubmitting(false);
    }
  }, [service, stylist, date, time, details, router]);

  const canContinue =
    (step === 0 && !!service) ||
    (step === 1 && !!stylist) ||
    (step === 2 && !!date && !!time) ||
    (step === 3 && detailsValid);

  // Most services are paid at the salon — the Payment step only exists when
  // the selected service is configured with a deposit or full prepayment.
  const dueNow = service ? amountDueNow(service) : null;
  const steps: string[] =
    dueNow && dueNow.amount > 0 ? [...BASE_STEPS, "Payment"] : [...BASE_STEPS];

  function continueLabel() {
    if (step < 3) return "Continue";
    if (dueNow && dueNow.amount > 0) return "Continue to payment";
    return "Confirm booking";
  }

  return (
    <div className="max-w-[820px]">
      {/* Step indicator */}
      <ol className="mb-10 flex flex-wrap gap-x-5 gap-y-2">
        {steps.map((label, i) => (
          <li
            key={label}
            className={`font-mono text-[.8rem] uppercase tracking-[.18em] ${
              i === step
                ? "text-toner-deep"
                : i < step
                  ? "text-ink"
                  : "text-[#8fa39d]"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {/* Step 1: service */}
      {step === 0 && (
        <div className="flex flex-col gap-10">
          {groups.map(([category, items]) => (
            <div key={category}>
              <h3 className="mb-[18px] border-b-2 border-ink pb-3 text-[.85rem] font-bold uppercase tracking-[.14em]">
                {category}
              </h3>
              <ul className="list-none">
                {items.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setService(s)}
                      aria-pressed={service?.id === s.id}
                      className={`flex w-full cursor-pointer items-baseline gap-2 rounded-[10px] border px-3 py-[9px] text-left text-[.98rem] transition-colors duration-200 ${
                        service?.id === s.id
                          ? "border-toner-deep bg-[#e6efec]"
                          : "border-transparent hover:border-fog"
                      }`}
                    >
                      <span className="whitespace-nowrap">{s.name}</span>
                      <span
                        className="min-w-4 flex-1 -translate-y-1 border-b border-dotted border-fog"
                        aria-hidden="true"
                      />
                      <span className="whitespace-nowrap font-mono text-[.9rem] text-toner-deep">
                        {s.priceDisplay}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Step 2: stylist */}
      {step === 1 && (
        <div className="grid grid-cols-3 gap-8 max-[860px]:grid-cols-1">
          {stylists.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStylist(s)}
              aria-pressed={stylist?.id === s.id}
              className={`flex cursor-pointer flex-col rounded-[14px] border p-3 text-left transition-colors duration-200 ${
                stylist?.id === s.id
                  ? "border-toner-deep bg-[#e6efec]"
                  : "border-fog bg-white hover:border-toner-deep"
              }`}
            >
              {s.photoUrl ? (
                <div className="relative aspect-square overflow-hidden rounded-[10px] bg-fog">
                  <Image
                    src={s.photoUrl}
                    alt={`${s.name}, ${s.role.toLowerCase()}`}
                    fill
                    sizes="(max-width: 860px) 100vw, 33vw"
                    className="object-cover saturate-[.92]"
                  />
                </div>
              ) : (
                <div
                  aria-hidden="true"
                  className="flex aspect-square items-center justify-center rounded-[10px] bg-fog font-typed text-[4rem] text-toner-deep"
                >
                  {s.name.charAt(0)}
                </div>
              )}
              <span className="mt-3 font-display text-[1.4rem]">{s.name}</span>
              <span className="mt-1 font-mono text-[.82rem] text-toner-deep">
                {s.role}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Step 3: date + time */}
      {step === 2 && (
        <div>
          <label htmlFor="booking-date" className={labelClasses}>
            Date
          </label>
          <input
            id="booking-date"
            type="date"
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-[10px] border border-fog bg-white px-4 py-2.5 font-mono text-[.92rem] text-ink focus:border-transparent focus:outline-2 focus:outline-toner"
          />
          {demoSlots && date && (
            <p className="mt-3 font-mono text-[.8rem] text-tan">
              Demo times — the live calendar connects once the database is
              configured.
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            {slotsLoading && (
              <p className="font-mono text-[.85rem] text-[#8fa39d]">
                Checking the book…
              </p>
            )}
            {!slotsLoading && date && slots.length === 0 && (
              <p className="font-mono text-[.85rem] text-[#8fa39d]">
                No openings that day — try another date.
              </p>
            )}
            {slots.map((slot) => (
              <button
                key={slot.value}
                type="button"
                onClick={() => setTime(slot.value)}
                aria-pressed={time === slot.value}
                className={`cursor-pointer rounded-full border px-3 py-[7px] font-mono text-[.85rem] transition-colors duration-200 ${
                  time === slot.value
                    ? "border-transparent bg-toner text-ink"
                    : "border-fog bg-white text-toner-deep hover:border-toner-deep"
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: contact details */}
      {step === 3 && (
        <div className="flex max-w-[24rem] flex-col gap-5">
          <div>
            <label htmlFor="booking-name" className={labelClasses}>
              Name
            </label>
            <input
              id="booking-name"
              type="text"
              autoComplete="name"
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="booking-email" className={labelClasses}>
              Email
            </label>
            <input
              id="booking-email"
              type="email"
              autoComplete="email"
              value={details.email}
              onChange={(e) => setDetails({ ...details, email: e.target.value })}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="booking-phone" className={labelClasses}>
              Phone
            </label>
            <input
              id="booking-phone"
              type="tel"
              autoComplete="tel"
              value={details.phone}
              onChange={(e) => setDetails({ ...details, phone: e.target.value })}
              className={inputClasses}
            />
          </div>
        </div>
      )}

      {/* Step 5: payment */}
      {step === 4 && payment && service && stylist && (
        <PaymentStep
          payment={payment}
          summary={{
            serviceName: service.name,
            servicePrice: service.priceDisplay,
            stylistName: stylist.name,
            date,
            time,
          }}
        />
      )}

      {error && (
        <p role="alert" className="mt-6 font-mono text-[.85rem] text-tan">
          {error}
        </p>
      )}

      {/* Footer controls (payment step has its own submit) */}
      {step < 4 && (
        <div className="mt-10 flex items-center gap-5">
          {step > 0 && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep(step - 1);
              }}
              className="cursor-pointer border-b border-fog bg-transparent font-mono text-[.85rem] text-ink hover:border-toner"
            >
              ← Back
            </button>
          )}
          <Btn
            onClick={() => {
              if (step === 3) {
                submitBooking();
              } else {
                setError(null);
                setStep(step + 1);
              }
            }}
            disabled={!canContinue || submitting}
          >
            {submitting ? "One moment…" : continueLabel()}
          </Btn>
        </div>
      )}
    </div>
  );
}
