import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { verifySecondFactor } from "@/lib/auth/two-factor";
import {
  assertSameOrigin,
  clientIp,
  jsonError,
  safeNext,
} from "@/lib/http";
import { loginSchema } from "@/lib/validation";

const MAX_FAILED_LOGINS = 10;
const LOCK_MS = 15 * 60_000;

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const ip = clientIp(request);
  const limited = rateLimit(`login:${ip}`, 10, 15 * 60_000);
  if (!limited.ok) {
    return jsonError("Too many sign-in attempts. Try again later.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid details.");
  }

  const { email, password, totp, next } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      publicId: true,
      passwordHash: true,
      emailVerified: true,
      isSuspended: true,
      failedLogins: true,
      lockedUntil: true,
      totpEnabled: true,
      totpSecret: true,
    },
  });

  if (!user) {
    return jsonError("Invalid email or password.", 401);
  }
  if (user.isSuspended) {
    return jsonError("This account is suspended. Contact support.", 403);
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return jsonError(
      "Too many failed attempts. Try again in 15 minutes.",
      423,
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const failedLogins = user.failedLogins + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins,
        lockedUntil:
          failedLogins >= MAX_FAILED_LOGINS
            ? new Date(Date.now() + LOCK_MS)
            : null,
      },
    });
    return jsonError("Invalid email or password.", 401);
  }

  if (user.totpEnabled) {
    if (!user.totpSecret) {
      return jsonError(
        "Two-factor authentication is misconfigured. Contact an administrator.",
        500,
      );
    }

    if (!totp) {
      return NextResponse.json(
        {
          error: "Enter the 6-digit code from your authenticator app.",
          code: "TOTP_REQUIRED",
        },
        { status: 401 },
      );
    }

    const validFactor = await verifySecondFactor(
      user.id,
      user.totpSecret,
      totp,
    );

    if (!validFactor) {
      const failedLogins = user.failedLogins + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLogins,
          lockedUntil:
            failedLogins >= MAX_FAILED_LOGINS
              ? new Date(Date.now() + LOCK_MS)
              : null,
        },
      });
      return NextResponse.json(
        {
          error: "That authentication code is not valid.",
          code: "TOTP_INVALID",
        },
        { status: 401 },
      );
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  await createSession(user.id, {
    ip,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  const redirectTo =
    safeNext(next) ?? `/u/${user.publicId}`;

  return NextResponse.json({
    ok: true,
    publicId: user.publicId,
    redirectTo,
  });
}
