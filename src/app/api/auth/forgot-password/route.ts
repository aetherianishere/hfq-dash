import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOtp, hashOtp, OTP_TTL_MS } from "@/lib/auth/otp";
import { rateLimit } from "@/lib/auth/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email/send";
import { assertSameOrigin, clientIp, jsonError } from "@/lib/http";
import { forgotPasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const ip = clientIp(request);
  const limited = rateLimit(`forgot:${ip}`, 10, 15 * 60_000);
  if (!limited.ok) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Enter a valid email.");
  }

  const { email } = parsed.data;
  const emailLimited = rateLimit(`forgot-email:${email}`, 3, 10 * 60_000);
  if (!emailLimited.ok) {
    return jsonError("A reset code was sent recently. Wait a few minutes.", 429);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      isSuspended: true,
      profile: { select: { firstName: true } },
    },
  });

  // Always return the same response so the endpoint cannot be used to test
  // whether an email is registered.
  const generic = {
    ok: true,
    message:
      "If that email is registered, a reset code is on its way. Check your inbox.",
    redirectTo: `/reset-password?email=${encodeURIComponent(email)}`,
  };

  if (!user || user.isSuspended) return NextResponse.json(generic);

  const code = generateOtp();

  await prisma.verificationCode.deleteMany({
    where: { email, purpose: "RESET", consumedAt: null },
  });
  await prisma.verificationCode.create({
    data: {
      email,
      purpose: "RESET",
      codeHash: hashOtp(code, email),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      ip,
    },
  });

  try {
    await sendPasswordResetEmail({
      to: email,
      code,
      name: user.profile?.firstName,
    });
  } catch (error) {
    console.error("[forgot-password] email failed", error);
  }

  return NextResponse.json(generic);
}
