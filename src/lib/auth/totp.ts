import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { authenticator } from "otplib";
import { env } from "@/lib/env";

const ISSUER = "HFQ Network";
const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

function encryptionKey() {
  return createHash("sha256")
    .update(env.encryptionKey || env.authSecret)
    .digest();
}

export function encryptTotpSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptTotpSecret(payload: string) {
  const [version, iv, tag, encrypted] = payload.split(":");
  if (version !== VERSION || !iv || !tag || !encrypted) {
    throw new Error("Invalid 2FA secret.");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    encryptionKey(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function createTotpSetup(email: string) {
  const secret = authenticator.generateSecret();
  return {
    secret,
    encrypted: encryptTotpSecret(secret),
    uri: authenticator.keyuri(email, ISSUER, secret),
  };
}

export function verifyTotp(encryptedSecret: string, token: string) {
  if (!/^\d{6}$/.test(token)) return false;

  try {
    return authenticator.verify({
      token,
      secret: decryptTotpSecret(encryptedSecret),
    });
  } catch {
    return false;
  }
}

export function generateRecoveryCodes(count = 8) {
  return Array.from({ length: count }, () => {
    const raw = randomBytes(6).toString("hex").toUpperCase();
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
  });
}

export function normalizeRecoveryCode(code: string) {
  return code.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function hashRecoveryCode(code: string) {
  const normalized = normalizeRecoveryCode(code);
  return createHash("sha256")
    .update(`${normalized}:${env.authSecret}`)
    .digest("hex");
}
