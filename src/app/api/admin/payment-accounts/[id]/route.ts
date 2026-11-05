import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin";
import { assertSameOrigin, clientIp, jsonError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";
import { paymentAccountInputSchema } from "@/lib/admin/validation";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const admin = await getAdminSession();
  if (!admin) return jsonError("Admin access required.", 403);

  const { id } = await params;
  const existing = await prisma.paymentAccount.findUnique({ where: { id } });
  if (!existing) return jsonError("Payment account not found.", 404);

  const body = await request.json().catch(() => null);
  const parsed = paymentAccountInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid account.");
  }

  const input = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.paymentAccount.update({
        where: { id },
        data: {
          method: input.method,
          label: input.label,
          accountName: input.accountName,
          accountNumber: input.accountNumber,
          bankName: input.bankName ?? null,
          branch: input.branch ?? null,
          instructions: input.instructions ?? null,
          active: input.active === "true",
          sortOrder: input.sortOrder,
        },
      });

      await writeAudit(tx, {
        actorId: admin.id,
        action: "PAYMENT_ACCOUNT_UPDATED",
        entityType: "PaymentAccount",
        entityId: id,
        before: existing,
        after: updated,
        ip: clientIp(request),
        userAgent: request.headers.get("user-agent"),
      });
    });

    revalidatePath("/admin/payment-accounts");
    revalidatePath("/store");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[payment-accounts] update failed", error);
    return jsonError("Could not update the payment account.", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const admin = await getAdminSession();
  if (!admin) return jsonError("Admin access required.", 403);

  const { id } = await params;
  const existing = await prisma.paymentAccount.findUnique({ where: { id } });
  if (!existing) return jsonError("Payment account not found.", 404);

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.paymentAccount.update({
        where: { id },
        data: { active: false },
      });

      await writeAudit(tx, {
        actorId: admin.id,
        action: "PAYMENT_ACCOUNT_ARCHIVED",
        entityType: "PaymentAccount",
        entityId: id,
        before: existing,
        after: updated,
        ip: clientIp(request),
        userAgent: request.headers.get("user-agent"),
      });
    });

    revalidatePath("/admin/payment-accounts");
    revalidatePath("/store");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[payment-accounts] archive failed", error);
    return jsonError("Could not archive the payment account.", 500);
  }
}
