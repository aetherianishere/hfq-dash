import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  ProductForm,
  type ProductFormInitial,
} from "@/components/admin/ProductForm";
import { requireAdminPage } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { catalog } from "@/data/catalog";
import { productPerks } from "@/lib/products";

export const metadata: Metadata = { title: "Edit product" };

function minorToInput(minor: bigint) {
  const value = Number(minor);
  return (value / 100).toFixed(2);
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdminPage();
  const { id } = await params;

  let initial: ProductFormInitial | null = null;
  let slug = "";

  if (admin.isDemo) {
    const product = catalog.find((item) => item.slug === id);
    if (!product) notFound();
    initial = {
      id: product.slug,
      name: product.name,
      slug: product.slug,
      category: product.category,
      price: (product.priceMinor / 100).toFixed(2),
      currency: product.currency ?? "USD",
      description: product.description ?? "",
      perks: product.perks.join("\n"),
      color: product.color,
      dark: product.dark,
      imageUrl: product.image,
      badge: product.badge ?? "",
      popular: product.popular ?? false,
      active: true,
      sortOrder: 0,
      deliveryType: "MANUAL",
      deliveryCommand: "",
    };
    slug = product.slug;
  } else {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) notFound();
    initial = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      price: minorToInput(product.priceMinor),
      currency: product.currency,
      description: product.description ?? "",
      perks: productPerks(product.perks).join("\n"),
      color: product.color ?? "#ff3047",
      dark: product.dark ?? "#7a0f1f",
      imageUrl: product.imageUrl,
      badge: product.badge ?? "",
      popular: product.popular,
      active: product.active,
      sortOrder: product.sortOrder,
      deliveryType: product.deliveryType,
      deliveryCommand: product.deliveryCommand ?? "",
    };
    slug = product.slug;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 font-display text-sm text-hfq-soft hover:text-hfq-gold"
        >
          <ArrowLeft size={15} />
          Back to products
        </Link>
        {!admin.isDemo && (
          <Link
            href={`/store/${slug}`}
            target="_blank"
            className="btn-ghost"
          >
            <ExternalLink size={14} />
            View on store
          </Link>
        )}
      </div>

      <div className="page-head">
        <div>
          <p className="section-label">STOREFRONT</p>
          <h1 className="page-title mt-2">Edit {initial.name}</h1>
          <p className="page-sub">
            Saving updates the storefront immediately.
          </p>
        </div>
      </div>

      <ProductForm mode="edit" initial={initial} demo={admin.isDemo} />
    </div>
  );
}
