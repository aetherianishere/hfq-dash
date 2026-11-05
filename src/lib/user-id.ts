import { randomBytes } from "node:crypto";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const LENGTH = 15;
const MAX_UNBIASED_BYTE = 252; // 252 is the largest multiple of 36 below 256

/**
 * 15 random base36 characters, no prefix.
 * Example: b7k2m9q4v1t8z3x
 *
 * Rejecting bytes >= 252 removes modulo bias, so every character is uniform.
 */
export function generatePublicId(): string {
  let id = "";
  while (id.length < LENGTH) {
    const bytes = randomBytes(LENGTH * 2);
    for (const byte of bytes) {
      if (byte >= MAX_UNBIASED_BYTE) continue;
      id += ALPHABET[byte % ALPHABET.length];
      if (id.length === LENGTH) break;
    }
  }
  return id;
}

export function isValidPublicId(value: string): boolean {
  return /^[0-9a-z]{15}$/.test(value);
}

/**
 * Generates an ID that is not already taken.
 * The database still has a UNIQUE index; this just avoids the common collision.
 */
export async function generateUniquePublicId(
  exists: (id: string) => Promise<boolean>,
  attempts = 8,
): Promise<string> {
  for (let i = 0; i < attempts; i += 1) {
    const id = generatePublicId();
    if (!(await exists(id))) return id;
  }
  throw new Error("Could not generate a unique public id");
}
