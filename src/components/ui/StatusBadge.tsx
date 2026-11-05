const MAP: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "badge-dim" },
  AWAITING_PAYMENT: { label: "Awaiting payment", className: "badge-gold" },
  PROOF_UPLOADED: { label: "Receipt uploaded", className: "badge-gold" },
  UNDER_REVIEW: { label: "Under review", className: "badge-gold" },
  APPROVED: { label: "Approved", className: "badge-green" },
  DELIVERING: { label: "Delivering", className: "badge-gold" },
  COMPLETED: { label: "Completed", className: "badge-green" },
  REJECTED: { label: "Rejected", className: "badge-red" },
  CANCELLED: { label: "Cancelled", className: "badge-dim" },
  EXPIRED: { label: "Expired", className: "badge-dim" },
  REFUNDED: { label: "Refunded", className: "badge-dim" },
  PENDING: { label: "Pending", className: "badge-gold" },
};

export function StatusBadge({ status }: { status: string }) {
  const value = MAP[status] ?? { label: status, className: "badge-dim" };
  return <span className={`badge ${value.className}`}>{value.label}</span>;
}
