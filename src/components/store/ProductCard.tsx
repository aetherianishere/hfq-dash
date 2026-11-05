"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { CatalogProduct } from "@/data/catalog";

type Props = {
  product: CatalogProduct;
  index: number;
  hrefBase?: string;
};

export function ProductCard({ product, index, hrefBase = "/store" }: Props) {
  const isRank = product.category === "RANK";
  const isUpgrade = product.category === "UPGRADE";
  const isItem = !isRank && !isUpgrade;

  const style = {
    "--rc": product.color,
    "--rc-dark": product.dark,
    "--i": index,
  } as React.CSSProperties;

  return (
    <article
      className={[
        "srank",
        "reveal",
        product.popular ? "is-popular" : "",
        isUpgrade ? "srank-upgrade" : "",
        isItem ? "srank-item" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {product.popular && <div className="srank-popular">MOST POPULAR</div>}

      <div className="srank-stage">
        <div className="srank-glow" />

        {isRank && (
          <>
            <div className="srank-badge">
              <span>{product.name}</span>
            </div>
            <img
              className="srank-char"
              src={product.image}
              alt={`${product.name} rank`}
            />
          </>
        )}

        {isUpgrade && (
          <>
            {product.from && (
              <img
                className="up-char up-from"
                src={`/images/ranks/${product.from}.png`}
                alt=""
              />
            )}
            {product.from && <span className="up-arrow" aria-hidden="true" />}
            <img
              className="up-char"
              src={product.image}
              alt={`${product.name} upgrade`}
            />
            <div className="srank-badge" style={{ top: "0.9rem" }}>
              <span>{product.name}</span>
            </div>
          </>
        )}

        {isItem && (
          <>
            {product.badge && (
              <div className="srank-popular">{product.badge}</div>
            )}
            <img
              className="item-img"
              src={product.image}
              alt={product.name}
            />
          </>
        )}
      </div>

      <div className="srank-body">
        <div className="srank-price">
          <span className="srank-amount">{product.priceLabel}</span>
          <span className="srank-period">one-time</span>
        </div>

        {!isRank && (
          <h3 className="mt-2 font-display text-xl text-hfq-text">
            {product.name}
          </h3>
        )}

        {product.description && (
          <p className="srank-description">{product.description}</p>
        )}

        <ul className="srank-perks">
          {product.perks.map((perk) => (
            <li key={perk}>
              <Check size={14} strokeWidth={4} />
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        <Link
          href={`${hrefBase}/${product.slug}`}
          className="mc-btn srank-btn"
          aria-label={`Buy ${product.name}`}
        >
          Buy now
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
