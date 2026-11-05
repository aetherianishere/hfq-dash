"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

export function ResetPasswordForm({ initialEmail }: { initialEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not reset your password.");
        return;
      }
      router.push(data.redirectTo ?? "/login?reset=1");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="auth-title">Choose a new password</h1>
      <p className="auth-sub">
        Enter the reset code from your email and a new password for your
        account.
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
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">Reset code</span>
          <input
            className="auth-input mono tracking-[0.25em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">New password</span>
          <span className="relative block">
            <input
              className="auth-input pr-11"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-hfq-dim hover:text-hfq-gold"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </label>

        <label className="auth-field">
          <span className="auth-label">Confirm new password</span>
          <input
            className="auth-input"
            type={showPassword ? "text" : "password"}
            name="confirm"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            placeholder="Repeat your password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </label>

        <button className="mc-btn w-full" type="submit" disabled={loading}>
          {loading ? <Loader2 size={17} className="animate-spin" /> : <KeyRound size={17} />}
          {loading ? "Saving..." : "Reset password"}
        </button>

        <p className="auth-note text-center">
          Need a new code?{" "}
          <Link className="text-hfq-gold" href="/forgot-password">
            Request another
          </Link>
        </p>
      </form>
    </>
  );
}
