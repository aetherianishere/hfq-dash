import "server-only";

import { randomBytes, randomInt } from "node:crypto";
import { prisma } from "@/lib/db";

export async function generateOrderNumber() {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const number = `HFQ-${year}-${String(randomInt(1, 10_000)).padStart(4, "0")}`;
    const existing = await prisma.order.findUnique({
      where: { orderNumber: number },
      select: { id: true },
    });
    if (!existing) return number;
  }

  throw new Error("Could not generate a unique order number.");
}

export function generatePaymentReference(orderNumber: string) {
  return `${orderNumber}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export function buildDeliveryCommand(
  template: string | null | undefined,
  minecraftUsername: string,
  fallback: string,
) {
  if (!template?.trim()) return fallback;
  return template
    .replaceAll("{username}", minecraftUsername)
    .replaceAll("{player}", minecraftUsername);
}
