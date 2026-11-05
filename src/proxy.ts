import { NextResponse, type NextRequest } from "next/server";

/**
 * The dashboard's canonical user URL is `/u/<publicId>`. Older links may use
 * the `/u?=<publicId>` form (including sub-routes such as
 * `/u?=<publicId>/orders`). Redirect those to the canonical path.
 */
const OPERATOR_URL = /^([0-9a-z]{15})(\/[A-Za-z0-9_\-/]*)?$/;

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/u") return NextResponse.next();

  const raw = request.nextUrl.searchParams.get("");
  if (!raw) return NextResponse.next();

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return NextResponse.next();
  }

  if (decoded.includes("..")) return NextResponse.next();

  const match = OPERATOR_URL.exec(decoded);
  if (!match) return NextResponse.next();

  const target = request.nextUrl.clone();
  target.pathname = `/u/${match[1]}${match[2] ?? ""}`;
  target.searchParams.delete("");

  return NextResponse.redirect(target, 308);
}

export const config = {
  matcher: "/u",
};
