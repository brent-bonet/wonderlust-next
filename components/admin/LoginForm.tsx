"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Btn from "@/components/Btn";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const inputClasses =
  "w-full rounded-[10px] border border-fog bg-white px-4 py-2.5 font-body text-[.95rem] text-ink focus:border-transparent focus:outline-2 focus:outline-toner";

const labelClasses =
  "mb-1.5 block font-mono text-[.8rem] uppercase tracking-[.18em] text-toner-deep";

export default function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  if (!configured) {
    return (
      <p className="font-mono text-[.85rem] text-tan">
        Demo mode — connect Supabase (see .env.example) to sign in to the
        admin panel.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-[24rem] flex-col gap-5">
      <div>
        <label htmlFor="login-email" className={labelClasses}>
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor="login-password" className={labelClasses}>
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClasses}
        />
      </div>
      {error && (
        <p role="alert" className="font-mono text-[.85rem] text-tan">
          {error}
        </p>
      )}
      <div>
        <Btn type="submit" disabled={submitting}>
          {submitting ? "One moment…" : "Sign in"}
        </Btn>
      </div>
    </form>
  );
}
