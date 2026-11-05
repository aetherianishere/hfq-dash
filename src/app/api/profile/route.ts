import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { assertSameOrigin, jsonError } from "@/lib/http";

const schema = z.object({
  displayName: z.string().trim().min(2).max(32).optional(),
  minecraftUsername: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9_]{3,16}$/,
      "Minecraft usernames are 3–16 letters, numbers, or underscores.",
    )
    .optional(),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid birthday.")
    .optional(),
  country: z.string().trim().min(2).max(56).optional(),
  bio: z.string().trim().max(300).optional(),
  marketingOptIn: z.boolean().optional(),
  avatarUrl: z.string().trim().url().max(500).optional(),
  completeSetup: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const session = await getSession();
  if (!session) {
    return jsonError("Sign in required.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid profile.");
  }

  const input = parsed.data;

  if (input.birthday) {
    const birthday = new Date(`${input.birthday}T00:00:00.000Z`);
    if (Number.isNaN(birthday.getTime()) || birthday > new Date()) {
      return jsonError("Enter a valid birthday.", 400);
    }
  }

  const data: Record<string, unknown> = {};

  if (input.displayName !== undefined) data.displayName = input.displayName;
  if (input.minecraftUsername !== undefined) {
    data.minecraftUsername = input.minecraftUsername;
  }
  if (input.birthday !== undefined) {
    data.birthday = new Date(`${input.birthday}T00:00:00.000Z`);
  }
  if (input.country !== undefined) data.country = input.country;
  if (input.bio !== undefined) data.bio = input.bio;
  if (input.marketingOptIn !== undefined) {
    data.marketingOptIn = input.marketingOptIn;
  }
  if (input.avatarUrl !== undefined) {
    data.avatarUrl = input.avatarUrl;
  } else if (input.minecraftUsername) {
    data.avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(
      input.minecraftUsername,
    )}/128`;
  }
  if (input.completeSetup) data.setupStep = 4;

  try {
    await prisma.profile.update({
      where: { userId: session.user.id },
      data: data as Prisma.ProfileUpdateInput,
    });
  } catch (error) {
    console.error("[profile] update failed", error);
    return jsonError("Could not save your profile.", 500);
  }

  return NextResponse.json({
    ok: true,
    publicId: session.user.publicId,
    redirectTo: `/u/${session.user.publicId}`,
  });
}
