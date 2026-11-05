import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin";
import { rateLimit } from "@/lib/auth/rate-limit";
import { assertSameOrigin, clientIp, jsonError } from "@/lib/http";
import { writeAudit } from "@/lib/audit";
import { saveProductImage, UploadError } from "@/lib/uploads";
import {
  parsePerks,
  parsePriceToMinor,
  productInputSchema,
} from "@/lib/admin/validation";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const admin = await getAdminSession();
  if (!admin) return jsonError("Admin access required.", 403);

  const limited = rateLimit(`admin:product:${admin.id}`, 30, 10 * 60_000);
  if (!limited.ok) {
    return jsonError("Too many product changes. Try again later.", 429);
  }

  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return jsonError("Product not found.", 404);

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError("Invalid product form.", 400);

  const parsed = productInputSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid product details.");
  }

  const input = parsed.data;
  if (input.deliveryType === "COMMAND" && !input.deliveryCommand) {
    return jsonError("Add the delivery command or switch to manual delivery.");
  }

  let priceMinor: number;
  try {
    priceMinor = parsePriceToMinor(input.price);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid price.");
  }

  if (input.serverId) {
    const server = await prisma.server.findUnique({
      where: { id: input.serverId },
      select: { id: true },
    });
    if (!server) return jsonError("The selected server does not exist.");
  }

  if (input.slug && input.slug !== existing.slug) {
    const taken = await prisma.product.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (taken) return jsonError("That slug is already in use.", 409);
  }

  const image = form.get("image");
  let imageUrl = existing.imageUrl;
  if (image instanceof File && image.size > 0) {
    try {
      imageUrl = (await saveProductImage(image)).url;
    } catch (error) {
      if (error instanceof UploadError) return jsonError(error.message, 400);
      console.error("[products] image upload failed", error);
      return jsonError("Could not save the product image.", 500);
    }
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          slug: input.slug ?? existing.slug,
          name: input.name,
          category: input.category,
          priceMinor: BigInt(priceMinor),
          currency: input.currency,
          description: input.description ?? null,
          perks: parsePerks(input.perks),
          color: input.color ?? null,
          dark: input.dark ?? null,
          imageUrl,
          badge: input.badge ?? null,
          popular: input.popular === "true",
          active: input.active === "true",
          sortOrder: input.sortOrder,
          deliveryType: input.deliveryType,
          deliveryCommand: input.deliveryCommand ?? null,
          serverId: input.serverId ?? null,
        },
      });

      await writeAudit(tx, {
        actorId: admin.id,
        action: "PRODUCT_UPDATED",
        entityType: "Product",
        entityId: updated.id,
        before: existing,
        after: updated,
        ip: clientIp(request),
        userAgent: request.headers.get("user-agent"),
      });

      return updated;
    });

    revalidatePath("/store");
    revalidatePath(`/store/${existing.slug}`);
    revalidatePath(`/store/${product.slug}`);
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${product.id}`);

    return NextResponse.json({
      ok: true,
      product: { id: product.id, slug: product.slug },
    });
  } catch (error) {
    console.error("[products] update failed", error);
    return jsonError("Could not update the product.", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const admin = await getAdminSession();
  if (!admin) return jsonError("Admin access required.", 403);

  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return jsonError("Product not found.", 404);

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: { active: false },
      });

      await writeAudit(tx, {
        actorId: admin.id,
        action: "PRODUCT_ARCHIVED",
        entityType: "Product",
        entityId: id,
        before: existing,
        after: updated,
        ip: clientIp(request),
        userAgent: request.headers.get("user-agent"),
      });
    });

    revalidatePath("/store");
    revalidatePath(`/store/${existing.slug}`);
    revalidatePath("/admin/products");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[products] archive failed", error);
    return jsonError("Could not archive the product.", 500);
  }
}
