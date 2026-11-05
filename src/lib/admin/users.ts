import "server-only";

import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";

export type AdminUserRow = {
  id: string;
  publicId: string;
  email: string;
  name: string;
  role: Role;
  emailVerified: boolean;
  totpEnabled: boolean;
  isFounder: boolean;
  isSuspended: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
};

export type AdminUserPage = {
  rows: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function getAdminUsers({
  q = "",
  page = 1,
  pageSize = 25,
}: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<AdminUserPage> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeQuery = q.trim().slice(0, 80);

  const where = safeQuery
    ? {
        OR: [
          { email: { contains: safeQuery } },
          { publicId: { contains: safeQuery } },
          { profile: { is: { displayName: { contains: safeQuery } } } },
          { profile: { is: { firstName: { contains: safeQuery } } } },
          { profile: { is: { lastName: { contains: safeQuery } } } },
        ],
      }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ role: "desc" }, { createdAt: "desc" }],
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        publicId: true,
        email: true,
        role: true,
        emailVerified: true,
        totpEnabled: true,
        isFounder: true,
        isSuspended: true,
        createdAt: true,
        lastLoginAt: true,
        profile: {
          select: { displayName: true, firstName: true, lastName: true },
        },
      },
    }),
  ]);

  return {
    rows: users.map((user) => ({
      id: user.id,
      publicId: user.publicId,
      email: user.email,
      name:
        user.profile?.displayName ||
        [user.profile?.firstName, user.profile?.lastName]
          .filter(Boolean)
          .join(" ") ||
        user.email.split("@")[0],
      role: user.role,
      emailVerified: user.emailVerified,
      totpEnabled: user.totpEnabled,
      isFounder: user.isFounder,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    })),
    total,
    page: safePage,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}
