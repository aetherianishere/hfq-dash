import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createUserWithPublicId } from "@/lib/auth/create-user";
import { hashOtp, OTP_MAX_ATTEMPTS } from "@/lib/auth/otp";
import { PENDING_COOKIE, readPendingToken } from "@/lib/auth/pending";
import { createSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { assertSameOrigin, clientIp, jsonError } from "@/lib/http";
import { verifySchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const ip = clientIp(request);
  const limited = rateLimit(`verify:${ip}`, 12, 15 * 60_000);
  if (!limited.ok) {
    return jsonError("Too many attempts. Please try again later.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid code.");
  }

  const { email, code } = parsed.data;
  const store = await cookies();
  const pending = await readPendingToken(store.get(PENDING_COOKIE)?.value);

  if (!pending || pending.email !== email) {
    return jsonError(
      "Your signup session expired. Please create your account again.",
      400,
    );
  }

  const record = await prisma.verificationCode.findFirst({
    where: { email, purpose: "REGISTER", consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return jsonError("No active code. Request a new one.", 400);
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
    return jsonError("That code is not correct.", 400);
  }

  let user;
  try {
    user = await createUserWithPublicId({
      email,
      passwordHash: pending.passwordHash,
      firstName: pending.firstName,
      lastName: pending.lastName,
    });
  } catch (error) {
    console.error("[verify] create user failed", error);
    return jsonError(
      "We could not create your account. Please try again or contact support.",
      500,
    );
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  await createSession(user.id, {
    ip,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  store.delete(PENDING_COOKIE);

  return NextResponse.json({
    ok: true,
    publicId: user.publicId,
    redirectTo: `/u/${user.publicId}/setup`,
  });
}
