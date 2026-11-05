import "server-only";

import { format } from "date-fns";
import { prisma } from "@/lib/db";
import type {
  NotificationRow,
  OrderRow,
  Viewer,
  ViewerStats,
} from "@/lib/auth/types";
import { demoNotifications, demoOrders, demoStats } from "@/data/demo";
import { formatMoney } from "@/lib/utils";

const PENDING_STATUSES = [
  "PROOF_UPLOADED",
  "UNDER_REVIEW",
  "APPROVED",
  "DELIVERING",
] as const;

const PAID_STATUSES = ["APPROVED", "DELIVERING", "COMPLETED"] as const;

export async function getStats(viewer: Viewer): Promise<ViewerStats> {
  if (viewer.isDemo) return demoStats;

  const [total, pending, completed, sum] = await Promise.all([
    prisma.order.count({ where: { userId: viewer.id } }),
    prisma.order.count({
      where: { userId: viewer.id, status: { in: [...PENDING_STATUSES] } },
    }),
    prisma.order.count({
      where: { userId: viewer.id, status: "COMPLETED" },
    }),
    prisma.order.aggregate({
      where: { userId: viewer.id, status: { in: [...PAID_STATUSES] } },
      _sum: { totalMinor: true },
    }),
  ]);

  return {
    totalOrders: total,
    pendingOrders: pending,
    completedOrders: completed,
    spentLabel: formatMoney(sum._sum.totalMinor ?? 0),
  };
}

export async function getOrders(viewer: Viewer): Promise<OrderRow[]> {
  if (viewer.isDemo) return demoOrders;

  const orders = await prisma.order.findMany({
    where: { userId: viewer.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalLabel: formatMoney(order.totalMinor, order.currency),
    itemsLabel: order.items.map((item) => item.nameSnapshot).join(", "),
    createdAtLabel: format(order.createdAt, "dd MMM yyyy"),
  }));
}

export async function getNotifications(
  viewer: Viewer,
): Promise<NotificationRow[]> {
  if (viewer.isDemo) return demoNotifications;

  const rows = await prisma.notification.findMany({
    where: { userId: viewer.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    read: row.readAt !== null,
    createdAtLabel: format(row.createdAt, "dd MMM yyyy, HH:mm"),
  }));
}
