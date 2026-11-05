import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireStaffPage } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · HFQ Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaffPage();

  let pendingCount = 0;
  if (!user.isDemo) {
    try {
      pendingCount = await prisma.order.count({
        where: { status: { in: ["PROOF_UPLOADED", "UNDER_REVIEW"] } },
      });
    } catch (error) {
      console.error("[admin] pending count failed", error);
    }
  } else {
    pendingCount = 7;
  }

  return (
    <AdminShell user={user} pendingCount={pendingCount}>
      {children}
    </AdminShell>
  );
}
