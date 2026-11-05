import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getStaffSession } from "@/lib/auth/admin";
import { assertSameOrigin, clientIp, jsonError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const bodySchema = z.object({
  note: z.string().trim().max(2000),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const staff = await getStaffSession();
  if (!staff) return jsonError("Staff access required.", 403);

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("The note must be 2,000 characters or fewer.");
  }

  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: { id: true, internalNote: true },
  });

  if (!order) return jsonError("Order not found.", 404);

  const note = parsed.data.note || null;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { internalNote: note },
    });

    await writeAudit(tx, {
      actorId: staff.id,
      action: "ORDER_NOTE_UPDATED",
      entityType: "Order",
      entityId: order.id,
      before: { internalNote: order.internalNote },
      after: { internalNote: note },
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
  });

  return NextResponse.json({ ok: true });
}
