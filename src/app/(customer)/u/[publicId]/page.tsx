import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  ChevronRight,
  ReceiptText,
  Settings,
  ShoppingBag,
  Sparkles,
  Upload,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getViewer } from "@/lib/auth/viewer";
import { getOrders, getStats } from "@/lib/dashboard";

export const metadata: Metadata = { title: "Overview" };

const HOW_IT_WORKS = [
  "Pick a rank, key, or shard from the store.",
  "Pay with Dialog eZ Cash or a bank transfer.",
  "Upload a screenshot or PDF of your receipt.",
  "Staff verify it and deliver in-game.",
];

export default async function OverviewPage({
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
  const name =
    viewer.profile?.displayName ?? viewer.profile?.firstName ?? "player";
  const recent = orders.slice(0, 5);
  const needsSetup = (viewer.profile?.setupStep ?? 0) < 4;

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="section-label">PLAYER DASHBOARD</p>
          <h1 className="page-title mt-2">Welcome back, {name}</h1>
          <p className="page-sub">
            Here is what is happening with your HFQ account.
          </p>
        </div>
        <Link href="/store" className="mc-btn">
          <ShoppingBag size={16} />
          Visit store
        </Link>
      </div>

      {needsSetup && (
        <Link
          href={`${base}/setup`}
          className="panel mb-5 flex flex-wrap items-center justify-between gap-3 p-4 transition-transform hover:-translate-y-0.5"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center border-[3px] border-ink bg-hfq-gold">
              <Sparkles size={18} className="text-ink" />
            </span>
            <div>
              <p className="font-display text-base text-hfq-text">
                Finish your profile
              </p>
              <p className="text-xs text-hfq-soft">
                Add your Minecraft username, birthday, and avatar.
              </p>
            </div>
          </div>
          <span className="mc-btn mc-btn-sm">
            Continue
            <ArrowRight size={14} />
          </span>
        </Link>
      )}

      <div className="kpi-grid">
        <div className="kpi-card reveal">
          <div className="kpi-label">Total orders</div>
          <div className="kpi-value">{stats.totalOrders}</div>
        </div>
        <div className="kpi-card reveal" style={{ "--i": 1 } as React.CSSProperties}>
          <div className="kpi-label">Pending review</div>
          <div className="kpi-value is-gold">{stats.pendingOrders}</div>
        </div>
        <div className="kpi-card reveal" style={{ "--i": 2 } as React.CSSProperties}>
          <div className="kpi-label">Completed</div>
          <div className="kpi-value is-green">{stats.completedOrders}</div>
        </div>
        <div className="kpi-card reveal" style={{ "--i": 3 } as React.CSSProperties}>
          <div className="kpi-label">Total spent</div>
          <div className="kpi-value">{stats.spentLabel}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="table-panel">
          <div className="panel-head">
            <span className="panel-title">Recent orders</span>
            <Link
              href={`${base}/orders`}
              className="inline-flex items-center gap-1 font-display text-xs text-hfq-gold hover:text-hfq-text"
            >
              View all
              <ChevronRight size={13} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="empty-state">
              <img src="/images/logo.png" alt="" />
              <div>
                <p className="font-display text-base text-hfq-text">
                  No orders yet
                </p>
                <p className="mt-1 text-sm">
                  Your first purchase will appear here.
                </p>
              </div>
              <Link href="/store" className="mc-btn mc-btn-sm mt-2">
                Open store
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Item</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recent.map((order) => (
                    <tr key={order.id}>
                      <td className="mono text-hfq-text">{order.orderNumber}</td>
                      <td>{order.itemsLabel || "—"}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="mono">{order.totalLabel}</td>
                      <td className="text-right">
                        <Link
                          href={`${base}/orders/${order.orderNumber}`}
                          className="font-display text-xs text-hfq-gold hover:text-hfq-text"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <p className="sidebar-section-title !p-0">Quick actions</p>
          {[
            {
              href: "/store",
              label: "Browse the store",
              note: "Ranks, keys, shards",
              icon: <ShoppingBag size={17} />,
            },
            {
              href: `${base}/orders`,
              label: "Upload a receipt",
              note: "Continue a pending order",
              icon: <Upload size={17} />,
            },
            {
              href: `${base}/notifications`,
              label: "Notifications",
              note: "Order updates",
              icon: <Bell size={17} />,
            },
            {
              href: `${base}/settings`,
              label: "Account settings",
              note: "Profile and security",
              icon: <Settings size={17} />,
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
              <ChevronRight size={14} className="text-hfq-dim" />
            </Link>
          ))}
        </div>
      </div>

      <div className="table-panel mt-5">
        <div className="panel-head">
          <span className="panel-title">How delivery works</span>
          <ReceiptText size={16} className="text-hfq-gold" />
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, index) => (
            <div key={step} className="slot p-3">
              <span className="font-display text-2xl text-hfq-red">
                0{index + 1}
              </span>
              <p className="mt-1 text-xs leading-relaxed text-hfq-soft">
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
