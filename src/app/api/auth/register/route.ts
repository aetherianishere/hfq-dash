import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { assertSameOrigin, clientIp, jsonError } from "@/lib/http";
import { registerSchema } from "@/lib/validation";
import { generateUniquePublicId } from "@/lib/user-id";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const ip = clientIp(request);
  const limited = rateLimit(`register:${ip}`, 5, 15 * 60_000);
  if (!limited.ok) {
    return jsonError("Too many attempts. Please try again later.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid details.");
  }

  const { firstName, lastName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return jsonError("An account with this email already exists.", 409);
  }

  const passwordHash = await hashPassword(password);
  const publicId = await generateUniquePublicId(async (id) => {
    const found = await prisma.user.findUnique({
      where: { publicId: id },
      select: { id: true },
    });
    return found !== null;
  });

  const user = await prisma.user.create({
    data: {
      publicId,
      email,
      passwordHash,
      emailVerified: true,
      profile: {
        create: {
          firstName,
          lastName,
        },
      },
    },
  });

  await createSession(user.id, {
    ip,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({
    ok: true,
    publicId: user.publicId,
    redirectTo: `/u/${user.publicId}/setup`,
  });
}
