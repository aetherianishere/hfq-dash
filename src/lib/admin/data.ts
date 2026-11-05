import "server-only";

import type { OrderStatus, Prisma } from "@prisma/client";
import { formatDistanceToNowStrict } from "date-fns";
import { prisma } from "@/lib/db";
import { demoOrders } from "@/data/demo";
import { formatMoney } from "@/lib/utils";

export const ORDER_STATUSES = [
  "AWAITING_PAYMENT",
  "PROOF_UPLOADED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "DELIVERING",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
] as const;

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  player: string;
  email: string;
  items: string;
  totalLabel: string;
  method: string;
  createdAt: Date;
  ageLabel: string;
  proofCount: number;
};

export type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
  reviewedAt: Date | null;
  totalMinor: bigint;
  currency: string;
  paymentMethod: string;
  paymentReference: string;
  minecraftUsername: string;
  customerNote: string | null;
  internalNote: string | null;
  rejectionReason: string | null;
  user: {
    email: string;
    publicId: string;
    profile: { displayName: string | null; firstName: string; lastName: string } | null;
  };
  items: Array<{
    id: string;
    nameSnapshot: string;
    priceMinor: bigint;
    quantity: number;
    product: {
      slug: string;
      name: string;
      deliveryCommand: string | null;
      server: { name: string } | null;
    };
  }>;
  proofs: Array<{
    id: string;
    originalName: string;
    mime: string;
    sizeBytes: number;
    status: string;
    createdAt: Date;
  }>;
  events: Array<{
    id: string;
    type: string;
    createdAt: Date;
    payload: Prisma.JsonValue | null;
  }>;
  paymentAccount: {
    label: string;
    accountName: string;
    accountNumber: string;
    bankName: string | null;
    branch: string | null;
    instructions: string | null;
  } | null;
  reviewedBy: { email: string } | null;
};

function methodLabel(method: string) {
  return method === "EZCASH" ? "Dialog eZ Cash" : "Bank transfer";
}

function demoRows(): AdminOrderRow[] {
  return demoOrders.map((order, index) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    player: "HFQ_Player",
    email: "player@hfqmc.xyz",
    items: order.itemsLabel,
    totalLabel: order.totalLabel,
    method: index % 2 === 0 ? "Bank transfer" : "Dialog eZ Cash",
    createdAt: new Date(Date.now() - (index + 1) * 3_600_000),
    ageLabel: `${index + 1}h ago`,
    proofCount: order.status === "COMPLETED" ? 1 : order.status === "REJECTED" ? 1 : 0,
  }));
}

export async function getAdminStats() {
  if (process.env.DEMO_MODE === "1") {
    return {
      users: 128,
      orders: 342,
      pending: 7,
      approved: 4,
      revenueLabel: "Rs 184,500.00",
    };
  }

  const [users, orders, pending, approved, sum] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.count({
      where: { status: { in: ["PROOF_UPLOADED", "UNDER_REVIEW"] } },
    }),
    prisma.order.count({ where: { status: "APPROVED" } }),
    prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { totalMinor: true },
    }),
  ]);

  return {
    users,
    orders,
    pending,
    approved,
    revenueLabel: formatMoney(sum._sum.totalMinor ?? 0),
  };
}

export async function getAdminOrders({
  status,
  q,
  page = 1,
  pageSize = 20,
  oldestFirst = false,
}: {
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  oldestFirst?: boolean;
}) {
  if (process.env.DEMO_MODE === "1") {
    let rows = demoRows();
    if (status && status !== "ALL") {
      rows = rows.filter((row) => row.status === status);
    }
    if (q) {
      const needle = q.toLowerCase();
      rows = rows.filter(
        (row) =>
          row.orderNumber.toLowerCase().includes(needle) ||
          row.player.toLowerCase().includes(needle) ||
          row.email.toLowerCase().includes(needle),
      );
    }
    return { rows, total: rows.length, page: 1, pages: 1 };
  }

  const where: Prisma.OrderWhereInput = {};
  if (status && status !== "ALL") {
    where.status = status as OrderStatus;
  }
  if (q) {
    where.OR = [
      { orderNumber: { contains: q } },
      { minecraftUsername: { contains: q } },
      { paymentReference: { contains: q } },
      { user: { email: { contains: q } } },
      { user: { profile: { is: { displayName: { contains: q } } } } },
    ];
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: oldestFirst ? "asc" : "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { email: true, profile: { select: { displayName: true } } } },
        items: { select: { nameSnapshot: true } },
        _count: { select: { proofs: true } },
      },
    }),
  ]);

  return {
    rows: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      player: order.minecraftUsername,
      email: order.user.email,
      items: order.items.map((item) => item.nameSnapshot).join(", "),
      totalLabel: formatMoney(order.totalMinor, order.currency),
      method: methodLabel(order.paymentMethod),
      createdAt: order.createdAt,
      ageLabel: formatDistanceToNowStrict(order.createdAt, { addSuffix: true }),
      proofCount: order._count.proofs,
    })) satisfies AdminOrderRow[],
    total,
    page,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getReviewQueue(limit = 6) {
  if (process.env.DEMO_MODE === "1") {
    return demoRows()
      .filter((row) => ["PROOF_UPLOADED", "APPROVED", "UNDER_REVIEW"].includes(row.status))
      .slice(0, limit);
  }

  const orders = await prisma.order.findMany({
    where: { status: { in: ["PROOF_UPLOADED", "UNDER_REVIEW", "APPROVED"] } },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      user: { select: { email: true } },
      items: { select: { nameSnapshot: true } },
      _count: { select: { proofs: true } },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    player: order.minecraftUsername,
    email: order.user.email,
    items: order.items.map((item) => item.nameSnapshot).join(", "),
    totalLabel: formatMoney(order.totalMinor, order.currency),
    method: methodLabel(order.paymentMethod),
    createdAt: order.createdAt,
    ageLabel: formatDistanceToNowStrict(order.createdAt, { addSuffix: true }),
    proofCount: order._count.proofs,
  })) satisfies AdminOrderRow[];
}

