import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

export type ImageKind = "png" | "jpg" | "webp";

const MIME: Record<ImageKind, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

export class UploadError extends Error {}

export function sniffImage(buffer: Buffer): ImageKind | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "jpg";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

export function uploadRoot() {
  return process.env.UPLOAD_DIR ?? "./var/uploads";
}

export async function saveProductImage(file: File) {
  if (file.size <= 0) {
    throw new UploadError("The image file is empty.");
  }
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new UploadError("Product images must be 5MB or smaller.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = sniffImage(buffer);
  if (!kind) {
    throw new UploadError("Product images must be PNG, JPG, or WEBP.");
  }

  const filename = `${randomUUID()}.${kind}`;
  const directory = path.join(uploadRoot(), "products");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), buffer, { flag: "wx" });

  return {
    filename,
    url: `/api/product-images/${filename}`,
    mime: MIME[kind],
    size: buffer.length,
  };
}
