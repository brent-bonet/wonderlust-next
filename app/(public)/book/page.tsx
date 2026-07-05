import type { Metadata } from "next";
import BookingFlow from "@/components/booking/BookingFlow";
import { Eyebrow, SectTitle } from "@/components/Section";
import { getBookableServices, getStylists } from "@/lib/data";

export const metadata: Metadata = {
  title: "Book — Wonderlust Salon",
  description:
    "Book online in about a minute — pick your stylist, service, and time.",
};

export default async function BookPage() {
  const [services, stylists] = await Promise.all([
    getBookableServices(),
    getStylists(),
  ]);

  return (
    <main className="py-[84px]">
      <div className="mx-auto max-w-wrap px-6">
        <Eyebrow>Book</Eyebrow>
        <SectTitle>Pick your moment.</SectTitle>
        <BookingFlow services={services} stylists={stylists} />
      </div>
    </main>
  );
}
