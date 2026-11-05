"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

type Setup = { secret: string; uri: string };

export function TotpPanel({
  enabled,
  demo,
  required = false,
}: {
  enabled: boolean;
  demo: boolean;
  required?: boolean;
}) {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState("");

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(""), 1500);
    } catch {
      setError("Could not copy. Select the text manually.");
    }
  }

  async function startSetup() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/totp/setup", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not start two-factor setup.");
        return;
      }
      setSetup({ secret: data.secret, uri: data.uri });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function enable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/totp/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not enable two-factor authentication.");
        return;
      }
      setRecoveryCodes(data.recoveryCodes ?? []);
      setSetup(null);
      setCode("");
      setIsEnabled(true);
      setNotice("Two-factor authentication is on.");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function disable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/totp/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not disable two-factor authentication.");
        return;
      }
      setDisableCode("");
      setIsEnabled(false);
      setNotice("Two-factor authentication is off.");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (recoveryCodes.length > 0) {
    return (
      <div className="border-t-2 border-ink pt-4">
        <p className="font-display text-sm text-hfq-text">
          Save your recovery codes
        </p>
        <p className="mt-1 text-xs text-hfq-dim">
          Each code works once if you lose access to your authenticator app.
          They will not be shown again.
        </p>
        <div className="mt-3 grid gap-1 sm:grid-cols-2">
          {recoveryCodes.map((recoveryCode) => (
            <code
              key={recoveryCode}
              className="slot mono px-3 py-2 text-center text-xs tracking-[0.12em] text-hfq-gold"
            >
              {recoveryCode}
            </code>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => copy(recoveryCodes.join("\n"), "all")}
          >
            {copied === "all" ? <Check size={14} /> : <Copy size={14} />}
            {copied === "all" ? "Copied" : "Copy all"}
          </button>
          {required && (
            <Link href="/admin" className="mc-btn">
              Continue to admin
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t-2 border-ink pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-sm text-hfq-text">
            Two-factor authentication
          </p>
          <p className="text-xs text-hfq-dim">
            {isEnabled
              ? "Your account is protected with an authenticator app."
              : "Required for staff and admins before they can review orders."}
          </p>
        </div>
        {isEnabled ? (
          <span className="badge badge-green">
            <ShieldCheck size={12} /> On
          </span>
        ) : (
          <span className="badge badge-dim">
            <ShieldOff size={12} /> Off
          </span>
        )}
      </div>

      {required && !isEnabled && (
        <p className="mt-3 border-l-4 border-hfq-gold bg-hfq-gold/10 px-3 py-2 text-xs text-hfq-soft">
          Staff access is locked until you turn on two-factor authentication.
        </p>
      )}

      {demo && (
        <p className="mt-3 text-xs text-hfq-gold">
          Two-factor changes are disabled in demo mode.
        </p>
      )}

      {notice && <p className="mt-3 text-xs text-hfq-green">{notice}</p>}
      {error && <p className="mt-3 text-xs text-hfq-red">{error}</p>}

      {!demo && !isEnabled && !setup && (
        <button
          type="button"
          className="mc-btn mt-3"
          onClick={startSetup}
          disabled={busy}
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
          Set up two-factor
        </button>
      )}

      {!demo && !isEnabled && setup && (
        <div className="mt-4 border-2 border-ink bg-black/20 p-4">
          <p className="text-xs text-hfq-soft">
            1. Add this secret to your authenticator app (Google Authenticator,
            Authy, 1Password, etc.).
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="mono flex-1 break-all border-2 border-ink bg-ink px-3 py-2 text-xs text-hfq-gold">
              {setup.secret}
            </code>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => copy(setup.secret, "secret")}
            >
              {copied === "secret" ? <Check size={14} /> : <Copy size={14} />}
              {copied === "secret" ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-3 break-all text-[11px] text-hfq-dim">
            Or open in your authenticator:{" "}
            <a className="text-hfq-gold" href={setup.uri}>
              {setup.uri}
            </a>
          </p>

          <form onSubmit={enable} className="mt-4 flex flex-wrap items-end gap-2">
            <label className="auth-field flex-1">
              <span className="auth-label">2. Enter the 6-digit code</span>
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
            <button type="submit" className="mc-btn" disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
              Turn on
            </button>
          </form>
        </div>
      )}

      {!demo && isEnabled && (
        <form onSubmit={disable} className="mt-3 flex flex-wrap items-end gap-2">
          <label className="auth-field flex-1">
            <span className="auth-label">Code to disable</span>
            <input
              className="auth-input mono tracking-[0.2em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="123456 or recovery code"
              value={disableCode}
              onChange={(event) => setDisableCode(event.target.value)}
            />
          </label>
          <button type="submit" className="btn-ghost" disabled={busy}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />}
            Disable
          </button>
        </form>
      )}
    </div>
  );
}
