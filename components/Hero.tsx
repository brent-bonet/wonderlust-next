import Image from "next/image";
import Btn from "./Btn";

const strip = [
  {
    src: "/images/wonderlust-exterior.jpg",
    alt: "Wonderlust Salon exterior storefront on 22nd Street in Denver RiNo",
  },
  {
    src: "/images/wonderlust-interior.jpg",
    alt: "Wonderlust Salon interior styling chairs",
  },
  {
    src: "/images/wonderlust-shelves.jpg",
    alt: "Wonderlust Salon product shelves with Kevin Murphy hair care",
  },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-[84px]">
      <div className="mx-auto max-w-wrap px-6">
        <div className="max-w-[820px]">
          <h1 className="animate-rise font-typed text-[clamp(2.6rem,8.2vw,5.6rem)] font-normal leading-[1.04] tracking-[-.01em]">
            won<span className="px-[.04em] text-toner">·</span>der
            <span className="px-[.04em] text-toner">·</span>lust
          </h1>
          <p className="animate-rise mt-[18px] font-mono text-[.95rem] text-toner-deep [animation-delay:.12s]">
            noun &nbsp;\ ˈwən-dər-ˌləst \ &nbsp;·&nbsp; RiNo Arts District,
            Denver
          </p>
          <p className="animate-rise mt-[22px] max-w-[21em] font-display text-[clamp(1.35rem,3vw,1.9rem)] italic leading-[1.35] [animation-delay:.22s]">
            <b className="font-normal not-italic text-toner-deep">:</b> the
            desire to be in a constant state of wonder.{" "}
            <i>
              &ldquo;Oliver had a serious case of wonderlust — he was bored of
              anything ordinary.&rdquo;
            </i>
          </p>
          <div className="animate-rise mt-9 flex flex-wrap items-center gap-3.5 [animation-delay:.34s]">
            <Btn href="/book">Book an appointment</Btn>
            <a
              href="tel:+13032978463"
              className="border-b border-fog pb-0.5 font-mono text-[.92rem] no-underline hover:border-toner"
            >
              (303) 297-8463
            </a>
          </div>
        </div>

        <div
          className="mt-16 grid auto-rows-[clamp(220px,30vw,360px)] grid-cols-[1.3fr_1fr_1fr] gap-2.5 max-[860px]:auto-rows-[clamp(160px,42vw,300px)] max-[860px]:grid-cols-2"
          aria-hidden="true"
        >
          {strip.map((img, i) => (
            <figure
              key={img.src}
              className={`relative h-full overflow-hidden rounded-[10px] bg-fog ${
                i === 0 ? "max-[860px]:col-span-full" : ""
              }`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 860px) 100vw, 40vw"
                className="object-cover"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
