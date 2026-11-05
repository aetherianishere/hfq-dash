"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, Loader2 } from "lucide-react";

export function ArchiveProductButton({
  id,
  name,
  demo,
}: {
  id: string;
  name: string;
  demo: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function archive() {
    if (!window.confirm(`Archive "${name}"? It will disappear from the store.`)) {
      return;
    }
    if (demo) {
      setError("Demo mode cannot archive products.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Could not archive the product.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        className="btn-ghost"
        onClick={() => void archive()}
        disabled={busy || demo}
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Archive size={13} />}
        Archive
      </button>
      {error && <span className="text-[10px] text-hfq-red">{error}</span>}
    </span>
  );
}
