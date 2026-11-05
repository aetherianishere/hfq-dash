import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { StoreCatalog } from "@/components/store/StoreCatalog";
import { getViewer } from "@/lib/auth/viewer";
import { getStoreProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Store" };

export default async function DashboardStorePage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const viewer = await getViewer(publicId);
  const products = await getStoreProducts();

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="section-label">STORE</p>
          <h1 className="page-title mt-2">Buy upgrades</h1>
          <p className="page-sub">
            Pay with Dialog eZ Cash or bank transfer. Every order is reviewed
            before delivery.
          </p>
        </div>
        <Link href="/store" className="btn-ghost">
          <ExternalLink size={14} />
          Public store
        </Link>
      </div>

      <div className="panel-soft mb-5 flex items-center gap-3 p-3 text-xs text-hfq-soft">
        <ShieldCheck size={16} className="shrink-0 text-hfq-green" />
        <span>
          Checkout is tied to your account{" "}
          <span className="mono text-hfq-gold">{viewer.publicId}</span>. Your
          receipts and delivery status stay in this dashboard.
        </span>
      </div>

      <StoreCatalog products={products} hrefBase={`/u/${viewer.publicId}/store`} />
    </div>
  );
}
