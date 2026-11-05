import type { Metadata } from "next";
import { AlertTriangle, Bell, CheckCircle2, Info, XCircle } from "lucide-react";
import { getViewer } from "@/lib/auth/viewer";
import { getNotifications } from "@/lib/dashboard";

export const metadata: Metadata = { title: "Notifications" };

const ICONS: Record<string, React.ReactNode> = {
  INFO: <Info size={16} className="text-hfq-gold" />,
  SUCCESS: <CheckCircle2 size={16} className="text-hfq-green" />,
  WARNING: <AlertTriangle size={16} className="text-hfq-gold" />,
  ERROR: <XCircle size={16} className="text-hfq-red" />,
};

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const viewer = await getViewer(publicId);
  const notifications = await getNotifications(viewer);
  const unread = notifications.filter((item) => !item.read).length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="page-head">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">
            Order updates, payment reviews, and delivery notices.
          </p>
        </div>
        <span className="status-pill">
          <Bell size={13} className="text-hfq-gold" />
          {unread} unread
        </span>
      </div>

      {notifications.length === 0 ? (
        <div className="table-panel">
          <div className="empty-state">
            <Bell size={26} className="text-hfq-dim" />
            <div>
              <p className="font-display text-lg text-hfq-text">
                Nothing here yet
              </p>
              <p className="mt-1 text-sm">
                We will let you know when an order changes status.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((item) => (
            <article
              key={item.id}
              className={`panel-soft flex items-start gap-3 p-4 ${
                item.read ? "opacity-70" : ""
              }`}
            >
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center border-2 border-ink bg-bg">
                {ICONS[item.type] ?? <Bell size={16} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-sm text-hfq-text">
                    {item.title}
                  </h2>
                  {!item.read && (
                    <span className="h-2 w-2 bg-hfq-red" aria-label="Unread" />
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-hfq-soft">
                  {item.message}
                </p>
                <p className="mono mt-2 text-[10px] text-hfq-dim">
                  {item.createdAtLabel}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
