"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Mail } from "lucide-react";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not send a reset code.");
        return;
      }
      router.push(data.redirectTo ?? `/reset-password?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="auth-title">Reset your password</h1>
      <p className="auth-sub">
        Enter the email on your HFQ account. We will send a 6-digit reset code.
      </p>

      <form className="auth-form" onSubmit={onSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <label className="auth-field">
          <span className="auth-label">Email address</span>
          <input
            className="auth-input"
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <button className="mc-btn w-full" type="submit" disabled={loading}>
          {loading ? <Loader2 size={17} className="animate-spin" /> : <Mail size={17} />}
          {loading ? "Sending..." : "Send reset code"}
        </button>

        <p className="auth-note text-center">
          Remembered it? <Link className="text-hfq-gold" href="/login">Back to sign in</Link>
        </p>
      </form>
    </>
  );
}
