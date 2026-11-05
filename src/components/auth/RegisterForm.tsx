"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength =
    password.length >= 12 && /[A-Z]/.test(password) && /\d/.test(password)
      ? "strong"
      : password.length >= 8
        ? "fair"
        : password.length > 0
          ? "weak"
          : "";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!agree) {
      setError("Please accept the store rules to continue.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not create your account.");
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
      <h1 className="auth-title">Create your account</h1>
      <p className="auth-sub">
        One account for the store, your orders, and your HFQ profile.
      </p>

      <form className="auth-form" onSubmit={onSubmit}>
        {error && <div className="auth-error">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <label className="auth-field">
            <span className="auth-label">First name</span>
            <input
              className="auth-input"
              required
              minLength={2}
              maxLength={40}
              autoComplete="given-name"
              placeholder="Your first name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </label>
          <label className="auth-field">
            <span className="auth-label">Last name</span>
            <input
              className="auth-input"
              required
              minLength={2}
              maxLength={40}
              autoComplete="family-name"
              placeholder="Your last name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </label>
        </div>

        <label className="auth-field">
          <span className="auth-label">Email address</span>
          <input
            className="auth-input"
            type="email"
            required
            autoComplete="email"
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
              required
              minLength={8}
              autoComplete="new-password"
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
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </span>
          {strength && (
            <span className="flex items-center gap-2 text-[11px] text-hfq-dim">
              <span
                className={`h-1.5 flex-1 ${
                  strength === "strong"
                    ? "bg-hfq-green"
                    : strength === "fair"
                      ? "bg-hfq-gold"
                      : "bg-hfq-red"
                }`}
              />
              {strength} password
            </span>
          )}
        </label>

        <label className="auth-field">
          <span className="auth-label">Confirm password</span>
          <input
            className="auth-input"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </label>

        <label className="flex items-start gap-2 text-xs leading-relaxed text-hfq-soft">
          <input
            type="checkbox"
            checked={agree}
            onChange={(event) => setAgree(event.target.checked)}
            className="mt-0.5 accent-[#ff3047]"
          />
          <span>
            I agree to the{" "}
            <a className="text-hfq-gold" href="https://hfqmc.xyz/rules" target="_blank" rel="noreferrer">
              server rules
            </a>{" "}
            and understand that purchases are reviewed manually before delivery.
          </span>
        </label>

        <button className="mc-btn w-full" type="submit" disabled={loading}>
          {loading ? (
            <Loader2 size={19} className="animate-spin" />
          ) : (
            <UserPlus size={19} />
          )}
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="auth-alt">
        Already have an account?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
