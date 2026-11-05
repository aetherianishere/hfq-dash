import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { assertSameOrigin, jsonError } from "@/lib/http";
import { generateOrderNumber, generatePaymentReference } from "@/lib/orders";

export const runtime = "nodejs";

const bodySchema = z.object({
  productSlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid product."),
  paymentMethod: z.enum(["EZCASH", "BANK"]),
  minecraftUsername: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9_]{3,16}$/,
      "Enter a valid Minecraft username (3-16 letters, numbers, underscores).",
    ),
  customerNote: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const session = await getSession();
  if (!session) return jsonError("Sign in to create an order.", 401);
  if (!session.user.emailVerified) {
    return jsonError("Verify your email before creating an order.", 403);
  }

  const limited = rateLimit(`order:create:${session.user.id}`, 6, 60 * 60_000);
  if (!limited.ok) {
    return jsonError("Too many orders. Please try again later.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid order details.");
  }

  const { productSlug, paymentMethod, minecraftUsername, customerNote } = parsed.data;

  const product = await prisma.product.findFirst({
    where: { slug: productSlug, active: true },
  });
  if (!product) return jsonError("This product is not available.", 404);

  const account = await prisma.paymentAccount.findFirst({
    where: { method: paymentMethod, active: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
  if (!account) {
    return jsonError(
      "That payment method is not available right now. Choose another option.",
      409,
    );
  }

  const orderNumber = await generateOrderNumber();
  const paymentReference = generatePaymentReference(orderNumber);
  const expiresAt = new Date(Date.now() + 48 * 60 * 60_000);

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          status: "AWAITING_PAYMENT",
          subtotalMinor: product.priceMinor,
          discountMinor: BigInt(0),
          totalMinor: product.priceMinor,
          currency: product.currency,
          paymentMethod,
          paymentAccountId: account?.id ?? null,
          paymentReference,
          minecraftUsername,
          customerNote: customerNote || null,
          expiresAt,
          items: {
            create: {
              productId: product.id,
              nameSnapshot: product.name,
              priceMinor: product.priceMinor,
              quantity: 1,
              perksSnapshot: product.perks ?? undefined,
            },
          },
        },
      });

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: "ORDER_CREATED",
          actorId: session.user.id,
          payload: { product: product.slug, paymentMethod },
        },
      });

      await tx.notification.create({
        data: {
          userId: session.user.id,
          title: "Order created",
          message: `Order ${orderNumber} is waiting for payment. Open it to see the bank or eZ Cash details.`,
          type: "INFO",
          link: `/u/${session.user.publicId}/orders/${orderNumber}`,
        },
      });
    });
  } catch (error) {
    console.error("[orders] create failed", error);
    return jsonError("Could not create the order. Please try again.", 500);
  }

  return NextResponse.json(
    {
      ok: true,
      orderNumber,
      redirectTo: `/u/${session.user.publicId}/orders/${orderNumber}`,
    },
    { status: 201 },
  );
}
