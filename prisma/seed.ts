import {
  DeliveryType,
  PrismaClient,
  ProductCategory,
} from "@prisma/client";
import { catalog } from "../src/data/catalog";

const prisma = new PrismaClient();

async function main() {
  for (const [index, product] of catalog.entries()) {
    const category = product.category as ProductCategory;

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        category,
        priceMinor: BigInt(product.priceMinor),
        currency: product.currency ?? "USD",
        description: product.description ?? null,
        perks: product.perks,
        color: product.color,
        dark: product.dark,
        imageUrl: product.image,
        badge: product.badge ?? null,
        popular: product.popular ?? false,
        sortOrder: index,
        active: true,
      },
      create: {
        slug: product.slug,
        name: product.name,
        category,
        priceMinor: BigInt(product.priceMinor),
        currency: product.currency ?? "USD",
        description: product.description ?? null,
        perks: product.perks,
        color: product.color,
        dark: product.dark,
        imageUrl: product.image,
        badge: product.badge ?? null,
        popular: product.popular ?? false,
        sortOrder: index,
        deliveryType: DeliveryType.MANUAL,
      },
    });
  }

  console.log(`Seeded ${catalog.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
