import "server-only";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import type { ViewerRole } from "@/lib/auth/types";

export const STAFF_ROLES: ViewerRole[] = [
  "SUPPORT",
  "STAFF",
  "ADMIN",
  "SUPER_ADMIN",
];

export const ADMIN_ROLES: ViewerRole[] = ["ADMIN", "SUPER_ADMIN"];

export type AdminUser = {
  id: string;
  publicId: string;
  email: string;
  role: ViewerRole;
  name: string;
  totpEnabled: boolean;
  isDemo: boolean;
};

export function isStaffRole(role: string): role is ViewerRole {
  return STAFF_ROLES.includes(role as ViewerRole);
}

export function isAdminRole(role: string): role is ViewerRole {
  return ADMIN_ROLES.includes(role as ViewerRole);
}

function toAdminUser(user: {
  id: string;
  publicId: string;
  email: string;
  role: string;
  totpEnabled: boolean;
  profile: {
    firstName: string;
    lastName: string;
    displayName: string | null;
  } | null;
}): AdminUser {
  const name =
    user.profile?.displayName ||
    [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ") ||
    user.email.split("@")[0];

  return {
    id: user.id,
    publicId: user.publicId,
    email: user.email,
    role: user.role as ViewerRole,
    name,
    totpEnabled: user.totpEnabled,
    isDemo: false,
  };
}

function demoAdmin(): AdminUser {
  return {
    id: "demo",
    publicId: "b7k2m9q4v1t8z3x",
    email: "demo@hfqmc.xyz",
    role: "SUPER_ADMIN",
    name: "Demo Admin",
    totpEnabled: true,
    isDemo: true,
  };
}

export async function requireStaffPage(): Promise<AdminUser> {
  if (process.env.DEMO_MODE === "1") return demoAdmin();

  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (!isStaffRole(session.user.role)) {
    redirect(`/u/${session.user.publicId}`);
  }

  return toAdminUser(session.user);
}

export async function requireAdminPage(): Promise<AdminUser> {
  if (process.env.DEMO_MODE === "1") return demoAdmin();

  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (!isStaffRole(session.user.role)) {
    redirect(`/u/${session.user.publicId}`);
  }
  if (!isAdminRole(session.user.role)) redirect("/admin");

  return toAdminUser(session.user);
}

/**
 * API variant. Returns null instead of redirecting so route handlers can return
 * a proper JSON status. Mutations are disabled in demo mode because there is no
 * database behind the preview.
 */
export async function getStaffSession() {
  if (process.env.DEMO_MODE === "1") return null;

  const session = await getSession();
  if (!session || !isStaffRole(session.user.role)) return null;
  return session.user;
}

export async function getAdminSession() {
  if (process.env.DEMO_MODE === "1") return null;

  const session = await getSession();
  if (!session || !isAdminRole(session.user.role)) return null;
  return session.user;
}
