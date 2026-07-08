"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Btn from "@/components/Btn";
import { useBusyCursor } from "@/components/useBusyCursor";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const inputClasses =
  "w-full rounded-[10px] border border-fog bg-white px-4 py-2.5 font-body text-[.95rem] text-ink focus:border-transparent focus:outline-2 focus:outline-toner";

const labelClasses =
  "mb-1.5 block font-mono text-[.8rem] uppercase tracking-[.18em] text-toner-deep";

const linkButtonClasses =
  "cursor-pointer border-b border-fog bg-transparent font-mono text-[.85rem] text-ink hover:border-toner";

type Mode = "signin" | "forgot" | "sent";

export default function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useBusyCursor(submitting);

  async function handleSignIn(e: React.FormEvent) {
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

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    // Recovery link lands on the site root with a #access_token hash;
    // AuthHashHandler (root layout) exchanges it and routes to set-password.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/` },
    );
    setSubmitting(false);
    if (resetError) {
      // Supabase doesn't reveal whether the address exists — errors here are
      // operational (rate limit, misconfig), so they're safe to surface.
      setError(resetError.message);
      return;
    }
    setMode("sent");
  }

  function switchMode(next: Mode) {
    setError(null);
    setMode(next);
  }

  if (!configured) {
    return (
      <p className="font-mono text-[.85rem] text-tan">
        Demo mode — connect Supabase (see .env.example) to sign in to the
        admin panel.
      </p>
    );
  }

  if (mode === "sent") {
    return (
      <div className="max-w-[24rem]">
        <p className="text-[.95rem]">
          If an account exists for {email}, a password reset link is on its
          way. The link opens a page where you can choose a new password.
        </p>
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className={`mt-6 ${linkButtonClasses}`}
        >
          ← Back to sign in
        </button>
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <form onSubmit={handleForgot} className="flex max-w-[24rem] flex-col gap-5">
        <p className="text-[.95rem]">
          Enter your account email and we&rsquo;ll send a link to reset your
          password.
        </p>
        <div>
          <label htmlFor="forgot-email" className={labelClasses}>
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClasses}
          />
        </div>
        {error && (
          <p role="alert" className="font-mono text-[.85rem] text-tan">
            {error}
          </p>
        )}
        <div className="flex items-center gap-5">
          <Btn type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </Btn>
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className={linkButtonClasses}
          >
            ← Back
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSignIn} className="flex max-w-[24rem] flex-col gap-5">
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
      <div className="flex items-center gap-5">
        <Btn type="submit" disabled={submitting}>
          {submitting ? "One moment…" : "Sign in"}
        </Btn>
        <button
          type="button"
          onClick={() => switchMode("forgot")}
          className={linkButtonClasses}
        >
          Forgot password?
        </button>
      </div>
    </form>
  );
}
