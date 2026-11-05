import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Clock, FileText, X, User } from "lucide-react";
import { ReceiptUpload } from "@/components/orders/ReceiptUpload";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getViewer } from "@/lib/auth/viewer";
import { demoOrders } from "@/data/demo";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/utils";

type Params = { publicId: string; orderNumber: string };

export const metadata: Metadata = { title: "Order" };

const PAYABLE = ["AWAITING_PAYMENT", "REJECTED", "PROOF_UPLOADED"];

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { publicId, orderNumber } = await params;
  const viewer = await getViewer(publicId);
  const base = `/u/${viewer.publicId}`;

  if (viewer.isDemo) {
    const order = demoOrders.find((row) => row.orderNumber === orderNumber);
    if (!order) notFound();

    return (
      <div className="mx-auto max-w-3xl">
        <Link
          href={`${base}/orders`}
          className="mb-6 inline-flex items-center gap-2 font-display text-sm text-hfq-soft hover:text-hfq-gold"
        >
          <ArrowLeft size={15} />
          Back to orders
        </Link>

        <div className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="mono text-xs text-hfq-dim">{order.orderNumber}</p>
              <h1 className="mt-1 font-display text-2xl text-hfq-text">
                {order.itemsLabel}
              </h1>
              <p className="mt-1 text-sm text-hfq-soft">
                Placed {order.createdAtLabel}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="slot p-3">
              <div className="kpi-label">Total</div>
              <div className="mt-1 font-display text-xl">{order.totalLabel}</div>
            </div>
            <div className="slot p-3">
              <div className="kpi-label">Delivery</div>
              <div className="mt-1 text-sm text-hfq-soft">
                Manual review · in-game delivery
              </div>
            </div>
          </div>

          <div className="mt-5 border-[3px] border-ink bg-[rgba(11,4,6,0.45)] p-4 text-sm text-hfq-dim">
            This is demo order data. Sign in with a real account to upload a
            receipt and track a live order.
          </div>
        </div>
      </div>
    );
  }

  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: viewer.id },
    include: {
      items: true,
      proofs: { orderBy: { createdAt: "desc" } },
      paymentAccount: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) notFound();

  const canUpload = PAYABLE.includes(order.status);
  const isRejected = order.status === "REJECTED";

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`${base}/orders`}
        className="mb-6 inline-flex items-center gap-2 font-display text-sm text-hfq-soft hover:text-hfq-gold"
      >
        <ArrowLeft size={15} />
        Back to orders
      </Link>

      <div className="page-head">
        <div>
          <p className="mono text-xs text-hfq-dim">{order.orderNumber}</p>
          <h1 className="page-title mt-1">
            {order.items.map((item) => item.nameSnapshot).join(", ") || "Order"}
          </h1>
          <p className="page-sub">
            Placed {order.createdAt.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="table-panel mb-5">
        <div className="panel-head">
          <span className="panel-title">Player</span>
          <User size={16} className="text-hfq-gold" />
        </div>
        <div className="flex items-center gap-4 p-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center border-[4px] border-ink bg-[rgba(11,4,6,0.5)]">
            <img
              src={`https://mc-heads.net/avatar/${encodeURIComponent(order.minecraftUsername)}/128`}
              alt={`${order.minecraftUsername}'s skin`}
              className="h-full w-full object-contain"
              onError={(event) => {
                (event.target as HTMLImageElement).src = "/images/logo.png";
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="font-display text-xl text-hfq-text">
              {order.minecraftUsername}
            </p>
            <p className="text-xs text-hfq-dim mono">
              This is the player who will receive the rank, key, or shards.
            </p>
          </div>
        </div>
      </div>

      {isRejected && order.rejectionReason && (
        <div className="auth-error mb-5">
          <strong>Payment rejected:</strong> {order.rejectionReason}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-5">
          <div className="table-panel">
            <div className="panel-head">
              <span className="panel-title">Items</span>
              <span className="mono text-xs text-hfq-dim">
                {formatMoney(order.totalMinor, order.currency)}
              </span>
            </div>
            <table className="data-table">
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nameSnapshot}</td>
                    <td className="mono text-right">
                      {formatMoney(item.priceMinor, order.currency)}
                    </td>
                  </tr>
                ))}
                {Number(order.discountMinor) > 0 && (
                  <tr>
                    <td>Discount</td>
                    <td className="mono text-right text-hfq-green">
                      -{formatMoney(order.discountMinor, order.currency)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="font-display text-hfq-text">Total</td>
                  <td className="mono text-right font-display text-hfq-gold">
                    {formatMoney(order.totalMinor, order.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="table-panel">
            <div className="panel-head">
              <span className="panel-title">Timeline</span>
            </div>
            <div className="flex flex-col gap-3 p-4 text-sm">
              {order.events.length === 0 && (
                <p className="text-hfq-dim">
                  Order created. Waiting for the next update.
                </p>
              )}
              {order.events.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center border-2 border-ink bg-panel-strong">
                    <Clock size={12} className="text-hfq-gold" />
                  </span>
                  <div>
                    <p className="font-display text-sm text-hfq-text">
                      {event.type.replaceAll("_", " ")}
                    </p>
                    <p className="text-xs text-hfq-dim">
                      {event.createdAt.toLocaleString("en-GB")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="pay-card">
            <div className="pay-brand">
              <div className="pay-brand-icon">
                {order.paymentMethod === "EZCASH" ? "eZ" : "BK"}
              </div>
              <div>
                <div className="pay-brand-name">
                  {order.paymentMethod === "EZCASH"
                    ? "Dialog eZ Cash"
                    : "Bank transfer"}
                </div>
                <div className="pay-brand-sub">Payment reference</div>
              </div>
            </div>

            <div className="reference-box mt-4">
              <span className="kpi-label">Use this reference</span>
              <b>{order.paymentReference}</b>
            </div>

            {order.paymentAccount ? (
              <div className="mt-4 flex flex-col gap-2">
                <div className="copy-field">
                  <div>
                    <div className="copy-field-label">Account name</div>
                    <div className="copy-field-value">
                      {order.paymentAccount.accountName}
                    </div>
                  </div>
                </div>
                <div className="copy-field">
                  <div>
                    <div className="copy-field-label">Account number</div>
                    <div className="copy-field-value">
                      {order.paymentAccount.accountNumber}
                    </div>
                  </div>
                </div>
                {order.paymentAccount.bankName && (
                  <div className="copy-field">
                    <div>
                      <div className="copy-field-label">Bank</div>
                      <div className="copy-field-value">
                        {order.paymentAccount.bankName}
                      </div>
                    </div>
                  </div>
                )}
                {order.paymentAccount.instructions && (
                  <p className="text-xs leading-relaxed text-hfq-dim">
                    {order.paymentAccount.instructions}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-xs leading-relaxed text-hfq-dim">
                Payment account details are being configured. Contact support
                with your order number before paying.
              </p>
            )}
          </div>

          <div className="pay-card">
            <div className="panel-head !border-0 !p-0 !pb-3">
              <span className="panel-title">Receipt</span>
              <FileText size={16} className="text-hfq-gold" />
            </div>

            {order.proofs.length > 0 && (
              <div className="mb-4 flex flex-col gap-2">
                {order.proofs.map((proof) => (
                  <div
                    key={proof.id}
                    className="flex items-center justify-between gap-3 border-2 border-ink bg-[rgba(11,4,6,0.45)] p-2 text-xs"
                  >
                    <a
                      href={`/api/proofs/${proof.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-hfq-gold hover:text-hfq-text"
                    >
                      {proof.originalName}
                    </a>
                    <span className="flex items-center gap-1">
                      {proof.status === "APPROVED" ? (
                        <Check size={13} className="text-hfq-green" />
                      ) : proof.status === "REJECTED" ? (
                        <X size={13} className="text-hfq-red" />
                      ) : (
                        <Clock size={13} className="text-hfq-gold" />
                      )}
                      {proof.status.toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <ReceiptUpload
              orderNumber={order.orderNumber}
              disabled={!canUpload}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
