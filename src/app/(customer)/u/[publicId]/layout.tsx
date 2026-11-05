import { DashboardChrome } from "@/components/layout/DashboardChrome";
import { getViewer } from "@/lib/auth/viewer";
import { getStats } from "@/lib/dashboard";

export default async function CustomerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const viewer = await getViewer(publicId);
  const stats = await getStats(viewer);

  return (
    <DashboardChrome viewer={viewer} stats={stats}>
      {children}
    </DashboardChrome>
  );
}
