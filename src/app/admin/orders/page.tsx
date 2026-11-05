import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Filter, Search, ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdminOrders, ORDER_STATUSES } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Orders" };

type SearchParams = {
  status?: string;
  q?: string;
  page?: string;
};

function pageHref(status: string, q: string, page: number) {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.set("status", status);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/admin/orders${query ? `?${query}` : ""}`;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const status = params.status ?? "ALL";
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const { rows, total, pages } = await getAdminOrders({ status, q, page });

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="section-label">ORDERS</p>
          <h1 className="page-title mt-2">Order queue</h1>
          <p className="page-sub">
            {total} order{total === 1 ? "" : "s"} matched. Oldest receipts are
            shown first when you filter the review queue.
          </p>
        </div>
        <Link href="/admin/orders?status=PROOF_UPLOADED" className="mc-btn mc-btn-sm">
          <ShieldCheck size={15} />
          Needs review
        </Link>
      </div>

      <form className="panel mb-5 grid gap-3 p-4 sm:grid-cols-[1fr_220px_auto]" method="get">
        <label className="auth-field">
          <span className="auth-label">Search</span>
          <span className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-hfq-dim"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Order, player, email, reference"
              className="auth-input !pl-9"
            />
          </span>
        </label>
        <label className="auth-field">
          <span className="auth-label">Status</span>
          <select name="status" defaultValue={status} className="auth-input">
            <option value="ALL">All statuses</option>
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button type="submit" className="mc-btn w-full sm:w-auto">
            <Filter size={15} />
            Filter
          </button>
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="table-panel">
          <div className="empty-state">
            <ShieldCheck size={28} className="text-hfq-dim" />
            <div>
              <p className="font-display text-lg text-hfq-text">No orders found</p>
              <p className="mt-1 text-sm">
                Try a different status or clear the search.
              </p>
            </div>
            <Link href="/admin/orders" className="btn-ghost mt-2">
              Clear filters
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="table-panel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Player</th>
                  <th>Item</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Proof</th>
                  <th>Status</th>
                  <th>Age</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        className="mono text-hfq-text hover:text-hfq-gold"
                      >
                        {order.orderNumber}
                      </Link>
                      <div className="mt-0.5 text-[10px] text-hfq-dim">
                        {order.email}
                      </div>
                    </td>
                    <td>{order.player}</td>
                    <td className="max-w-44 truncate">{order.items}</td>
                    <td className="mono">{order.totalLabel}</td>
                    <td className="whitespace-nowrap">{order.method}</td>
                    <td className="mono">{order.proofCount}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="whitespace-nowrap text-xs">{order.ageLabel}</td>
                    <td className="text-right">
                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        className="inline-flex items-center gap-1 font-display text-xs text-hfq-gold hover:text-hfq-text"
                      >
                        Open <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-hfq-dim">
                Page {page} of {pages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={pageHref(status, q, page - 1)}
                    className="btn-ghost"
                  >
                    Previous
                  </Link>
                )}
                {page < pages && (
                  <Link
                    href={pageHref(status, q, page + 1)}
                    className="btn-ghost"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
