"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { Viewer } from "@/lib/auth/types";

const STEPS = ["Player", "About you", "Finish"];

export function SetupWizard({
  viewer,
  next,
}: {
  viewer: Viewer;
  next: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState(
    viewer.profile?.minecraftUsername ?? "",
  );
  const [displayName, setDisplayName] = useState(
    viewer.profile?.displayName ?? viewer.profile?.firstName ?? "",
  );
  const [birthday, setBirthday] = useState(viewer.profile?.birthday ?? "");
  const [country, setCountry] = useState(viewer.profile?.country ?? "Sri Lanka");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const avatar = `https://mc-heads.net/avatar/${encodeURIComponent(
    username || "Steve",
  )}/160`;

  function validate() {
    if (step === 0) {
      if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {
        return "Enter your Minecraft username (3–16 letters, numbers, or underscores).";
      }
      if (displayName.trim().length < 2) {
        return "Enter a display name.";
      }
    }
    if (step === 1) {
      if (!birthday) return "Add your birthday.";
      if (country.trim().length < 2) return "Add your country.";
    }
    return "";
  }

  function goNext() {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setStep((value) => Math.min(value + 1, 2));
  }

  async function finish() {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError("");

    if (viewer.isDemo) {
      router.push(next || `/u/${viewer.publicId}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minecraftUsername: username,
          displayName,
          birthday,
          country,
          avatarUrl: avatar,
          completeSetup: true,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not save your profile.");
        return;
      }
      router.push(next || data.redirectTo || `/u/${viewer.publicId}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="page-head">
        <div>
          <p className="section-label">SETUP</p>
          <h1 className="page-title mt-2">Build your player profile</h1>
          <p className="page-sub">
            Three quick steps before you head into the store.
          </p>
        </div>
        <span className="status-pill">
          <span className="status-dot is-on" />
          Step {step + 1} of 3
        </span>
      </div>

      <div className="mb-5 flex gap-2">
        {STEPS.map((label, index) => (
          <div key={label} className="flex-1">
            <div
              className={`h-2 border-2 border-ink ${
                index <= step ? "bg-hfq-red" : "bg-panel"
              }`}
            />
            <div
              className={`mt-2 font-display text-[10px] uppercase tracking-wider ${
                index <= step ? "text-hfq-gold" : "text-hfq-dim"
              }`}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="panel p-5">
        {error && <div className="auth-error mb-4">{error}</div>}

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <img
                className="h-20 w-20 border-4 border-ink bg-bg p-1"
                src={avatar}
                alt="Minecraft head preview"
              />
              <div>
                <h2 className="font-display text-xl text-hfq-text">
                  Who are you in-game?
                </h2>
                <p className="mt-1 text-sm text-hfq-soft">
                  We use this to deliver ranks, keys, and shards to the right
                  player.
                </p>
              </div>
            </div>

            <label className="auth-field">
              <span className="auth-label">Minecraft username</span>
              <input
                className="auth-input"
                placeholder="HFQ_Player"
                value={username}
                maxLength={16}
                onChange={(event) => setUsername(event.target.value)}
              />
              <span className="auth-note">
                Java Edition username. Case-sensitive is fine.
              </span>
            </label>

            <label className="auth-field">
              <span className="auth-label">Display name</span>
              <input
                className="auth-input"
                placeholder="How should we call you?"
                value={displayName}
                maxLength={32}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-display text-xl text-hfq-text">
                A little about you
              </h2>
              <p className="mt-1 text-sm text-hfq-soft">
                Your birthday unlocks birthday perks. We never show it publicly.
              </p>
            </div>

            <label className="auth-field">
              <span className="auth-label">Birthday</span>
              <input
                className="auth-input"
                type="date"
                value={birthday}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setBirthday(event.target.value)}
              />
            </label>

            <label className="auth-field">
              <span className="auth-label">Country</span>
              <input
                className="auth-input"
                placeholder="Sri Lanka"
                value={country}
                maxLength={56}
                onChange={(event) => setCountry(event.target.value)}
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <img
                className="h-28 w-28 border-4 border-ink bg-bg p-1"
                src={avatar}
                alt="Profile preview"
              />
              <span className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center border-[3px] border-ink bg-hfq-gold">
                <Sparkles size={15} className="text-ink" />
              </span>
            </div>
            <div>
              <h2 className="font-display text-2xl text-hfq-text">
                {displayName || "HFQ Player"}
              </h2>
              <p className="mono mt-1 text-xs text-hfq-gold">
                {username || "username"}
              </p>
            </div>
            <div className="grid w-full gap-2 text-left sm:grid-cols-2">
              <div className="slot p-3">
                <div className="kpi-label">Birthday</div>
                <div className="mt-1 text-sm">{birthday || "—"}</div>
              </div>
              <div className="slot p-3">
                <div className="kpi-label">Country</div>
                <div className="mt-1 text-sm">{country || "—"}</div>
              </div>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-hfq-dim">
              Your Minecraft head is used as your profile picture for now. You
              can upload a custom picture later in Settings.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            disabled={step === 0 || loading}
          >
            <ArrowLeft size={14} />
            Back
          </button>

          {step < 2 ? (
            <button type="button" className="mc-btn" onClick={goNext}>
              Continue
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="mc-btn"
              onClick={finish}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Check size={15} />
              )}
              {loading ? "Saving..." : "Finish setup"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
