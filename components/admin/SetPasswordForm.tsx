"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Btn from "@/components/Btn";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const inputClasses =
  "w-full rounded-[10px] border border-fog bg-white px-4 py-2.5 font-body text-[.95rem] text-ink focus:border-transparent focus:outline-2 focus:outline-toner";

const labelClasses =
  "mb-1.5 block font-mono text-[.8rem] uppercase tracking-[.18em] text-toner-deep";

export default function SetPasswordForm() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(session !== null);
      setChecking(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  if (checking) {
    return <p className="font-mono text-[.85rem] text-[#8fa39d]">One moment…</p>;
  }

  if (!hasSession) {
    return (
      <p className="max-w-[24rem] text-[.95rem]">
        This link has expired or was already used. Ask for a fresh invite from
        the Supabase dashboard, or{" "}
        <a href="/admin/login" className="border-b border-fog text-toner-deep">
          sign in
        </a>{" "}
        if you already have a password set.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-[24rem] flex-col gap-5">
      <div>
        <label htmlFor="set-password-new" className={labelClasses}>
          New password
        </label>
        <input
          id="set-password-new"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor="set-password-confirm" className={labelClasses}>
          Confirm password
        </label>
        <input
          id="set-password-confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
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
          {submitting ? "Saving…" : "Set password"}
        </Btn>
      </div>
    </form>
  );
}
