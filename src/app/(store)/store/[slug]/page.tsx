import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Lock, ShoppingBag } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { SiteNav } from "@/components/layout/SiteNav";
import { PixelBackground } from "@/components/motion/PixelBackground";
import { getSession } from "@/lib/auth/session";
import { getStoreProduct } from "@/lib/products";

type Params = { slug: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStoreProduct(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} — ${product.priceLabel}`,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const product = await getStoreProduct(slug);
  if (!product) notFound();

  const session =
    process.env.DEMO_MODE === "1" ? null : await getSession();
  const buyHref = session
    ? `/u/${session.user.publicId}/store/${product.slug}`
    : `/login?next=${encodeURIComponent(`/store/${product.slug}`)}`;

  const style = {
    "--rc": product.color,
    "--rc-dark": product.dark,
  } as React.CSSProperties;

  return (
    <>
      <SiteNav />
      <main className="store" style={style}>
        <PixelBackground
          className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
          seed={23}
          density={60}
        />
        <div className="store-container max-w-5xl">
          <Link
            href="/store"
            className="mb-8 inline-flex items-center gap-2 font-display text-sm text-hfq-soft hover:text-hfq-gold"
          >
            <ArrowLeft size={16} />
            Back to store
          </Link>

          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div className="srank reveal" style={{ "--i": 0 } as React.CSSProperties}>
              <div className="srank-stage" style={{ height: 360 }}>
                <div className="srank-glow" />
                {product.category === "RANK" || product.category === "UPGRADE" ? (
                  <img
                    className="srank-char"
                    src={product.image}
                    alt={product.name}
                  />
                ) : (
                  <img
                    className="item-img"
                    src={product.image}
                    alt={product.name}
                  />
                )}
              </div>
            </div>

            <div className="reveal" style={{ "--i": 1 } as React.CSSProperties}>
              <p className="section-label">HFQ STORE</p>
              <h1 className="mt-3 font-display text-4xl leading-none text-hfq-text md:text-5xl">
                {product.name}
              </h1>
              <p className="mt-3 font-display text-3xl text-hfq-gold">
                {product.priceLabel}
              </p>
              {product.description && (
                <p className="mt-4 max-w-lg text-hfq-soft">
                  {product.description}
                </p>
              )}

              <ul className="mt-6 flex flex-col gap-2">
                {product.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-3 text-sm">
                    <span
                      className="grid h-5 w-5 place-items-center border-2 border-ink"
                      style={{ background: product.color }}
                    >
                      <Check size={12} strokeWidth={4} color="#0b0406" />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={buyHref} className="mc-btn">
                  {session ? <ShoppingBag size={16} /> : <Lock size={16} />}
                  {session ? "Continue to checkout" : "Sign in to purchase"}
                </Link>
                {!session && (
                  <Link href="/register" className="btn-outline">
                    Create account
                    <span className="btn-circle" aria-hidden="true">
                      <ArrowRight size={16} />
                    </span>
                  </Link>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-4 text-xs text-hfq-dim">
                <span>Dialog eZ Cash</span>
                <span>Bank transfer</span>
                <span>Manual review</span>
                <span>Receipt upload</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
