import type { ServiceGroup } from "@/lib/types";
import { Eyebrow, SectTitle } from "./Section";

export default function ServicesMenu({ groups }: { groups: ServiceGroup[] }) {
  return (
    <section id="services" className="border-t border-fog py-[84px]">
      <div className="mx-auto max-w-wrap px-6">
        <Eyebrow>The menu</Eyebrow>
        <SectTitle>Cuts, color, and the in-between.</SectTitle>

        <div className="grid grid-cols-3 gap-x-10 gap-y-12 max-[860px]:grid-cols-1 max-[860px]:gap-10">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-[18px] border-b-2 border-ink pb-3 font-body text-[.85rem] font-bold uppercase tracking-[.14em]">
                {group.title}
              </h3>
              <ul className="list-none">
                {group.items.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-baseline gap-2 py-[9px] text-[.98rem]"
                  >
                    <span className="whitespace-nowrap">{item.name}</span>
                    <span
                      className="min-w-4 flex-1 -translate-y-1 border-b border-dotted border-fog"
                      aria-hidden="true"
                    />
                    <span className="whitespace-nowrap font-mono text-[.9rem] text-toner-deep">
                      {item.price}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 max-w-[46em] text-[.9rem] text-[#5d6b63]">
          Prices are starting points and vary by stylist — hair length,
          density, and how far we&rsquo;re traveling from your current color
          all factor in. Not sure what to book? Consultations are free, and the
          live menu with exact pricing is one tap away when you book.
        </p>
      </div>
    </section>
  );
}
