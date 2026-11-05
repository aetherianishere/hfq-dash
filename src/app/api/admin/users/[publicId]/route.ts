import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminSession, isStaffRole } from "@/lib/auth/admin";
import { rateLimit } from "@/lib/auth/rate-limit";
import { writeAudit } from "@/lib/audit";
import { assertSameOrigin, clientIp, jsonError } from "@/lib/http";

export const runtime = "nodejs";

const roleSchema = z.object({
  role: z.enum(["CUSTOMER", "SUPPORT", "STAFF", "ADMIN", "SUPER_ADMIN"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const admin = await getAdminSession();
  if (!admin) return jsonError("Admin access required.", 403);

  const limited = rateLimit(`admin:user:${admin.id}`, 30, 10 * 60_000);
  if (!limited.ok) {
    return jsonError("Too many role changes. Try again later.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Choose a valid role.");
  }

  const { publicId } = await params;
  const target = await prisma.user.findUnique({
    where: { publicId },
    select: {
      id: true,
      publicId: true,
      email: true,
      role: true,
      isFounder: true,
    },
  });

  if (!target) return jsonError("User not found.", 404);
  if (target.publicId === admin.publicId) {
    return jsonError("You cannot change your own role.", 400);
  }
  if (target.isFounder) {
    return jsonError("The founder account role cannot be changed.", 403);
  }
  if (
    admin.role === "ADMIN" &&
    (target.role === "SUPER_ADMIN" || parsed.data.role === "SUPER_ADMIN")
  ) {
    return jsonError("Only a super admin can manage super admin access.", 403);
  }
  if (target.role === parsed.data.role) {
    return NextResponse.json({ ok: true, role: target.role });
  }

  const demotingFromStaff =
    isStaffRole(target.role) && !isStaffRole(parsed.data.role);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: target.id },
      data: { role: parsed.data.role },
    });

    if (demotingFromStaff) {
      await tx.session.updateMany({
        where: { userId: target.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await writeAudit(tx, {
      actorId: admin.id,
      action: "USER_ROLE_CHANGED",
      entityType: "User",
      entityId: target.id,
      before: { role: target.role },
      after: { role: parsed.data.role },
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });
  });

  return NextResponse.json({ ok: true, role: parsed.data.role });
}
