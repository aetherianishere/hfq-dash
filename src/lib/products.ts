import "server-only";

import type { Product } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  catalog as fallbackCatalog,
  type CatalogCategory,
  type CatalogProduct,
} from "@/data/catalog";
import { formatMoney } from "@/lib/utils";

const CATEGORY_VALUES: CatalogCategory[] = [
  "RANK",
  "UPGRADE",
  "KEY",
  "SHARDS",
  "OTHER",
];

function category(value: string): CatalogCategory {
  return CATEGORY_VALUES.includes(value as CatalogCategory)
    ? (value as CatalogCategory)
    : "OTHER";
}

function perks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function toCatalogProduct(product: Product): CatalogProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: category(product.category),
    priceLabel: formatMoney(product.priceMinor, product.currency),
    priceMinor: Number(product.priceMinor),
    currency: product.currency,
    description: product.description ?? undefined,
    color: product.color ?? "#ff3047",
    dark: product.dark ?? "#7a0f1f",
    image: product.imageUrl ?? "/images/logo.png",
    perks: perks(product.perks),
    badge: product.badge ?? undefined,
    popular: product.popular,
  };
}

/**
 * Storefront reads the database in production. DEMO_MODE keeps the original
 * static catalog renderable without MySQL.
 */
export async function getStoreProducts(): Promise<CatalogProduct[]> {
  if (process.env.DEMO_MODE === "1") return fallbackCatalog;

  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return products.map(toCatalogProduct);
  } catch (error) {
    console.error("[products] storefront query failed", error);
    return fallbackCatalog;
  }
}

export async function getStoreProduct(
  slug: string,
): Promise<CatalogProduct | null> {
  if (process.env.DEMO_MODE === "1") {
    return fallbackCatalog.find((product) => product.slug === slug) ?? null;
  }

  try {
    const product = await prisma.product.findFirst({
      where: { slug, active: true },
    });
    return product ? toCatalogProduct(product) : null;
  } catch (error) {
    console.error("[products] product query failed", error);
    return fallbackCatalog.find((item) => item.slug === slug) ?? null;
  }
}

export function productPerks(value: unknown): string[] {
  return perks(value);
}
