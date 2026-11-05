import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { assertSameOrigin, jsonError } from "@/lib/http";
import { sendDiscordOrderAlert } from "@/lib/notify/discord";
import { sniffImage } from "@/lib/uploads";
import { formatMoney } from "@/lib/utils";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const ACCEPTING = ["AWAITING_PAYMENT", "PROOF_UPLOADED", "REJECTED"];

function matchesDeclaredType(
  buffer: Buffer,
  mime: string,
  extension: string,
) {
  if (mime === "application/pdf") {
    return buffer.toString("ascii", 0, 5) === "%PDF-";
  }

  const kind = sniffImage(buffer);
  if (mime === "image/png") return kind === "png";
  if (mime === "image/jpeg") return kind === "jpg";
  if (mime === "image/webp") return kind === "webp";
  return extension !== "";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", 403);
  }

  const session = await getSession();
  if (!session) {
    return jsonError("Sign in to upload a receipt.", 401);
  }

  const limited = rateLimit(`proof:${session.user.id}`, 8, 60 * 60_000);
  if (!limited.ok) {
    return jsonError("Too many uploads. Please try again later.", 429);
  }

  const { orderNumber } = await params;
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: session.user.id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      minecraftUsername: true,
      totalMinor: true,
      currency: true,
      paymentMethod: true,
      items: { select: { nameSnapshot: true } },
    },
  });

  if (!order) {
    return jsonError("Order not found.", 404);
  }
  if (!ACCEPTING.includes(order.status)) {
    return jsonError("This order is not accepting receipts.", 409);
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return jsonError("Choose a screenshot or PDF to upload.", 400);
  }
  if (file.size <= 0) {
    return jsonError("That file is empty.", 400);
  }
  if (file.size > MAX_BYTES) {
    return jsonError("File must be 10MB or smaller.", 413);
  }

  const extension = TYPES[file.type];
  if (!extension) {
    return jsonError("Only PNG, JPG, WEBP, or PDF receipts are accepted.", 415);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!matchesDeclaredType(buffer, file.type, extension)) {
    return jsonError(
      "That file does not look like a valid image or PDF receipt.",
      415,
    );
  }

  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const filename = `${randomUUID()}.${extension}`;
  const uploadRoot = process.env.UPLOAD_DIR ?? "./var/uploads";
  const directory = path.join(uploadRoot, "proofs", orderNumber);

  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), buffer);

  const fileKey = path.posix.join("proofs", orderNumber, filename);

  try {
    await prisma.$transaction([
      prisma.paymentProof.create({
        data: {
          orderId: order.id,
          fileKey,
          originalName: file.name,
          mime: file.type,
          sizeBytes: file.size,
          sha256,
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { status: "PROOF_UPLOADED" },
      }),
      prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "PROOF_UPLOADED",
          actorId: session.user.id,
          payload: { fileKey, originalName: file.name },
        },
      }),
      prisma.notification.create({
        data: {
          userId: session.user.id,
          title: "Receipt received",
          message: `We received your receipt for ${orderNumber}. A staff member will review it shortly.`,
          type: "INFO",
          link: `/u/${session.user.publicId}/orders/${orderNumber}`,
        },
      }),
    ]);
  } catch (error) {
    console.error("[proof] database write failed", error);
    return jsonError("Could not save the receipt. Please try again.", 500);
  }

  await sendDiscordOrderAlert({
    event: "PROOF_UPLOADED",
    orderNumber,
    player: order.minecraftUsername,
    items: order.items.map((item) => item.nameSnapshot).join(", "),
    total: formatMoney(order.totalMinor, order.currency),
    method:
      order.paymentMethod === "EZCASH" ? "Dialog eZ Cash" : "Bank transfer",
    adminUrl: `/admin/orders/${orderNumber}`,
    note: `Receipt uploaded: ${file.name}`,
  });

  return NextResponse.json({ ok: true });
}
