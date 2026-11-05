import "server-only";

import type { Prisma } from "@prisma/client";

/**
 * Audit payloads are stored as JSON. Prisma's BigInt values and Date objects
 * are converted to strings so a product price or timestamp never breaks a
 * write.
 */
export function jsonSnapshot(value: unknown): Prisma.InputJsonValue {
  if (value === undefined) return {};
  return JSON.parse(
    JSON.stringify(value, (_key, item) =>
      typeof item === "bigint" ? item.toString() : item,
    ),
  ) as Prisma.InputJsonValue;
}

type AuditInput = {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
};

export async function writeAudit(
  tx: Prisma.TransactionClient,
  input: AuditInput,
) {
  await tx.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      before: input.before === undefined ? undefined : jsonSnapshot(input.before),
      after: input.after === undefined ? undefined : jsonSnapshot(input.after),
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}
