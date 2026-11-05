export type CatalogCategory =
  | "RANK"
  | "UPGRADE"
  | "KEY"
  | "SHARDS"
  | "OTHER";

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  category: CatalogCategory;
  priceLabel: string;
  priceMinor: number;
  currency?: string;
  description?: string;
  color: string;
  dark: string;
  image: string;
  perks: string[];
  badge?: string;
  popular?: boolean;
  from?: string;
  to?: string;
};

/**
 * Seed catalog mirrored from hfq-network-main/src/data.
 * The database is the source of truth once MySQL is connected; this keeps the
 * storefront renderable before the first seed.
 */
export const catalog: CatalogProduct[] = [
  {
    id: "elite",
    slug: "elite",
    name: "ELITE",
    category: "RANK",
    priceLabel: "$1.99",
    priceMinor: 199,
    description: "The first step into HFQ ranks.",
    color: "#6fb5c4",
    dark: "#2c5561",
    image: "/images/ranks/elite.png",
    perks: ["[ELITE] prefix", "8 home slots", "Custom nickname colour", "Elite-only kit"],
  },
  {
    id: "heroic",
    slug: "heroic",
    name: "HEROIC",
    category: "RANK",
    priceLabel: "$3.99",
    priceMinor: 399,
    description: "The rank most players pick.",
    color: "#a66bff",
    dark: "#4b2a8a",
    image: "/images/ranks/heroic.png",
    popular: true,
    perks: [
      "Everything in ELITE",
      "[HEROIC] prefix",
      "10 home slots",
      "Heroic particle aura",
      "Reserved slot when full",
    ],
  },
  {
    id: "legend",
    slug: "legend",
    name: "LEGEND",
    category: "RANK",
    priceLabel: "$5.99",
    priceMinor: 599,
    description: "The full HFQ experience.",
    color: "#ff7a1a",
    dark: "#7a3000",
    image: "/images/ranks/legend.png",
    perks: [
      "Everything in HEROIC",
      "[LEGEND] prefix",
      "15 home slots",
      "Legend-only cosmetics",
      "Free monthly crate key",
    ],
  },
  {
    id: "elite-heroic",
    slug: "elite-heroic",
    name: "ELITE to HEROIC",
    category: "UPGRADE",
    priceLabel: "$2.00",
    priceMinor: 200,
    description: "Upgrade without losing your ELITE perks.",
    color: "#a66bff",
    dark: "#4b2a8a",
    image: "/images/ranks/heroic.png",
    from: "elite",
    to: "heroic",
    perks: ["Upgrade from ELITE to HEROIC", "Heroic prefix and aura", "10 home slots", "Keeps all your ELITE perks"],
  },
  {
    id: "heroic-legend",
    slug: "heroic-legend",
    name: "HEROIC to LEGEND",
    category: "UPGRADE",
    priceLabel: "$4.00",
    priceMinor: 400,
    description: "Take the final step up.",
    color: "#ff7a1a",
    dark: "#7a3000",
    image: "/images/ranks/legend.png",
    from: "heroic",
    to: "legend",
    perks: ["Upgrade from HEROIC to LEGEND", "Legend prefix and cosmetics", "15 home slots", "Free monthly crate key"],
  },
  {
    id: "key-blue",
    slug: "key-blue",
    name: "Frost Key",
    category: "KEY",
    priceLabel: "$2.99",
    priceMinor: 299,
    color: "#3aa8ff",
    dark: "#1b4f8a",
    image: "/images/store/Screenshot_2026-10-17_212524.png",
    perks: ["1x Frost crate key", "Opens the Frost crate", "Buy 5, get 1 free"],
  },
  {
    id: "key-purple",
    slug: "key-purple",
    name: "Void Key",
    category: "KEY",
    priceLabel: "$4.99",
    priceMinor: 499,
    color: "#a855ff",
    dark: "#4b2085",
    image: "/images/store/Screenshot_2026-10-17_212544.png",
    perks: ["1x Void crate key", "Opens the Void crate", "Buy 5, get 1 free"],
  },
  {
    id: "key-red",
    slug: "key-red",
    name: "Blood Key",
    category: "KEY",
    priceLabel: "$7.99",
    priceMinor: 799,
    color: "#ff2d46",
    dark: "#6b0a16",
    image: "/images/store/Screenshot_2026-10-17_212605.png",
    badge: "Most Popular",
    perks: ["1x Blood crate key", "Opens the Blood crate", "Buy 5, get 1 free"],
  },
  {
    id: "key-pink",
    slug: "key-pink",
    name: "Rose Key",
    category: "KEY",
    priceLabel: "$9.99",
    priceMinor: 999,
    color: "#ff4fd8",
    dark: "#7a1a6a",
    image: "/images/store/Screenshot_2026-10-17_212623.png",
    perks: ["1x Rose crate key", "Opens the Rose crate", "Buy 5, get 1 free"],
  },
  {
    id: "key-green",
    slug: "key-green",
    name: "Emerald Key",
    category: "KEY",
    priceLabel: "$14.99",
    priceMinor: 1499,
    color: "#2ee6a0",
    dark: "#0f6b4a",
    image: "/images/store/Screenshot_2026-10-17_212639.png",
    perks: ["1x Emerald crate key", "Opens the Emerald crate", "Buy 5, get 1 free"],
  },
  {
    id: "shards-100",
    slug: "shards-100",
    name: "100 Shards",
    category: "SHARDS",
    priceLabel: "$1.99",
    priceMinor: 199,
    color: "#5b8cff",
    dark: "#1f3a99",
    image: "/images/store/Screenshot_2026-10-17_212137.png",
    perks: ["100 Shards", "Delivered instantly", "Spend them in the shard shop"],
  },
  {
    id: "shards-250",
    slug: "shards-250",
    name: "250 Shards",
    category: "SHARDS",
    priceLabel: "$4.99",
    priceMinor: 499,
    color: "#7c6bff",
    dark: "#352a99",
    image: "/images/store/Screenshot_2026-10-17_212154.png",
    perks: ["250 Shards", "Delivered instantly", "Spend them in the shard shop"],
  },
  {
    id: "shards-500",
    slug: "shards-500",
    name: "500 Shards",
    category: "SHARDS",
    priceLabel: "$9.99",
    priceMinor: 999,
    color: "#a05cff",
    dark: "#4a2699",
    image: "/images/store/Screenshot_2026-10-17_212221.png",
    badge: "Best Value",
    perks: ["500 Shards", "+10% bonus shards", "Delivered instantly"],
  },
  {
    id: "shards-1000",
    slug: "shards-1000",
    name: "1,000 Shards",
    category: "SHARDS",
    priceLabel: "$19.99",
    priceMinor: 1999,
    color: "#3fb8ff",
    dark: "#175a80",
    image: "/images/store/Screenshot_2026-10-17_212237.png",
    perks: ["1,000 Shards", "+15% bonus shards", "Delivered instantly"],
  },
  {
    id: "shards-2500",
    slug: "shards-2500",
    name: "2,500 Shards",
    category: "SHARDS",
    priceLabel: "$44.99",
    priceMinor: 4499,
    color: "#c15cff",
    dark: "#5a2680",
    image: "/images/store/Screenshot_2026-10-17_212251.png",
    perks: ["2,500 Shards", "+20% bonus shards", "Delivered instantly"],
  },
  {
    id: "shards-5000",
    slug: "shards-5000",
    name: "5,000 Shards",
    category: "SHARDS",
    priceLabel: "$89.99",
    priceMinor: 8999,
    color: "#ff5cf0",
    dark: "#80267a",
    image: "/images/store/Screenshot_2026-10-17_212304.png",
    perks: ["5,000 Shards", "+25% bonus shards", "Delivered instantly"],
  },
];

export function productBySlug(slug: string) {
  return catalog.find((product) => product.slug === slug);
}

export function productsByCategory(category: CatalogCategory) {
  return catalog.filter((product) => product.category === category);
}
