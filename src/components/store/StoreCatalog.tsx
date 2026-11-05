"use client";

import { useState } from "react";
import { Box, Gem, KeyRound, Shield, Sparkles } from "lucide-react";
import type { CatalogCategory, CatalogProduct } from "@/data/catalog";
import { ProductCard } from "./ProductCard";

const TABS: {
  id: CatalogCategory;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: "RANK", label: "Ranks", icon: <Shield size={16} /> },
  { id: "UPGRADE", label: "Upgrades", icon: <Sparkles size={16} /> },
  { id: "KEY", label: "Keys", icon: <KeyRound size={16} /> },
  { id: "SHARDS", label: "Shards", icon: <Gem size={16} /> },
  { id: "OTHER", label: "Other", icon: <Box size={16} /> },
];

export function StoreCatalog({
  products,
  hrefBase = "/store",
}: {
  products: CatalogProduct[];
  hrefBase?: string;
}) {
  const availableTabs = TABS.filter(
    (tab) =>
      tab.id !== "OTHER" ||
      products.some((product) => product.category === "OTHER"),
  );
  const firstTab = availableTabs[0]?.id ?? "RANK";
  const [active, setActive] = useState<CatalogCategory>(firstTab);
  const [prevIndex, setPrevIndex] = useState(0);

  const activeIndex = availableTabs.findIndex((tab) => tab.id === active);
  const direction = activeIndex >= prevIndex ? "fwd" : "back";
  const visible = products.filter((product) => product.category === active);

  const change = (id: CatalogCategory) => {
    setPrevIndex(activeIndex);
    setActive(id);
  };

  return (
    <div>
      <div className="store-tabs" role="tablist" aria-label="Store categories">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            className={`store-tab ${active === tab.id ? "is-active" : ""}`}
            onClick={() => change(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div
        key={active}
        className={
          direction === "fwd" ? "store-panel-fwd" : "store-panel-back"
        }
        role="tabpanel"
      >
        <div
          className={
            active === "UPGRADE"
              ? "store-grid store-grid-2"
              : "store-grid"
          }
        >
          {visible.length === 0 && (
            <div className="table-panel sm:col-span-2 lg:col-span-3">
              <div className="empty-state">
                <img src="/images/logo.png" alt="" />
                <div>
                  <p className="font-display text-lg text-hfq-text">
                    Nothing here yet
                  </p>
                  <p className="mt-1 text-sm">
                    Staff can add products from the admin panel.
                  </p>
                </div>
              </div>
            </div>
          )}
          {visible.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              hrefBase={hrefBase}
            />
          ))}
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-hfq-dim">
        Every purchase is reviewed by our staff before delivery. You will be
        asked to upload a screenshot or PDF of your payment receipt after
        checkout.
      </p>
    </div>
  );
}
