"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Clipboard,
  Loader2,
  Save,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";

type Command = {
  id: string;
  name: string;
  command: string;
  server: string | null;
};

export function AdminOrderActions({
  orderNumber,
  status,
  demo,
  internalNote,
  commands,
}: {
  orderNumber: string;
  status: string;
  demo: boolean;
  internalNote: string | null;
  commands: Command[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState(internalNote ?? "");
  const [copied, setCopied] = useState("");

  const canReview = ["AWAITING_PAYMENT", "PROOF_UPLOADED", "UNDER_REVIEW"].includes(
    status,
  );
  const canDeliver = ["APPROVED", "DELIVERING"].includes(status);

  async function run(action: string, path: string, body?: unknown) {
    if (demo) {
      setError("Demo mode cannot change orders. Connect MySQL and disable DEMO_MODE.");
      return;
    }

    setBusy(action);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/admin/orders/${orderNumber}/${path}`, {
        method: path === "note" ? "PATCH" : "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "The action failed.");
        return;
      }
      setSuccess(
        action === "approve"
          ? "Payment approved."
          : action === "reject"
            ? "Receipt rejected."
            : action === "deliver"
              ? "Order marked delivered."
              : "Note saved.",
      );
      setRejecting(false);
      setReason("");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy("");
    }
  }

  async function copyCommand(command: string) {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(command);
      window.setTimeout(() => setCopied(""), 1500);
    } catch {
      setError("Clipboard is blocked. Select and copy the command manually.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}
      {demo && (
        <div className="panel-soft p-3 text-xs text-hfq-dim">
          Demo preview. Actions are disabled until the database is connected.
        </div>
      )}

      <div className="pay-card">
        <div className="panel-head !border-0 !p-0 !pb-3">
          <span className="panel-title">Review payment</span>
          <ShieldCheck size={16} className="text-hfq-gold" />
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="mc-btn w-full"
            disabled={demo || !canReview || busy !== ""}
            onClick={() => {
              if (
                window.confirm(
                  "Approve this payment? Only approve after checking the amount and receipt.",
                )
              ) {
                void run("approve", "approve");
              }
            }}
          >
            {busy === "approve" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Approve payment
          </button>

          {!rejecting ? (
            <button
              type="button"
              className="btn-ghost w-full justify-center"
              disabled={demo || !canReview || busy !== ""}
              onClick={() => setRejecting(true)}
            >
              <XCircle size={15} />
              Reject receipt
            </button>
          ) : (
            <div className="flex flex-col gap-2 border-2 border-ink bg-[rgba(11,4,6,0.45)] p-3">
              <label className="auth-field">
                <span className="auth-label">Rejection reason</span>
                <textarea
                  className="auth-input min-h-20"
                  value={reason}
                  maxLength={500}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Tell the customer what was wrong with the receipt."
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-ghost flex-1 justify-center"
                  onClick={() => {
                    setRejecting(false);
                    setReason("");
                  }}
                  disabled={busy !== ""}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="mc-btn mc-btn-sm flex-1"
                  disabled={demo || busy !== "" || reason.trim().length < 3}
                  onClick={() => void run("reject", "reject", { reason })}
                >
                  {busy === "reject" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <XCircle size={15} />
                  )}
                  Confirm reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pay-card">
        <div className="panel-head !border-0 !p-0 !pb-3">
          <span className="panel-title">Delivery</span>
          <Truck size={16} className="text-hfq-gold" />
        </div>

        <div className="flex flex-col gap-2">
          {commands.map((item) => (
            <div
              key={item.id}
              className="border-2 border-ink bg-[rgba(11,4,6,0.55)] p-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-xs text-hfq-text">
                  {item.name}
                </span>
                <span className="text-[10px] text-hfq-dim">
                  {item.server ?? "Manual"}
                </span>
              </div>
              <div className="mt-2 flex items-start gap-2">
                <code className="min-w-0 flex-1 break-all font-mono text-[11px] text-hfq-soft">
                  {item.command}
                </code>
                <button
                  type="button"
                  className="text-hfq-gold hover:text-hfq-text"
                  onClick={() => void copyCommand(item.command)}
                  aria-label="Copy command"
                >
                  {copied === item.command ? <Check size={14} /> : <Clipboard size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-hfq-dim">
          Run the command in your Minecraft console or panel, then mark the
          order delivered.
        </p>

        <button
          type="button"
          className="mc-btn mt-3 w-full"
          disabled={demo || !canDeliver || busy !== ""}
          onClick={() => {
            if (
              window.confirm(
                "Have you already run the delivery command in Minecraft? This will mark the order completed.",
              )
            ) {
              void run("deliver", "deliver");
            }
          }}
        >
          {busy === "deliver" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Truck size={16} />
          )}
          Mark delivered
        </button>
      </div>

      <div className="pay-card">
        <div className="panel-head !border-0 !p-0 !pb-3">
          <span className="panel-title">Internal note</span>
          <Save size={16} className="text-hfq-gold" />
        </div>
        <textarea
          className="auth-input min-h-24"
          value={note}
          maxLength={2000}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Only staff can see this."
        />
        <button
          type="button"
          className="btn-ghost mt-2 w-full justify-center"
          disabled={demo || busy !== ""}
          onClick={() => void run("note", "note", { note })}
        >
          {busy === "note" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          Save note
        </button>
      </div>
    </div>
  );
}
