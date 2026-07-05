import Btn from "./Btn";

export default function BookBand() {
  return (
    <section className="book-band relative overflow-hidden bg-toner-deep px-6 py-[72px] text-center text-white">
      <h2 className="relative mb-2.5 font-display text-[clamp(1.9rem,4.5vw,2.8rem)] font-normal">
        Bored of anything ordinary?
      </h2>
      <p className="relative mb-7 opacity-85">
        Book online in about a minute — pick your stylist, service, and time.
      </p>
      <Btn href="/book" variant="band" className="relative">
        Book online now
      </Btn>
    </section>
  );
}
