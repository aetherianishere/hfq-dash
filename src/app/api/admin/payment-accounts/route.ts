import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin";
import { rateLimit } from "@/lib/auth/rate-limit";
import { assertSameOrigin, clientIp, jsonError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";
import { paymentAccountInputSchema } from "@/lib/admin/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const admin = await getAdminSession();
  if (!admin) return jsonError("Admin access required.", 403);

  const limited = rateLimit(`admin:account:${admin.id}`, 30, 10 * 60_000);
  if (!limited.ok) {
    return jsonError("Too many payment account changes.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = paymentAccountInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid account.");
  }

  const input = parsed.data;

  try {
    const account = await prisma.$transaction(async (tx) => {
      const created = await tx.paymentAccount.create({
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
        action: "PAYMENT_ACCOUNT_CREATED",
        entityType: "PaymentAccount",
        entityId: created.id,
        after: created,
        ip: clientIp(request),
        userAgent: request.headers.get("user-agent"),
      });

      return created;
    });

    revalidatePath("/admin/payment-accounts");
    revalidatePath("/store");

    return NextResponse.json({ ok: true, id: account.id });
  } catch (error) {
    console.error("[payment-accounts] create failed", error);
    return jsonError("Could not create the payment account.", 500);
  }
}
