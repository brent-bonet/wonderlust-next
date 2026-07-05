import Image from "next/image";
import type { StylistCard } from "@/lib/types";
import { Eyebrow, SectTitle } from "./Section";

export default function Team({ stylists }: { stylists: StylistCard[] }) {
  return (
    <section id="team" className="bg-ink py-[84px] text-paper">
      <div className="mx-auto max-w-wrap px-6">
        <Eyebrow className="text-fog">The chairs</Eyebrow>
        <SectTitle>Three chairs. No assembly line.</SectTitle>

        <div className="grid grid-cols-3 gap-8 max-[860px]:max-w-[420px] max-[860px]:grid-cols-1">
          {stylists.map((stylist) => (
            <div key={stylist.name} className="flex flex-col">
              {stylist.photoUrl ? (
                <div className="relative aspect-square overflow-hidden rounded-[10px] bg-[#33433a]">
                  <Image
                    src={stylist.photoUrl}
                    alt={`${stylist.name}, ${stylist.role.toLowerCase()}`}
                    fill
                    sizes="(max-width: 860px) 100vw, 33vw"
                    className="object-cover saturate-[.92]"
                  />
                </div>
              ) : (
                <div
                  role="img"
                  aria-label={`${stylist.name}, ${stylist.role.toLowerCase()}`}
                  className="flex aspect-square items-center justify-center overflow-hidden rounded-[10px] bg-[#33433a] font-typed text-[4rem] text-toner"
                >
                  {stylist.name.charAt(0)}
                </div>
              )}
              <h3 className="mt-[18px] font-display text-[1.7rem] font-normal">
                {stylist.name}
              </h3>
              <p className="mt-1 font-mono text-[.82rem] text-fog">
                {stylist.role}
              </p>
              <p className="mt-3 max-w-[34em] text-[.95rem] text-[#c9d8d1]">
                {stylist.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
