import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStaffSession } from "@/lib/auth/admin";
import { rateLimit } from "@/lib/auth/rate-limit";
import { assertSameOrigin, clientIp, jsonError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";
import { sendDiscordOrderAlert } from "@/lib/notify/discord";
import { formatMoney } from "@/lib/utils";

export const runtime = "nodejs";

const REVIEWABLE = ["AWAITING_PAYMENT", "PROOF_UPLOADED", "UNDER_REVIEW"];

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
      items: { select: { nameSnapshot: true } },
    },
  });

  if (!order) return jsonError("Order not found.", 404);
  if (!REVIEWABLE.includes(order.status)) {
    return jsonError("This order is not waiting for payment review.", 409);
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "APPROVED",
        paidAt: now,
        reviewedById: staff.id,
        reviewedAt: now,
        rejectionReason: null,
      },
    });

    await tx.paymentProof.updateMany({
      where: { orderId: order.id, status: "PENDING" },
      data: { status: "APPROVED", reviewedById: staff.id, reviewedAt: now },
    });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "PAYMENT_APPROVED",
        actorId: staff.id,
        payload: { reviewedBy: staff.email },
      },
    });

    await tx.notification.create({
      data: {
        userId: order.userId,
        title: "Payment approved",
        message: `Your payment for ${orderNumber} was approved. We are preparing your delivery.`,
        type: "SUCCESS",
        link: `/u/${order.user.publicId}/orders/${orderNumber}`,
      },
    });

    await writeAudit(tx, {
      actorId: staff.id,
      action: "ORDER_PAYMENT_APPROVED",
      entityType: "Order",
      entityId: order.id,
      before: { status: order.status },
      after: { status: "APPROVED" },
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
  });

  await sendDiscordOrderAlert({
    event: "PAYMENT_APPROVED",
    orderNumber,
    player: order.minecraftUsername,
    items: order.items.map((item) => item.nameSnapshot).join(", "),
    total: formatMoney(order.totalMinor, order.currency),
    method: order.paymentMethod === "EZCASH" ? "Dialog eZ Cash" : "Bank transfer",
    adminUrl: `/admin/orders/${orderNumber}`,
    note: "Payment verified. Run the delivery command, then mark the order delivered.",
  });

  return NextResponse.json({ ok: true, status: "APPROVED" });
}
