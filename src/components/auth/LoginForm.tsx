"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          totp: totp || undefined,
          next,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.code === "TOTP_REQUIRED" || data.code === "TOTP_INVALID") {
          setNeedsTotp(true);
        }
        setError(data.error ?? "Could not sign in. Check your details.");
        return;
      }
      router.push(data.redirectTo ?? "/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Welcome back</h1>
      <p className="auth-sub">
        Sign in to manage your orders and store purchases.
      </p>

      <form className="auth-form" onSubmit={onSubmit}>
        {notice && <div className="auth-success">{notice}</div>}
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

        <label className="auth-field">
          <span className="auth-label">Password</span>
          <span className="relative block">
            <input
              className="auth-input pr-14"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              required
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-hfq-dim hover:text-hfq-gold"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </span>
          <span className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-hfq-gold font-semibold">
              Forgot password?
            </Link>
          </span>
        </label>

        {needsTotp && (
          <label className="auth-field">
            <span className="auth-label">Authentication code</span>
            <input
              className="auth-input mono tracking-[0.25em] text-center"
              type="text"
              name="totp"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
              placeholder="123456"
              value={totp}
              onChange={(event) => setTotp(event.target.value)}
            />
            <span className="text-xs text-hfq-dim text-center">
              Use your authenticator app, or one of your recovery codes.
            </span>
          </label>
        )}

        <button className="mc-btn w-full" type="submit" disabled={loading}>
          {loading ? (
            <Loader2 size={19} className="animate-spin" />
          ) : (
            <LogIn size={19} />
          )}
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="auth-note text-center">
          Trouble signing in? Email{" "}
          <a className="text-hfq-gold font-semibold" href="mailto:support@hfqmc.xyz">
            support@hfqmc.xyz
          </a>
        </p>
      </form>

      <p className="auth-alt">
        New to HFQ?{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}>
          Create an account
        </Link>
      </p>
    </div>
  );
}
