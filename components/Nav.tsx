import Link from "next/link";
import Btn from "./Btn";

const links = [
  { href: "/#services", label: "Services" },
  { href: "/#team", label: "Team" },
  { href: "/#visit", label: "Visit" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-fog bg-[color-mix(in_srgb,var(--paper)_88%,transparent)] backdrop-blur-[10px]">
      <div className="mx-auto flex max-w-wrap items-center gap-[28px] px-6 py-3.5">
        <Link
          href="/"
          className="whitespace-nowrap font-typed text-[1.2rem] tracking-[.01em] text-toner-deep no-underline"
        >
          wonder<span className="text-toner">·</span>lust
        </Link>
        <nav
          aria-label="Site"
          className="ml-auto flex gap-6 max-[860px]:hidden"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[.82rem] font-medium uppercase tracking-[.12em] text-ink no-underline opacity-75 transition-opacity duration-150 hover:opacity-100 focus-visible:opacity-100"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <Btn href="/book" variant="violet" className="max-[860px]:ml-auto">
          Book
        </Btn>
      </div>
    </header>
  );
}
