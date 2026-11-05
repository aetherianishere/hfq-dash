import { createHash, randomInt } from "node:crypto";
import { env } from "@/lib/env";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 6;

export function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtp(code: string, email: string) {
  return createHash("sha256")
    .update(`${email.toLowerCase()}:${code}:${env.authSecret}`)
    .digest("hex");
}
