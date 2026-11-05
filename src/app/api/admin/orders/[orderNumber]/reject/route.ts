import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getStaffSession } from "@/lib/auth/admin";
import { rateLimit } from "@/lib/auth/rate-limit";
import { assertSameOrigin, clientIp, jsonError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";
import { sendDiscordOrderAlert } from "@/lib/notify/discord";
import { formatMoney } from "@/lib/utils";

export const runtime = "nodejs";

const REVIEWABLE = ["AWAITING_PAYMENT", "PROOF_UPLOADED", "UNDER_REVIEW", "APPROVED"];
const bodySchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Give the customer a reason for the rejection.")
    .max(500),
});

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

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid rejection.");
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
    return jsonError("This order can no longer be rejected.", 409);
  }

  const now = new Date();
  const reason = parsed.data.reason;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
        reviewedById: staff.id,
        reviewedAt: now,
      },
    });

    await tx.paymentProof.updateMany({
      where: { orderId: order.id, status: "PENDING" },
      data: {
        status: "REJECTED",
        reviewedById: staff.id,
        reviewedAt: now,
        reviewNote: reason,
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "PAYMENT_REJECTED",
        actorId: staff.id,
        payload: { reason },
      },
    });

    await tx.notification.create({
      data: {
        userId: order.userId,
        title: "Payment rejected",
        message: `Your receipt for ${orderNumber} was rejected. ${reason}`,
        type: "ERROR",
        link: `/u/${order.user.publicId}/orders/${orderNumber}`,
      },
    });

    await writeAudit(tx, {
      actorId: staff.id,
      action: "ORDER_PAYMENT_REJECTED",
      entityType: "Order",
      entityId: order.id,
      before: { status: order.status },
      after: { status: "REJECTED", reason },
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
  });

  await sendDiscordOrderAlert({
    event: "PAYMENT_REJECTED",
    orderNumber,
    player: order.minecraftUsername,
    items: order.items.map((item) => item.nameSnapshot).join(", "),
    total: formatMoney(order.totalMinor, order.currency),
    method: order.paymentMethod === "EZCASH" ? "Dialog eZ Cash" : "Bank transfer",
    adminUrl: `/admin/orders/${orderNumber}`,
    note: reason,
  });

  return NextResponse.json({ ok: true, status: "REJECTED" });
}
