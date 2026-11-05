"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, Landmark, Loader2, Lock, ShoppingBag, Smartphone } from "lucide-react";

export function CheckoutForm({
  productSlug,
  productName,
  priceLabel,
  defaultMinecraftUsername,
  demo,
  availableMethods,
}: {
  productSlug: string;
  productName: string;
  priceLabel: string;
  defaultMinecraftUsername: string;
  demo: boolean;
  availableMethods: Array<"BANK" | "EZCASH">;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<"EZCASH" | "BANK">(
    availableMethods[0] ?? "BANK",
  );
  const [username, setUsername] = useState(defaultMinecraftUsername);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (demo) {
      setError("Demo mode cannot create real orders. Connect MySQL and disable DEMO_MODE.");
      return;
    }
    if (!/^[A-Za-z0-9_]{3,16}$/.test(username.trim())) {
      setError("Enter a valid Minecraft username.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug,
          paymentMethod: method,
          minecraftUsername: username.trim(),
          customerNote: note.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not create the order.");
        return;
      }
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      {error && <div className="auth-error">{error}</div>}
      {demo && (
        <div className="auth-error">
          Demo preview. Checkout is disabled until the database is connected.
        </div>
      )}

      <div className="pay-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="kpi-label">You are buying</p>
            <p className="mt-1 font-display text-xl text-hfq-text">{productName}</p>
          </div>
          <p className="font-display text-xl text-hfq-gold">{priceLabel}</p>
        </div>
      </div>

      <div className="pay-card">
        <p className="panel-title">Payment method</p>
        {availableMethods.length === 0 && (
          <p className="auth-error mt-3">
            Payments are not configured yet. Contact support before placing an
            order.
          </p>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            {
              id: "BANK" as const,
              label: "Bank transfer",
              note: "Transfer from any Sri Lankan bank",
              icon: <Landmark size={18} />,
            },
            {
              id: "EZCASH" as const,
              label: "Dialog eZ Cash",
              note: "Send from your eZ Cash wallet",
              icon: <Smartphone size={18} />,
            },
          ]
            .filter((option) => availableMethods.includes(option.id))
            .map((option) => (
              <button
                key={option.id}
                type="button"
                className={`flex items-center gap-3 border-[3px] border-ink p-3 text-left transition-colors ${
                  method === option.id
                    ? "bg-hfq-red text-white"
                    : "bg-[rgba(11,4,6,0.45)] text-hfq-soft hover:bg-panel"
                }`}
                onClick={() => setMethod(option.id)}
                aria-pressed={method === option.id}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center border-2 border-ink bg-bg text-hfq-gold">
                  {option.icon}
                </span>
                <span>
                  <span className="block font-display text-sm">{option.label}</span>
                  <span className="block text-[10px] opacity-80">{option.note}</span>
                </span>
              </button>
            ))}
        </div>
      </div>

      <div className="pay-card">
        <p className="panel-title">Delivery details</p>
        <div className="mt-3 flex flex-col gap-3">
          <label className="auth-field">
            <span className="auth-label">Minecraft username</span>
            <input
              className="auth-input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={16}
              placeholder="Steve"
              required
            />
            <span className="text-[10px] text-hfq-dim">
              This is the exact player who will receive the rank, key, or shards.
            </span>
          </label>

          <label className="auth-field">
            <span className="auth-label">Note to staff (optional)</span>
            <textarea
              className="auth-input min-h-20"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              placeholder="Anything we should know before delivery?"
            />
          </label>
        </div>
      </div>

      <div className="panel-soft p-3 text-xs text-hfq-dim">
        <p className="flex items-center gap-2 font-display text-sm text-hfq-soft">
          <Lock size={14} className="text-hfq-gold" />
          Manual payment review
        </p>
        <p className="mt-1">
          After you create the order, you will see the bank or eZ Cash details and
          a payment reference. Pay, then upload a screenshot or PDF receipt.
        </p>
      </div>

      <button type="submit" className="mc-btn w-full" disabled={busy || demo}>
        {busy ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <ShoppingBag size={16} />
        )}
        {busy ? "Creating order..." : "Continue to payment"}
      </button>

      <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-hfq-dim">
        <span className="flex items-center gap-1">
          <Banknote size={12} /> No card needed
        </span>
        <span>Receipt uploaded securely</span>
        <span>Staff-reviewed delivery</span>
      </div>
    </form>
  );
}
