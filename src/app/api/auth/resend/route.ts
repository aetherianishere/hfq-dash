import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOtp, hashOtp, OTP_TTL_MS } from "@/lib/auth/otp";
import { PENDING_COOKIE, readPendingToken } from "@/lib/auth/pending";
import { rateLimit } from "@/lib/auth/rate-limit";
import { sendVerificationEmail } from "@/lib/email/send";
import { assertSameOrigin, clientIp, jsonError } from "@/lib/http";
import { resendSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const ip = clientIp(request);
  const ipLimited = rateLimit(`resend-ip:${ip}`, 10, 15 * 60_000);
  if (!ipLimited.ok) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = resendSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid email.");
  }

  const { email } = parsed.data;
  const emailLimited = rateLimit(`resend-email:${email}`, 3, 10 * 60_000);
  if (!emailLimited.ok) {
    return jsonError("A code was sent recently. Wait a few minutes.", 429);
  }

  const store = await cookies();
  const pending = await readPendingToken(store.get(PENDING_COOKIE)?.value);

  // Only send a new code for a signup that is actually in progress.
  if (!pending || pending.email !== email) {
    return jsonError(
      "Your signup session expired. Please create your account again.",
      400,
    );
  }

  const code = generateOtp();

  await prisma.verificationCode.deleteMany({
    where: { email, purpose: "REGISTER", consumedAt: null },
  });
  await prisma.verificationCode.create({
    data: {
      email,
      purpose: "REGISTER",
      codeHash: hashOtp(code, email),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      ip,
    },
  });

  try {
    await sendVerificationEmail({
      to: email,
      code,
      name: pending.firstName,
    });
  } catch (error) {
    console.error("[resend] email failed", error);
    return jsonError("We could not send the email. Try again.", 502);
  }

  return NextResponse.json({ ok: true });
}
