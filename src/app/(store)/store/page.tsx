import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { SiteNav } from "@/components/layout/SiteNav";
import { PixelBackground } from "@/components/motion/PixelBackground";
import { StoreCatalog } from "@/components/store/StoreCatalog";
import { getStoreProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Store",
  description:
    "Buy HFQ ranks, upgrades, crate keys, and shards. Pay with Dialog eZ Cash or bank transfer.",
};

export default async function StorePage() {
  const products = await getStoreProducts();
  return (
    <>
      <SiteNav />
      <main className="store">
        <PixelBackground
          className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
          seed={11}
          density={70}
        />
        <div className="store-container">
          <div className="store-head">
            <p className="store-kicker reveal">
              <span className="pixel-diamond" aria-hidden="true" />
              SUPPORT THE SERVER
              <span className="pixel-diamond" aria-hidden="true" />
            </p>
            <h1 className="store-title reveal" style={{ "--i": 1 } as React.CSSProperties}>
              HFQ STORE
            </h1>
            <p className="store-sub reveal" style={{ "--i": 2 } as React.CSSProperties}>
              Ranks, crate keys, and shards. Every purchase goes straight back
              into the server. Pay with Dialog eZ Cash or a bank transfer, then
              upload your receipt for review.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 reveal" style={{ "--i": 3 } as React.CSSProperties}>
              <Link href="/login" className="mc-btn">
                Open dashboard
              </Link>
              <a
                href="https://hfqmc.xyz"
                className="btn-outline"
                target="_blank"
                rel="noreferrer"
              >
                Main site
                <span className="btn-circle" aria-hidden="true">
                  →
                </span>
              </a>
            </div>
          </div>

          <StoreCatalog products={products} />
        </div>
      </main>
      <Footer />
    </>
  );
}
