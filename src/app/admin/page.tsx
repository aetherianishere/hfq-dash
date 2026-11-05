import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Clock3,
  Package,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Users,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdminStats, getReviewQueue } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminPage() {
  const [stats, queue] = await Promise.all([
    getAdminStats(),
    getReviewQueue(7),
  ]);

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="section-label">OPERATIONS</p>
          <h1 className="page-title mt-2">Admin overview</h1>
          <p className="page-sub">
            Review receipts, deliver orders, and keep the storefront current.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products/new" className="btn-ghost">
            <Package size={15} />
            Add product
          </Link>
          <Link href="/admin/orders?status=PROOF_UPLOADED" className="mc-btn mc-btn-sm">
            <ReceiptText size={15} />
            Review queue
          </Link>
        </div>
      </div>

      {process.env.DEMO_MODE === "1" && (
        <div className="auth-error mb-5">
          Demo preview. Connect MySQL and turn off <code>DEMO_MODE</code> to
          enable real order and product actions.
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label flex items-center gap-2">
            <Users size={13} /> Users
          </div>
          <div className="kpi-value">{stats.users}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label flex items-center gap-2">
            <ShoppingBag size={13} /> Orders
          </div>
          <div className="kpi-value">{stats.orders}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label flex items-center gap-2">
            <Clock3 size={13} /> Needs review
          </div>
          <div className="kpi-value is-gold">{stats.pending}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label flex items-center gap-2">
            <Banknote size={13} /> Completed revenue
          </div>
          <div className="kpi-value is-green">{stats.revenueLabel}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="table-panel overflow-x-auto">
          <div className="panel-head">
            <span className="panel-title">Needs attention</span>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 font-display text-xs text-hfq-gold hover:text-hfq-text"
            >
              All orders <ArrowRight size={13} />
            </Link>
          </div>

          {queue.length === 0 ? (
            <div className="empty-state">
              <ShieldCheck size={26} className="text-hfq-green" />
              <div>
                <p className="font-display text-lg text-hfq-text">
                  Queue is clear
                </p>
                <p className="mt-1 text-sm">
                  New receipts will appear here as soon as customers upload them.
                </p>
              </div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Player</th>
                  <th>Item</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {queue.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        className="mono text-hfq-text hover:text-hfq-gold"
                      >
                        {order.orderNumber}
                      </Link>
                      <div className="mt-0.5 text-[10px] text-hfq-dim">
                        {order.ageLabel}
                      </div>
                    </td>
                    <td>{order.player}</td>
                    <td className="max-w-40 truncate">{order.items}</td>
                    <td className="mono">{order.totalLabel}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        className="inline-flex items-center gap-1 font-display text-xs text-hfq-gold hover:text-hfq-text"
                      >
                        Review <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <p className="sidebar-section-title !p-0">Quick actions</p>
          {[
            {
              href: "/admin/orders?status=PROOF_UPLOADED",
              label: "Review receipts",
              note: `${stats.pending} waiting`,
              icon: <ReceiptText size={17} />,
            },
            {
              href: "/admin/orders?status=APPROVED",
              label: "Deliver approved orders",
              note: `${stats.approved} ready`,
              icon: <ShoppingBag size={17} />,
            },
            {
              href: "/admin/products",
              label: "Manage products",
              note: "Names, prices, images",
              icon: <Package size={17} />,
            },
            {
              href: "/admin/payment-accounts",
              label: "Payment accounts",
              note: "Bank and eZ Cash details",
              icon: <Banknote size={17} />,
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="panel-soft flex items-center gap-3 p-3 transition-colors hover:bg-panel"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center border-2 border-ink bg-bg text-hfq-gold">
                {action.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm text-hfq-text">
                  {action.label}
                </span>
                <span className="block text-[11px] text-hfq-dim">
                  {action.note}
                </span>
              </span>
              <ArrowRight size={14} className="text-hfq-dim" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
