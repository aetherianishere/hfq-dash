import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffSession } from "@/lib/auth/admin";
import { rateLimit } from "@/lib/auth/rate-limit";
import { assertSameOrigin, clientIp, jsonError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";
import { sendDiscordOrderAlert } from "@/lib/notify/discord";
import { buildDeliveryCommand } from "@/lib/orders";
import { formatMoney } from "@/lib/utils";

export const runtime = "nodejs";

const DELIVERABLE = ["APPROVED", "DELIVERING"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const staff = await getStaffSession();
  if (!staff) return jsonError("Staff access required.", 403);

  const limited = rateLimit(`admin:order:${staff.id}`, 80, 5 * 60_000);
  if (!limited.ok) {
    return jsonError("Too many admin actions. Slow down.", 429);
  }

  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      user: { select: { publicId: true } },
      items: {
        include: {
          product: {
            select: {
              name: true,
              deliveryCommand: true,
              serverId: true,
            },
          },
        },
      },
    },
  });

  if (!order) return jsonError("Order not found.", 404);
  if (!DELIVERABLE.includes(order.status)) {
    return jsonError("Approve the payment before marking this order delivered.", 409);
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const command = buildDeliveryCommand(
        item.product.deliveryCommand,
        order.minecraftUsername,
        `MANUAL DELIVERY: give ${item.nameSnapshot} to ${order.minecraftUsername}`,
      );

      await tx.delivery.upsert({
        where: { idempotencyKey: `manual:${item.id}` },
        update: {
          command,
          status: "DELIVERED",
          attempts: { increment: 1 },
          lastError: null,
          executedAt: now,
          deliveredAt: now,
        },
        create: {
          orderItemId: item.id,
          serverId: item.product.serverId,
          command,
          status: "DELIVERED",
          attempts: 1,
          executedAt: now,
          deliveredAt: now,
          idempotencyKey: `manual:${item.id}`,
        },
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: "COMPLETED" },
    });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "ORDER_COMPLETED",
        actorId: staff.id,
        payload: {
          deliveredBy: staff.email,
          items: order.items.map((item) => item.nameSnapshot),
        },
      },
    });

    await tx.notification.create({
      data: {
        userId: order.userId,
        title: "Order delivered",
        message: `Your order ${orderNumber} has been delivered in-game. Enjoy!`,
        type: "SUCCESS",
        link: `/u/${order.user.publicId}/orders/${orderNumber}`,
      },
    });

    await writeAudit(tx, {
      actorId: staff.id,
      action: "ORDER_MARKED_DELIVERED",
      entityType: "Order",
      entityId: order.id,
      before: { status: order.status },
      after: { status: "COMPLETED" },
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
  });

  await sendDiscordOrderAlert({
    event: "ORDER_COMPLETED",
    orderNumber,
    player: order.minecraftUsername,
    items: order.items.map((item) => item.nameSnapshot).join(", "),
    total: formatMoney(order.totalMinor, order.currency),
    method: order.paymentMethod === "EZCASH" ? "Dialog eZ Cash" : "Bank transfer",
    adminUrl: `/admin/orders/${orderNumber}`,
    note: `Marked delivered by ${staff.email}.`,
  });

  return NextResponse.json({ ok: true, status: "COMPLETED" });
}
