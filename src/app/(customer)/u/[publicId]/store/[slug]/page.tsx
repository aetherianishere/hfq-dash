import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { getViewer } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { getStoreProduct } from "@/lib/products";

type Params = { publicId: string; slug: string };

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ params }: { params: Promise<Params> }) {
  const { publicId, slug } = await params;
  const viewer = await getViewer(publicId);
  const product = await getStoreProduct(slug);
  if (!product) notFound();

  let availableMethods: Array<"BANK" | "EZCASH"> = ["BANK", "EZCASH"];
  if (!viewer.isDemo) {
    try {
      const accounts = await prisma.paymentAccount.findMany({
        where: { active: true },
        select: { method: true },
        distinct: ["method"],
        orderBy: { sortOrder: "asc" },
      });
      availableMethods = accounts
        .map((account) => account.method)
        .filter(
          (method): method is "BANK" | "EZCASH" =>
            method === "BANK" || method === "EZCASH",
        );
    } catch (error) {
      console.error("[checkout] payment methods failed", error);
      availableMethods = [];
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/u/${viewer.publicId}/store`}
        className="mb-6 inline-flex items-center gap-2 font-display text-sm text-hfq-soft hover:text-hfq-gold"
      >
        <ArrowLeft size={15} />
        Back to store
      </Link>

      <div className="page-head">
        <div>
          <p className="section-label">CHECKOUT</p>
          <h1 className="page-title mt-2">Buy {product.name}</h1>
          <p className="page-sub">
            Pay with Dialog eZ Cash or a bank transfer, then upload your receipt.
          </p>
        </div>
        <span className="status-pill">
          <ShieldCheck size={13} className="text-hfq-green" />
          Manual review
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="pay-card">
          <div className="grid h-44 place-items-center border-[3px] border-ink bg-[rgba(11,4,6,0.45)] p-3">
            <img
              src={product.image}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <h2 className="mt-4 font-display text-2xl text-hfq-text">
            {product.name}
          </h2>
          <p className="mt-1 font-display text-xl text-hfq-gold">
            {product.priceLabel}
          </p>
          {product.description && (
            <p className="mt-2 text-sm text-hfq-soft">{product.description}</p>
          )}
          <ul className="mt-4 flex flex-col gap-2">
            {product.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2 text-xs text-hfq-soft">
                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center border-2 border-ink bg-hfq-gold">
                  <Check size={9} strokeWidth={4} className="text-ink" />
                </span>
                {perk}
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t-2 border-ink pt-3 text-[10px] leading-relaxed text-hfq-dim">
            Delivery is manual. Staff verify your payment before running the
            in-game command. You will see every status change in your orders.
          </div>
        </div>

        <CheckoutForm
          productSlug={product.slug}
          productName={product.name}
          priceLabel={product.priceLabel}
          defaultMinecraftUsername={viewer.profile?.minecraftUsername ?? ""}
          demo={viewer.isDemo}
          availableMethods={availableMethods}
        />
      </div>
    </div>
  );
}
