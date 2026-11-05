"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileCheck2, Loader2, Upload } from "lucide-react";

const MAX_MB = 10;
const ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";

export function ReceiptUpload({
  orderNumber,
  disabled,
}: {
  orderNumber: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!file) {
      setError("Choose a screenshot or PDF first.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File must be ${MAX_MB}MB or smaller.`);
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(`/api/orders/${orderNumber}/proof`, {
        method: "POST",
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not upload the receipt.");
        return;
      }
      setDone(true);
      setFile(null);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (disabled) {
    return (
      <div className="panel-soft p-4 text-sm text-hfq-dim">
        Receipt upload is disabled for this order. If you think this is a
        mistake, contact support.
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      {error && <div className="auth-error">{error}</div>}
      {done && (
        <div className="auth-success">
          Receipt uploaded. Staff will review it shortly.
        </div>
      )}

      <button
        type="button"
        className="flex min-h-32 flex-col items-center justify-center gap-2 border-4 border-dashed border-ink bg-[rgba(11,4,6,0.45)] p-4 text-center transition-colors hover:border-hfq-gold"
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={22} className="text-hfq-gold" />
        <span className="font-display text-sm text-hfq-text">
          {file ? file.name : "Choose screenshot or PDF"}
        </span>
        <span className="text-[11px] text-hfq-dim">
          PNG, JPG, WEBP or PDF · max {MAX_MB}MB
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          setError("");
          setDone(false);
          setFile(event.target.files?.[0] ?? null);
        }}
      />

      <button className="mc-btn" type="submit" disabled={loading || !file}>
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <FileCheck2 size={16} />
        )}
        {loading ? "Uploading..." : "Upload receipt"}
      </button>
    </form>
  );
}
