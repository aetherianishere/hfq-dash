import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { jsonError } from "@/lib/http";
import { uploadRoot } from "@/lib/uploads";

export const runtime = "nodejs";

const SAFE_NAME = /^[a-f0-9-]{36}\.(png|jpg|jpeg|webp)$/;
const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  if (!SAFE_NAME.test(file)) return jsonError("Not found.", 404);

  const extension = file.split(".").pop() ?? "";
  const mime = MIME[extension];
  if (!mime) return jsonError("Not found.", 404);

  try {
    const data = await readFile(path.join(uploadRoot(), "products", file));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return jsonError("Not found.", 404);
  }
}
