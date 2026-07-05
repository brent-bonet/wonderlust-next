import type { HoursRow } from "@/lib/types";
import { Eyebrow, SectTitle } from "./Section";

const links = [
  { href: "https://maps.google.com/?cid=6761306963118573768", label: "Directions ↗" },
  { href: "https://www.instagram.com/wonderlust.salon/", label: "Instagram ↗" },
  { href: "https://www.facebook.com/wonderlust.salon/", label: "Facebook ↗" },
  { href: "https://www.yelp.com/biz/wonderlust-salon-denver", label: "Yelp ↗" },
];

export default function Visit({ hours }: { hours: HoursRow[] }) {
  return (
    <section id="visit" className="py-[84px]">
      <div className="mx-auto max-w-wrap px-6">
        <Eyebrow>Visit</Eyebrow>
        <SectTitle>In the heart of RiNo.</SectTitle>

        <div className="grid grid-cols-[1.1fr_1fr] items-start gap-14 max-[860px]:grid-cols-1 max-[860px]:gap-10">
          <div className="col-span-full mb-2 aspect-[21/9] overflow-hidden rounded-[10px] bg-fog">
            <iframe
              title="Map to Wonderlust Salon, 1309 22nd St, Denver"
              src="https://maps.google.com/maps?q=1309%2022nd%20St%2C%20Denver%2C%20CO%2080205&z=16&output=embed"
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <div>
            <p className="mb-1.5 font-display text-[1.5rem] leading-[1.3]">
              1309 22nd Street
              <br />
              Denver, CO 80205
            </p>
            <p className="mb-1.5 mt-3.5">
              <a
                href="tel:+13032978463"
                className="border-b border-fog no-underline hover:border-toner"
              >
                (303) 297-8463
              </a>
            </p>
            <p className="mb-1.5">
              <a
                href="mailto:wonderlust.salon@gmail.com"
                className="border-b border-fog no-underline hover:border-toner"
              >
                wonderlust.salon@gmail.com
              </a>
            </p>
            <div className="mt-[22px] flex flex-wrap gap-[18px]">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="border-b border-fog font-mono text-[.85rem] no-underline hover:border-toner"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <ul className="max-w-96 list-none">
            {hours.map((row) => (
              <li
                key={row.day}
                className="flex justify-between gap-4 border-b border-fog py-2.5 text-[.98rem]"
              >
                <span>{row.day}</span>
                <span
                  className={`font-mono text-[.9rem] ${
                    row.closed ? "text-[#8fa39d]" : ""
                  }`}
                >
                  {row.display}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
