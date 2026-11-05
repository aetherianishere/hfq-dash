import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdminPage } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const admin = await requireAdminPage();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/products"
        className="mb-5 inline-flex items-center gap-2 font-display text-sm text-hfq-soft hover:text-hfq-gold"
      >
        <ArrowLeft size={15} />
        Back to products
      </Link>

      <div className="page-head">
        <div>
          <p className="section-label">STOREFRONT</p>
          <h1 className="page-title mt-2">Add product</h1>
          <p className="page-sub">
            This goes live on the storefront as soon as you save it.
          </p>
        </div>
      </div>

      <ProductForm mode="create" demo={admin.isDemo} />
    </div>
  );
}
