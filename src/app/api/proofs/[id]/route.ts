import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

const STAFF = ["SUPPORT", "STAFF", "ADMIN", "SUPER_ADMIN"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return jsonError("Sign in required.", 401);
  }

  const { id } = await params;
  const proof = await prisma.paymentProof.findUnique({
    where: { id },
    include: { order: { select: { userId: true } } },
  });

  if (!proof) {
    return jsonError("Not found.", 404);
  }

  const isOwner = proof.order.userId === session.user.id;
  const isStaff = STAFF.includes(session.user.role);

  if (!isOwner && !isStaff) {
    return jsonError("Not found.", 404);
  }

  try {
    const uploadRoot = process.env.UPLOAD_DIR ?? "./var/uploads";
    const data = await readFile(path.join(uploadRoot, proof.fileKey));

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": proof.mime,
        "Content-Disposition": `inline; filename="${encodeURIComponent(
          proof.originalName,
        )}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return jsonError("File is missing from storage.", 404);
  }
}
