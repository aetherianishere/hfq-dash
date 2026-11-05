import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(minor: number | bigint, currency = "LKR") {
  const amount = typeof minor === "bigint" ? Number(minor) : minor;
  return new Intl.NumberFormat(currency === "LKR" ? "en-LK" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100);
}
