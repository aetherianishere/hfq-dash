import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { hashOtp, OTP_MAX_ATTEMPTS } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/auth/rate-limit";
import { assertSameOrigin, clientIp, jsonError } from "@/lib/http";
import { resetPasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const ip = clientIp(request);
  const limited = rateLimit(`reset:${ip}`, 12, 15 * 60_000);
  if (!limited.ok) {
    return jsonError("Too many attempts. Please try again later.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid details.");
  }

  const { email, code, password } = parsed.data;

  const emailLimited = rateLimit(`reset-email:${email}`, 8, 15 * 60_000);
  if (!emailLimited.ok) {
    return jsonError("Too many attempts. Request a new code.", 429);
  }

  const record = await prisma.verificationCode.findFirst({
    where: { email, purpose: "RESET", consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return jsonError("No active reset code. Request a new one.", 400);
  }
  if (record.expiresAt <= new Date()) {
    return jsonError("That code has expired. Request a new one.", 400);
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return jsonError("Too many incorrect attempts. Request a new code.", 429);
  }

  if (record.codeHash !== hashOtp(code, email)) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return jsonError("That reset code is not correct.", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return jsonError("No account found for that email.", 400);
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        failedLogins: 0,
        lockedUntil: null,
        mustChangePassword: false,
      },
    }),
    prisma.verificationCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    }),
    prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    redirectTo: "/login?reset=1",
  });
}
