import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Check,
  Clock,
  FileText,
  Mail,
  Package,
  User,
  X,
} from "lucide-react";
import { AdminOrderActions } from "@/components/admin/AdminOrderActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdminOrderDetail } from "@/lib/admin/data";
import { buildDeliveryCommand } from "@/lib/orders";
import { formatMoney } from "@/lib/utils";

type Params = { orderNumber: string };

export const metadata: Metadata = { title: "Order detail" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { orderNumber } = await params;
  const order = await getAdminOrderDetail(orderNumber);
  if (!order) notFound();

  const demo = process.env.DEMO_MODE === "1";
  const commands = order.items.map((item) => ({
    id: item.id,
    name: item.nameSnapshot,
    server: item.product.server?.name ?? null,
    command: buildDeliveryCommand(
      item.product.deliveryCommand,
      order.minecraftUsername,
      `MANUAL DELIVERY: give ${item.nameSnapshot} to ${order.minecraftUsername}`,
    ),
  }));

  const customerName =
    order.user.profile?.displayName ||
    [order.user.profile?.firstName, order.user.profile?.lastName]
      .filter(Boolean)
      .join(" ") ||
    order.user.email;

  return (
    <div>
      <Link
        href="/admin/orders"
        className="mb-5 inline-flex items-center gap-2 font-display text-sm text-hfq-soft hover:text-hfq-gold"
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
            Placed {order.createdAt.toLocaleString("en-GB")} · Reference{" "}
            <span className="mono">{order.paymentReference}</span>
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.rejectionReason && (
        <div className="auth-error mb-5">
          <strong>Rejected:</strong> {order.rejectionReason}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col gap-5">
          <div className="table-panel">
            <div className="panel-head">
              <span className="panel-title">Customer</span>
              <User size={16} className="text-hfq-gold" />
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="slot p-3">
                <div className="kpi-label">Account</div>
                <div className="mt-1 font-display text-sm text-hfq-text">
                  {customerName}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-hfq-dim">
                  <Mail size={12} /> {order.user.email}
                </div>
                <Link
                  href={`/u/${order.user.publicId}`}
                  className="mt-1 block font-mono text-[10px] text-hfq-gold hover:text-hfq-text"
                >
                  /u/{order.user.publicId}
                </Link>
              </div>
              <div className="slot p-3">
                <div className="kpi-label">Minecraft player</div>
                <div className="mt-1 font-display text-sm text-hfq-text">
                  {order.minecraftUsername}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-hfq-dim">
                  <img
                    src={`https://mc-heads.net/avatar/${encodeURIComponent(
                      order.minecraftUsername,
                    )}/48`}
                    alt=""
                    className="h-8 w-8 border-2 border-ink"
                  />
                  Deliver to this exact username.
                </div>
              </div>
              {order.customerNote && (
                <div className="slot p-3 sm:col-span-2">
                  <div className="kpi-label">Customer note</div>
                  <p className="mt-1 text-sm text-hfq-soft">{order.customerNote}</p>
                </div>
              )}
            </div>
          </div>

          <div className="table-panel">
            <div className="panel-head">
              <span className="panel-title">Order items</span>
              <span className="mono text-xs text-hfq-dim">
                {formatMoney(order.totalMinor, order.currency)}
              </span>
            </div>
            <table className="data-table">
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-hfq-gold" />
                        <span>{item.nameSnapshot}</span>
                      </div>
                      <div className="mt-0.5 text-[10px] text-hfq-dim">
                        {item.product.server?.name ?? "Manual delivery"}
                      </div>
                    </td>
                    <td className="mono text-right">
                      {formatMoney(item.priceMinor, order.currency)} × {item.quantity}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="font-display text-hfq-text">Total</td>
                  <td className="mono text-right font-display text-hfq-gold">
                    {formatMoney(order.totalMinor, order.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pay-card">
            <div className="panel-head !border-0 !p-0 !pb-3">
              <span className="panel-title">Payment</span>
              <Banknote size={16} className="text-hfq-gold" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="copy-field">
                <div>
                  <div className="copy-field-label">Method</div>
                  <div className="copy-field-value">
                    {order.paymentMethod === "EZCASH"
                      ? "Dialog eZ Cash"
                      : "Bank transfer"}
                  </div>
                </div>
              </div>
              <div className="copy-field">
                <div>
                  <div className="copy-field-label">Reference</div>
                  <div className="copy-field-value">
                    {order.paymentReference}
                  </div>
                </div>
              </div>
              {order.paymentAccount && (
                <>
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
                </>
              )}
            </div>
          </div>

          <div className="table-panel">
            <div className="panel-head">
              <span className="panel-title">Receipts</span>
              <FileText size={16} className="text-hfq-gold" />
            </div>
            {order.proofs.length === 0 ? (
              <div className="empty-state">
                <FileText size={24} className="text-hfq-dim" />
                <div>
                  <p className="font-display text-base text-hfq-text">
                    No receipt uploaded
                  </p>
                  <p className="mt-1 text-sm">
                    The customer has not uploaded proof of payment yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 p-4 sm:grid-cols-2">
                {order.proofs.map((proof) => (
                  <a
                    key={proof.id}
                    href={`/api/proofs/${proof.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="panel-soft overflow-hidden transition-transform hover:-translate-y-0.5"
                  >
                    {proof.mime.startsWith("image/") ? (
                      <img
                        src={`/api/proofs/${proof.id}`}
                        alt={proof.originalName}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-40 place-items-center bg-bg">
                        <FileText size={34} className="text-hfq-gold" />
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 border-t-2 border-ink p-2 text-xs">
                      <span className="truncate text-hfq-soft">
                        {proof.originalName}
                      </span>
                      <span className="flex items-center gap-1">
                        {proof.status === "APPROVED" ? (
                          <Check size={12} className="text-hfq-green" />
                        ) : proof.status === "REJECTED" ? (
                          <X size={12} className="text-hfq-red" />
                        ) : (
                          <Clock size={12} className="text-hfq-gold" />
                        )}
                        {proof.status.toLowerCase()}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="table-panel">
            <div className="panel-head">
              <span className="panel-title">Timeline</span>
            </div>
            <div className="flex flex-col gap-3 p-4 text-sm">
              {order.events.length === 0 && (
                <p className="text-hfq-dim">No events recorded yet.</p>
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

        <div>
          <AdminOrderActions
            orderNumber={order.orderNumber}
            status={order.status}
            demo={demo}
            internalNote={order.internalNote}
            commands={commands}
          />
        </div>
      </div>
    </div>
  );
}
