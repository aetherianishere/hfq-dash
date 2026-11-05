import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

export const productInputSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters.").max(80),
  slug: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug can only contain lowercase letters, numbers, and hyphens.",
      )
      .max(80)
      .optional(),
  ),
  category: z.enum(["RANK", "UPGRADE", "KEY", "SHARDS", "OTHER"]),
  price: z
    .string()
    .trim()
    .regex(/^\d{1,7}(\.\d{1,2})?$/, "Enter a valid price, e.g. 2500.00."),
  currency: z.enum(["LKR", "USD"]).default("LKR"),
  description: optionalText(2000),
  perks: optionalText(5000),
  color: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Colour must be a 6-digit hex value.")
      .optional(),
  ),
  dark: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Dark colour must be a 6-digit hex value.")
      .optional(),
  ),
  badge: optionalText(40),
  popular: z.enum(["true", "false"]).default("false"),
  active: z.enum(["true", "false"]).default("true"),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
  deliveryType: z.enum(["MANUAL", "COMMAND"]).default("MANUAL"),
  deliveryCommand: optionalText(2000),
  serverId: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const paymentAccountInputSchema = z.object({
  method: z.enum(["EZCASH", "BANK"]),
  label: z.string().trim().min(2, "Give this account a label.").max(60),
  accountName: z.string().trim().min(2, "Account name is required.").max(120),
  accountNumber: z.string().trim().min(2, "Account number is required.").max(120),
  bankName: optionalText(120),
  branch: optionalText(120),
  instructions: optionalText(1000),
  active: z.enum(["true", "false"]).default("true"),
  sortOrder: z.coerce.number().int().min(0).max(10000).default(0),
});

export function parsePriceToMinor(value: string) {
  const [whole, fraction = ""] = value.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(minor) || minor < 0) {
    throw new Error("Enter a valid price.");
  }
  return minor;
}

export function parsePerks(value: string | undefined) {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((perk) => perk.trim())
    .filter(Boolean)
    .slice(0, 30);
}
