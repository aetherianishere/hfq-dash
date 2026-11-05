import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import {
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyTotp,
} from "@/lib/auth/totp";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/http";
import { totpCodeSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const session = await getSession();
  if (!session) return jsonError("Sign in to continue.", 401);

  const limited = rateLimit(`totp-enable:${session.user.id}`, 10, 15 * 60_000);
  if (!limited.ok) {
    return jsonError("Too many attempts. Try again later.", 429);
  }

  if (session.user.totpEnabled) {
    return jsonError("Two-factor authentication is already enabled.", 409);
  }
  if (!session.user.totpSecret) {
    return jsonError("Start two-factor setup first.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = totpCodeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Enter a valid code.");
  }

  if (!verifyTotp(session.user.totpSecret, parsed.data.code)) {
    return jsonError("That code is not valid. Check your authenticator app.");
  }

  const recoveryCodes = generateRecoveryCodes();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { totpEnabled: true },
    }),
    prisma.recoveryCode.deleteMany({ where: { userId: session.user.id } }),
    prisma.recoveryCode.createMany({
      data: recoveryCodes.map((code) => ({
        userId: session.user.id,
        codeHash: hashRecoveryCode(code),
      })),
    }),
    prisma.session.updateMany({
      where: {
        userId: session.user.id,
        id: { not: session.id },
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    recoveryCodes,
    message:
      "Two-factor authentication is on. Store these recovery codes somewhere safe.",
  });
}