function demoDetail(orderNumber: string): AdminOrderDetail | null {
  const order = demoOrders.find((row) => row.orderNumber === orderNumber);
  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: new Date(Date.now() - 3 * 3_600_000),
    paidAt: order.status === "COMPLETED" ? new Date(Date.now() - 2 * 3_600_000) : null,
    reviewedAt: order.status === "COMPLETED" ? new Date(Date.now() - 2 * 3_600_000) : null,
    totalMinor: BigInt(599),
    currency: "USD",
    paymentMethod: "BANK",
    paymentReference: `${order.orderNumber}-DEMO`,
    minecraftUsername: "HFQ_Player",
    customerNote: "Please deliver after 6pm.",
    internalNote: null,
    rejectionReason: order.status === "REJECTED" ? "Receipt was unreadable." : null,
    user: {
      email: "player@hfqmc.xyz",
      publicId: "b7k2m9q4v1t8z3x",
      profile: { displayName: "HFQ Player", firstName: "HFQ", lastName: "Player" },
    },
    items: [
      {
        id: "demo-item",
        nameSnapshot: order.itemsLabel,
        priceMinor: BigInt(599),
        quantity: 1,
        product: {
          slug: "legend",
          name: order.itemsLabel,
          deliveryCommand: "lp user {username} parent add legend",
          server: { name: "HFQ Survival" },
        },
      },
    ],
    proofs:
      order.status === "PROOF_UPLOADED" || order.status === "COMPLETED" || order.status === "REJECTED"
        ? [
            {
              id: "demo-proof",
              originalName: "receipt.png",
              mime: "image/png",
              sizeBytes: 120_000,
              status: order.status === "REJECTED" ? "REJECTED" : "PENDING",
              createdAt: new Date(Date.now() - 3 * 3_600_000),
            },
          ]
        : [],
    events: [
      {
        id: "demo-event",
        type: "ORDER_CREATED",
        createdAt: new Date(Date.now() - 3 * 3_600_000),
        payload: null,
      },
    ],
    paymentAccount: {
      label: "Main bank account",
      accountName: "HFQ Network",
      accountNumber: "1234567890",
      bankName: "Commercial Bank",
      branch: "Colombo",
      instructions: "Use your order reference as the transfer note.",
    },
    reviewedBy: null,
  };
}

export async function getAdminOrderDetail(
  orderNumber: string,
): Promise<AdminOrderDetail | null> {
  if (process.env.DEMO_MODE === "1") return demoDetail(orderNumber);

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      user: {
        select: {
          email: true,
          publicId: true,
          profile: {
            select: { displayName: true, firstName: true, lastName: true },
          },
        },
      },
      items: {
        include: {
          product: {
            select: {
              slug: true,
              name: true,
              deliveryCommand: true,
              server: { select: { name: true } },
            },
          },
        },
      },
      proofs: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "asc" } },
      paymentAccount: {
        select: {
          label: true,
          accountName: true,
          accountNumber: true,
          bankName: true,
          branch: true,
          instructions: true,
        },
      },
      reviewedBy: { select: { email: true } },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    reviewedAt: order.reviewedAt,
    totalMinor: order.totalMinor,
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    paymentReference: order.paymentReference,
    minecraftUsername: order.minecraftUsername,
    customerNote: order.customerNote,
    internalNote: order.internalNote,
    rejectionReason: order.rejectionReason,
    user: order.user,
    items: order.items,
    proofs: order.proofs.map((proof) => ({
      id: proof.id,
      originalName: proof.originalName,
      mime: proof.mime,
      sizeBytes: proof.sizeBytes,
      status: proof.status,
      createdAt: proof.createdAt,
    })),
    events: order.events.map((event) => ({
      id: event.id,
      type: event.type,
      createdAt: event.createdAt,
      payload: event.payload,
    })),
    paymentAccount: order.paymentAccount,
    reviewedBy: order.reviewedBy,
  };
}
