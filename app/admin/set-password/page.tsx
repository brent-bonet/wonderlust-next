import type { Metadata } from "next";
import SetPasswordForm from "@/components/admin/SetPasswordForm";

export const metadata: Metadata = {
  title: "Set password — Wonderlust Salon",
  robots: { index: false, follow: false },
};

export default function SetPasswordPage() {
  return (
    <main className="mx-auto max-w-wrap px-6 py-[84px]">
      <p className="font-mono text-[.8rem] uppercase tracking-[.18em] text-toner-deep">
        Wonderlust admin
      </p>
      <h1 className="mt-2 mb-10 font-display text-[clamp(2rem,5vw,3rem)] font-normal leading-[1.1]">
        Set your password
      </h1>
      <SetPasswordForm />
    </main>
  );
}
