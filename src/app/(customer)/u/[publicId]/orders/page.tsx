import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ReceiptText, ShoppingBag } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getViewer } from "@/lib/auth/viewer";
import { getOrders, getStats } from "@/lib/dashboard";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const viewer = await getViewer(publicId);
  const [orders, stats] = await Promise.all([
    getOrders(viewer),
    getStats(viewer),
  ]);
  const base = `/u/${viewer.publicId}`;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Your orders</h1>
          <p className="page-sub">
            Every purchase, receipt, and delivery in one place.
          </p>
        </div>
        <Link href="/store" className="mc-btn mc-btn-sm">
          <ShoppingBag size={15} />
          Browse store
        </Link>
      </div>

      <div className="kpi-grid mb-5">
        <div className="kpi-card">
          <div className="kpi-label">Total orders</div>
          <div className="kpi-value">{stats.totalOrders}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Pending</div>
          <div className="kpi-value is-gold">{stats.pendingOrders}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Completed</div>
          <div className="kpi-value is-green">{stats.completedOrders}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total spent</div>
          <div className="kpi-value">{stats.spentLabel}</div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="table-panel">
          <div className="empty-state">
            <img src="/images/logo.png" alt="" />
            <div>
              <p className="font-display text-lg text-hfq-text">No orders yet</p>
              <p className="mt-1 text-sm">
                Pick a rank, key, or shard and your first order will show up
                here.
              </p>
            </div>
            <Link href="/store" className="mc-btn mc-btn-sm mt-2">
              Open store
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="table-panel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="mono text-hfq-text">{order.orderNumber}</td>
                  <td>{order.itemsLabel || "—"}</td>
                  <td className="mono">{order.totalLabel}</td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="whitespace-nowrap">{order.createdAtLabel}</td>
                  <td className="text-right">
                    <Link
                      href={`${base}/orders/${order.orderNumber}`}
                      className="inline-flex items-center gap-1 font-display text-sm text-hfq-gold hover:text-hfq-text"
                    >
                      View
                      <ArrowRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="panel-soft mt-5 flex items-start gap-3 p-4 text-sm text-hfq-soft">
        <ReceiptText size={18} className="mt-0.5 shrink-0 text-hfq-gold" />
        <p>
          Orders waiting for payment show the eZ Cash or bank details on the
          order page. Upload a clear screenshot or PDF of the receipt and staff
          will review it.
        </p>
      </div>
    </div>
  );
}
