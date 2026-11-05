"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";

export type PaymentAccountFormData = {
  id?: string;
  method: string;
  label: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  instructions: string;
  active: boolean;
  sortOrder: number;
};

const EMPTY: PaymentAccountFormData = {
  method: "BANK",
  label: "",
  accountName: "",
  accountNumber: "",
  bankName: "",
  branch: "",
  instructions: "",
  active: true,
  sortOrder: 0,
};

export function PaymentAccountForm({
  initial,
  demo,
}: {
  initial?: PaymentAccountFormData;
  demo: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<PaymentAccountFormData>(initial ?? EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof PaymentAccountFormData>(
    key: K,
    value: PaymentAccountFormData[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (demo) {
      setError("Demo mode cannot save payment accounts. Connect MySQL first.");
      return;
    }

    setBusy(true);
    try {
      const editing = Boolean(form.id);
      const response = await fetch(
        editing
          ? `/api/admin/payment-accounts/${form.id}`
          : "/api/admin/payment-accounts",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, active: form.active ? "true" : "false" }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not save the payment account.");
        return;
      }

      router.push("/admin/payment-accounts");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="pay-card flex flex-col gap-3" onSubmit={onSubmit}>
      {error && <div className="auth-error">{error}</div>}
      {demo && (
        <div className="auth-error">
          Demo preview. Saving is disabled until MySQL is connected.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="auth-field">
          <span className="auth-label">Method</span>
          <select
            className="auth-input"
            value={form.method}
            onChange={(event) => set("method", event.target.value)}
          >
            <option value="BANK">Bank transfer</option>
            <option value="EZCASH">Dialog eZ Cash</option>
          </select>
        </label>

        <label className="auth-field">
          <span className="auth-label">Label</span>
          <input
            className="auth-input"
            value={form.label}
            onChange={(event) => set("label", event.target.value)}
            maxLength={60}
            placeholder="Main bank account"
            required
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">Account name</span>
          <input
            className="auth-input"
            value={form.accountName}
            onChange={(event) => set("accountName", event.target.value)}
            maxLength={120}
            placeholder="HFQ Network"
            required
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">Account number</span>
          <input
            className="auth-input"
            value={form.accountNumber}
            onChange={(event) => set("accountNumber", event.target.value)}
            maxLength={120}
            placeholder="0123456789"
            required
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">Bank name</span>
          <input
            className="auth-input"
            value={form.bankName}
            onChange={(event) => set("bankName", event.target.value)}
            maxLength={120}
            placeholder="Commercial Bank"
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">Branch</span>
          <input
            className="auth-input"
            value={form.branch}
            onChange={(event) => set("branch", event.target.value)}
            maxLength={120}
            placeholder="Colombo"
          />
        </label>

        <label className="auth-field sm:col-span-2">
          <span className="auth-label">Instructions</span>
          <textarea
            className="auth-input min-h-20"
            value={form.instructions}
            onChange={(event) => set("instructions", event.target.value)}
            maxLength={1000}
            placeholder="Use your order reference as the transfer note. Send the receipt after paying."
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">Sort order</span>
          <input
            className="auth-input"
            type="number"
            min={0}
            max={10000}
            value={form.sortOrder}
            onChange={(event) => set("sortOrder", Number(event.target.value))}
          />
        </label>

        <label className="flex items-center gap-2 pt-5 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => set("active", event.target.checked)}
          />
          Active on checkout
        </label>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="mc-btn" disabled={busy || demo}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {form.id ? "Save account" : "Add account"}
        </button>
        {form.id && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => router.push("/admin/payment-accounts")}
          >
            Cancel edit
          </button>
        )}
      </div>
    </form>
  );
}
