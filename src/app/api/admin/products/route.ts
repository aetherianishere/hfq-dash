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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string) {
  const root = base || "product";
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`;
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique product slug.");
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const admin = await getAdminSession();
  if (!admin) return jsonError("Admin access required.", 403);

  const limited = rateLimit(`admin:product:${admin.id}`, 30, 10 * 60_000);
  if (!limited.ok) {
    return jsonError("Too many product changes. Try again later.", 429);
  }

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

  const image = form.get("image");
  let imageUrl: string | null = null;
  if (image instanceof File && image.size > 0) {
    try {
      imageUrl = (await saveProductImage(image)).url;
    } catch (error) {
      if (error instanceof UploadError) return jsonError(error.message, 400);
      console.error("[products] image upload failed", error);
      return jsonError("Could not save the product image.", 500);
    }
  }

  let slug: string;
  if (input.slug) {
    const existing = await prisma.product.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (existing) return jsonError("That slug is already in use.", 409);
    slug = input.slug;
  } else {
    slug = await uniqueSlug(slugify(input.name));
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          slug,
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
        action: "PRODUCT_CREATED",
        entityType: "Product",
        entityId: created.id,
        after: created,
        ip: clientIp(request),
        userAgent: request.headers.get("user-agent"),
      });

      return created;
    });

    revalidatePath("/store");
    revalidatePath(`/store/${product.slug}`);
    revalidatePath("/admin/products");

    return NextResponse.json({
      ok: true,
      product: { id: product.id, slug: product.slug },
    });
  } catch (error) {
    console.error("[products] create failed", error);
    return jsonError("Could not create the product.", 500);
  }
}
