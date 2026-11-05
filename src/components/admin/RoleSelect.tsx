"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

const ROLES = [
  { value: "CUSTOMER", label: "Player" },
  { value: "SUPPORT", label: "Support" },
  { value: "STAFF", label: "Staff" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
] as const;

export function RoleSelect({
  publicId,
  role,
  demo,
  locked,
  canAssignSuper,
  reason,
}: {
  publicId: string;
  role: string;
  demo: boolean;
  locked?: boolean;
  canAssignSuper: boolean;
  reason?: string;
}) {
  const [value, setValue] = useState(role);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const options = canAssignSuper
    ? ROLES
    : ROLES.filter((item) => item.value !== "SUPER_ADMIN");

  async function change(next: string) {
    if (next === value) return;

    if (
      value !== "CUSTOMER" &&
      next === "CUSTOMER" &&
      !window.confirm(
        `Demote this user to Player? Their sessions will be signed out.`,
      )
    ) {
      return;
    }

    const previous = value;
    setValue(next);
    setBusy(true);
    setError("");
    setSaved(false);

    try {
      const response = await fetch(`/api/admin/users/${publicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setValue(previous);
        setError(data.error ?? "Could not change the role.");
        return;
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch {
      setValue(previous);
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (demo || locked) {
    return (
      <span className="badge badge-dim" title={reason}>
        {ROLES.find((item) => item.value === value)?.label ?? value}
        {locked && reason ? " · locked" : ""}
      </span>
    );
  }

  return (
    <div className="min-w-[150px]">
      <div className="flex items-center gap-2">
        <select
          className="auth-input !py-1.5 text-xs"
          value={value}
          disabled={busy}
          onChange={(event) => change(event.target.value)}
          aria-label="User role"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {busy && <Loader2 size={14} className="shrink-0 animate-spin text-hfq-gold" />}
        {saved && <Check size={14} className="shrink-0 text-hfq-green" />}
      </div>
      {error && <p className="mt-1 text-[11px] text-hfq-red">{error}</p>}
    </div>
  );
}
