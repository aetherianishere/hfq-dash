import type { Metadata } from "next";
import Link from "next/link";
import { Edit, Package, Plus } from "lucide-react";
import { ArchiveProductButton } from "@/components/admin/ArchiveProductButton";
import { requireAdminPage } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { catalog } from "@/data/catalog";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };

type Row = {
  id: string;
  slug: string;
  name: string;
  category: string;
  priceLabel: string;
  active: boolean;
  popular: boolean;
  sortOrder: number;
  imageUrl: string | null;
  updatedAt: Date;
};

export default async function AdminProductsPage() {
  const admin = await requireAdminPage();
  const demo = admin.isDemo;

  let rows: Row[] = [];
  if (demo) {
    rows = catalog.map((product, index) => ({
      id: product.slug,
      slug: product.slug,
      name: product.name,
      category: product.category,
      priceLabel: product.priceLabel,
      active: true,
      popular: product.popular ?? false,
      sortOrder: index,
      imageUrl: product.image,
      updatedAt: new Date(),
    }));
  } else {
    try {
      const products = await prisma.product.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });
      rows = products.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        priceLabel: formatMoney(product.priceMinor, product.currency),
        active: product.active,
        popular: product.popular,
        sortOrder: product.sortOrder,
        imageUrl: product.imageUrl,
        updatedAt: product.updatedAt,
      }));
    } catch (error) {
      console.error("[admin] products query failed", error);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="section-label">STOREFRONT</p>
          <h1 className="page-title mt-2">Products</h1>
          <p className="page-sub">
            Add ranks, upgrades, keys, shards, and other items. Archived products
            stay attached to past orders.
          </p>
        </div>
        <Link href="/admin/products/new" className="mc-btn mc-btn-sm">
          <Plus size={15} />
          Add product
        </Link>
      </div>

      {demo && (
        <div className="auth-error mb-5">
          Demo preview. Connect MySQL and disable DEMO_MODE to save changes.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="table-panel">
          <div className="empty-state">
            <Package size={28} className="text-hfq-dim" />
            <div>
              <p className="font-display text-lg text-hfq-text">No products yet</p>
              <p className="mt-1 text-sm">
                Add your first product and it will appear on the storefront.
              </p>
            </div>
            <Link href="/admin/products/new" className="mc-btn mc-btn-sm mt-2">
              <Plus size={14} /> Add product
            </Link>
          </div>
        </div>
      ) : (
        <div className="table-panel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Visible</th>
                <th>Sort</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center border-2 border-ink bg-bg">
                        {row.imageUrl ? (
                          <img
                            src={row.imageUrl}
                            alt=""
                            className="h-full w-full object-contain p-0.5"
                          />
                        ) : (
                          <Package size={15} className="text-hfq-dim" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-sm text-hfq-text">
                          {row.name}
                          {row.popular && (
                            <span className="ml-2 text-[9px] text-hfq-gold">
                              POPULAR
                            </span>
                          )}
                        </div>
                        <div className="mono text-[10px] text-hfq-dim">
                          /store/{row.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{row.category}</td>
                  <td className="mono">{row.priceLabel}</td>
                  <td>
                    <span className={`badge ${row.active ? "badge-green" : "badge-dim"}`}>
                      {row.active ? "Visible" : "Archived"}
                    </span>
                  </td>
                  <td className="mono">{row.sortOrder}</td>
                  <td className="whitespace-nowrap text-xs">
                    {row.updatedAt.toLocaleDateString("en-GB")}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${row.id}`}
                        className="btn-ghost"
                      >
                        <Edit size={13} />
                        Edit
                      </Link>
                      {row.active && (
                        <ArchiveProductButton
                          id={row.id}
                          name={row.name}
                          demo={demo}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
