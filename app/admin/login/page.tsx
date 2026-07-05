import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin sign in — Wonderlust Salon",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return (
    <main className="mx-auto max-w-wrap px-6 py-[84px]">
      <p className="font-mono text-[.8rem] uppercase tracking-[.18em] text-toner-deep">
        Wonderlust admin
      </p>
      <h1 className="mt-2 mb-10 font-display text-[clamp(2rem,5vw,3rem)] font-normal leading-[1.1]">
        Sign in
      </h1>
      <LoginForm configured={configured} />
    </main>
  );
}
