const socials = [
  { href: "https://www.instagram.com/wonderlust.salon/", label: "Instagram" },
  { href: "https://www.facebook.com/wonderlust.salon/", label: "Facebook" },
  { href: "https://www.yelp.com/biz/wonderlust-salon-denver", label: "Yelp" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-fog pb-12 pt-9 text-[.85rem] text-[#5d6b63]">
      <div className="mx-auto flex max-w-wrap flex-wrap justify-between gap-5 px-6">
        <span>© 2026 Wonderlust Salon · Denver, CO</span>
        <div className="flex gap-[18px]">
          {socials.map((social) => (
            <a
              key={social.href}
              href={social.href}
              className="no-underline hover:text-toner-deep"
            >
              {social.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
