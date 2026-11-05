"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, MailCheck, RotateCw } from "lucide-react";
import { OtpInput } from "./OtpInput";

export function VerifyForm({ email, next }: { email: string; next: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not verify that code.");
        return;
      }

      const target = next
        ? `/u/${data.publicId}/setup?next=${encodeURIComponent(next)}`
        : data.redirectTo;
      router.push(target);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError("");
    setNotice("");
    setResending(true);
    try {
      const response = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not resend the code.");
        return;
      }
      setCode("");
      setCooldown(60);
      setNotice("A new code is on its way. Check your inbox and spam folder.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <h1 className="auth-title">Check your email</h1>
      <p className="auth-sub">
        We sent a 6-digit code to <strong className="text-hfq-text">{email}</strong>.
        Enter it below to finish creating your account.
      </p>

      <form className="auth-form" onSubmit={onSubmit}>
        {error && <div className="auth-error">{error}</div>}
        {notice && <div className="auth-success">{notice}</div>}

        <OtpInput value={code} onChange={setCode} disabled={loading} autoFocus />

        <button
          className="mc-btn w-full"
          type="submit"
          disabled={loading || code.replace(/\s/g, "").length !== 6}
        >
          {loading ? <Loader2 size={17} className="animate-spin" /> : <MailCheck size={17} />}
          {loading ? "Verifying..." : "Verify email"}
        </button>

        <div className="flex items-center justify-between text-xs text-hfq-dim">
          <span>Didn&apos;t get it?</span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 font-display text-hfq-gold disabled:opacity-50"
            onClick={resend}
            disabled={resending || cooldown > 0}
          >
            <RotateCw size={12} className={resending ? "animate-spin" : ""} />
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      </form>

      <p className="auth-alt">
        Wrong email? <Link href="/register">Start over</Link>
      </p>
    </>
  );
}
