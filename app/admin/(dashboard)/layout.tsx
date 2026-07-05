import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser, getSupabaseServerAuth } from "@/lib/supabase/server-auth";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: "Admin — Wonderlust Salon",
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/stylists", label: "Stylists" },
  { href: "/admin/availability", label: "Availability" },
  { href: "/admin/hours", label: "Hours" },
] as const;

/**
 * Server-side auth guard for every admin section. proxy.ts redirects too,
 * but this layout is the authoritative check (server actions and RSC
 * requests must not depend on proxy coverage alone).
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await getSupabaseServerAuth();
  const demo = supabase === null;
  if (!demo) {
    const user = await getAdminUser();
    if (!user) redirect("/admin/login");
  }

  return (
    <>
      <header className="border-b border-fog">
        <div className="mx-auto flex max-w-wrap flex-wrap items-baseline gap-x-7 gap-y-2 px-6 py-5">
          <Link
            href="/admin"
            className="font-display text-[1.35rem] text-ink no-underline"
          >
            Wonderlust <span className="italic text-toner-deep">admin</span>
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-1">
            {SECTIONS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="font-mono text-[.8rem] uppercase tracking-[.14em] text-ink no-underline transition-colors duration-200 hover:text-toner-deep"
              >
                {s.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-baseline gap-5">
            <Link
              href="/"
              className="font-mono text-[.8rem] text-toner-deep no-underline hover:underline"
            >
              View site →
            </Link>
            {!demo && (
              <form action={signOut}>
                <button
                  type="submit"
                  className="cursor-pointer border-b border-fog bg-transparent font-mono text-[.8rem] text-ink hover:border-toner"
                >
                  Sign out
                </button>
              </form>
            )}
          </div>
        </div>
      </header>
      {demo && (
        <div className="border-b border-fog bg-[#f4ead9]">
          <p className="mx-auto max-w-wrap px-6 py-2.5 font-mono text-[.8rem] text-tan">
            Demo mode — showing reference data, read-only. Connect Supabase
            (see .env.example) to manage the real salon.
          </p>
        </div>
      )}
      {children}
    </>
  );
}
