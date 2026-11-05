import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { createTotpSetup } from "@/lib/auth/totp";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/http";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const session = await getSession();
  if (!session) return jsonError("Sign in to continue.", 401);

  const limited = rateLimit(`totp-setup:${session.user.id}`, 8, 15 * 60_000);
  if (!limited.ok) {
    return jsonError("Too many attempts. Try again later.", 429);
  }

  if (session.user.totpEnabled) {
    return jsonError("Two-factor authentication is already enabled.", 409);
  }

  const setup = createTotpSetup(session.user.email);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpSecret: setup.encrypted },
  });

  return NextResponse.json({
    ok: true,
    secret: setup.secret,
    uri: setup.uri,
  });
}
