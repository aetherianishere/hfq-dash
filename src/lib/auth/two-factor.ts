import "server-only";

import { prisma } from "@/lib/db";
import { hashRecoveryCode, verifyTotp } from "@/lib/auth/totp";

/**
 * Accepts a time-based code or a one-time recovery code. Recovery codes are
 * consumed on use so a leaked code cannot be replayed.
 */
export async function verifySecondFactor(
  userId: string,
  encryptedSecret: string | null,
  rawCode: string,
) {
  const code = rawCode.trim();

  if (encryptedSecret && verifyTotp(encryptedSecret, code)) {
    return true;
  }

  if (!code) return false;

  const match = await prisma.recoveryCode.findFirst({
    where: {
      userId,
      codeHash: hashRecoveryCode(code),
      usedAt: null,
    },
    select: { id: true },
  });

  if (!match) return false;

  await prisma.recoveryCode.update({
    where: { id: match.id },
    data: { usedAt: new Date() },
  });

  return true;
}
