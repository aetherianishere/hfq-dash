import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

export const PENDING_COOKIE = "hfq_pending";
export const PENDING_TTL_SECONDS = 20 * 60;

const secret = new TextEncoder().encode(env.authSecret);

export type PendingRegistration = {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
};

export async function createPendingToken(data: PendingRegistration) {
  return new SignJWT({ ...data, kind: "pending-registration" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PENDING_TTL_SECONDS}s`)
    .sign(secret);
}

export async function readPendingToken(
  token: string | undefined,
): Promise<PendingRegistration | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.kind !== "pending-registration") return null;
    if (
      typeof payload.email !== "string" ||
      typeof payload.passwordHash !== "string" ||
      typeof payload.firstName !== "string" ||
      typeof payload.lastName !== "string"
    ) {
      return null;
    }
    return {
      email: payload.email,
      passwordHash: payload.passwordHash,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };
  } catch {
    return null;
  }
}
